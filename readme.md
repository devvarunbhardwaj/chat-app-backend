# chat-app-backend

A production-ready backend built with **Bun**, **Express**, **Socket.IO**, and **PostgreSQL (via Prisma)**. The project is organized around a module-based architecture covering authentication, real-time channels, courses, and banners — each following a consistent controller → service → database pattern.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [How It's Built](#how-its-built)
  - [Server Bootstrap](#1-server-bootstrap)
  - [Environment Validation](#2-environment-validation-srcconfigenvts)
  - [Database Layer](#3-database-layer-srcconfigdatabasets)
  - [Middleware Stack](#4-middleware-stack)
  - [Authentication](#5-authentication)
  - [Real-time with Socket.IO](#6-real-time-with-socketio)
  - [Module Pattern](#7-module-pattern-routes--controller--service)
  - [Error Handling](#8-error-handling)
  - [Utilities](#9-utilities)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Architecture Overview

```
HTTP Request
    │
    ▼
[ Helmet · CORS · Compression · Morgan ]   ← global middleware
    │
    ▼
[ Rate Limiter ]                            ← express-rate-limit
    │
    ▼
[ Zod Validation ]                          ← validate() middleware
    │
    ▼
[ JWT Auth ]                                ← authenticate() middleware
    │
    ▼
[ Route Handler ]
    │
    ▼
[ Controller ]   →   [ Service ]   →   [ Prisma / PostgreSQL ]
    │
    ▼
[ ApiResponse ]                             ← standardised JSON response
    │
    ▼
[ ErrorConverter → ErrorHandler ]           ← global error pipeline

WebSocket (Socket.IO)
    │
    ▼
[ socketAuthMiddleware ]                    ← JWT verified on handshake
    │
    ▼
[ io.on('connection') ]
```

---

## Project Structure

```
chat-app-backend/
├── prisma/
│   └── schema.prisma           # All models: User, Banner, Course, CourseContent, Channel, ChannelMessage
├── src/
│   ├── index.ts                # Entry point: HTTP server, Socket.IO, graceful shutdown
│   ├── app.ts                  # Express app: middleware stack + route mounting
│   ├── config/
│   │   ├── env.ts              # Zod env schema + config object
│   │   ├── database.ts         # Prisma singleton + connect/disconnect helpers
│   │   └── logger.ts           # Custom Logger class (info/error/warn/debug)
│   ├── middleware/
│   │   ├── auth.middleware.ts          # authenticate() + authorize(...roles)
│   │   ├── error.middleware.ts         # errorConverter + errorHandler
│   │   ├── rate-limiter.middleware.ts  # global rateLimiter + strict authLimiter
│   │   └── validation.middleware.ts    # Zod-powered validate() wrapper
│   ├── modules/
│   │   ├── auth/               # register, login, /me
│   │   ├── banner/             # Banner CRUD
│   │   ├── course/             # Course + CourseContent CRUD
│   │   └── channel/            # Channel CRUD
│   ├── socket/
│   │   ├── socket.server.ts            # Socket.IO server init
│   │   └── middleware/
│   │       └── socket-auth.middleware.ts  # JWT verification for WS connections
│   ├── types/
│   │   └── socket.ts           # AuthenticatedSocket, JwtPayload types
│   └── utils/
│       ├── api-error.ts        # ApiError class with static factory methods
│       ├── api-response.ts     # ApiResponse class (success / created / noContent)
│       └── catch-async.ts      # Async error wrapper for Express handlers
├── docker-compose.yaml         # PostgreSQL local setup
├── biome.json                  # Linter + formatter config
├── package.json
└── tsconfig.json
```

---

## How It's Built

### 1. Server Bootstrap (`src/index.ts`)

The entry point ties everything together in a deliberate order:

```ts
const startServer = async () => {
  await connectDatabase();                      // 1. Connect Prisma to Postgres
  const httpServer = createServer(app);         // 2. Wrap Express in Node HTTP server
  io = initializeSocketServer(httpServer);      // 3. Attach Socket.IO to same port
  server = httpServer.listen(config.port);      // 4. Start listening
};
```

**Graceful shutdown** is handled via `SIGTERM` and `SIGINT` signals — Socket.IO closes first, then the HTTP server, then the database connection disconnects cleanly.

**Process-level safety:**
- `unhandledRejection` → logs and exits with code 1
- `uncaughtException` → logs and exits with code 1

---

### 2. Environment Validation (`src/config/env.ts`)

All env vars are validated at startup using a **Zod schema**. If any required variable is missing or wrong, the process exits immediately with a clear error — no silent failures.

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32),    // enforces a minimum-length secret
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  BCRYPT_ROUNDS: z.string().default('10'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  ADMIN_EMAILS: z.string(),          // comma-separated list of admin emails
});
```

The parsed result is exported as a typed `config` object used everywhere else in the codebase.

---

### 3. Database Layer (`src/config/database.ts`)

Uses a **Prisma singleton** to avoid multiple client instances in development (a common hot-reload pitfall):

```ts
const prismaClientSingleton = () =>
  new PrismaClient({ log: config.isDevelopment ? ['query', 'error', 'warn'] : ['error'] });

declare global { var prisma: ReturnType<typeof prismaClientSingleton> | undefined; }

export const prisma = globalThis.prisma ?? prismaClientSingleton();
if (config.isDevelopment) globalThis.prisma = prisma;
```

In development, query logs are enabled. In production, only errors are logged.

---

### 4. Middleware Stack

Applied globally in `src/app.ts` in this order:

| Middleware | Purpose |
|---|---|
| `helmet()` | Sets secure HTTP headers (XSS, clickjacking, etc.) |
| `cors({ origin: config.cors.origin })` | Allows only configured origins; credentials enabled |
| `express.json({ limit: '10mb' })` | Body parsing with size cap |
| `compression()` | Gzip/deflate compression on responses |
| `morgan('dev')` | HTTP request logging (development only) |
| `rateLimiter` | Global IP-based rate limit (configurable via env) |

**Rate limiting** (`src/middleware/rate-limiter.middleware.ts`) has two tiers:

```ts
// Global: applied to every route
export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,  // default: 15 minutes
  max: config.rateLimit.max,            // default: 100 requests
});

// Auth-specific: stricter, skips successful requests
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});
```

---

### 5. Authentication

**HTTP (`src/middleware/auth.middleware.ts`)**

Two exported middleware functions:

- `authenticate` — extracts the `Bearer` token from the `Authorization` header, verifies it with `jwt.verify`, and attaches the decoded user (`id`, `email`, `role`, `name`) to `req.user`.
- `authorize(...roles)` — checks that `req.user.role` is in the allowed roles list; throws `403 Forbidden` if not.

```ts
// Usage on a protected, admin-only route:
router.post('/', authenticate, authorize('ADMIN'), validate(schema), controller.create);
```

**Auth service (`src/modules/auth/auth.service.ts`)**

- **Register**: checks for duplicate email/phone → hashes password with `bcrypt` → creates user → auto-assigns `ADMIN` role if the email is in `config.admins` → returns a JWT.
- **Login**: looks up user by email → compares password with `bcrypt.compare` → returns JWT on success.
- **Token**: signed with `jwt.sign` using `config.jwt.secret`; expiry currently set to `15d`.

---

### 6. Real-time with Socket.IO

**Server init (`src/socket/socket.server.ts`)**

```ts
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  transports: ['websocket', 'polling'],
  connectTimeout: 45000,
  pingTimeout: 30000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
});
```

Socket.IO is attached to the **same HTTP server** as Express, so both REST and WebSocket traffic share a single port.

**Socket auth middleware (`src/socket/middleware/socket-auth.middleware.ts`)**

JWT is verified on every incoming socket connection. The token can be passed in three ways:

```ts
const token =
  socket.handshake.auth?.token ||
  socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
  socket.handshake.query?.token;
```

On success, the decoded payload is attached as `socket.user` (typed as `AuthenticatedSocket`). On failure, the connection is rejected with a descriptive error and the rejection is logged with the socket ID.

---

### 7. Module Pattern (Routes → Controller → Service)

Every feature module (`auth`, `banner`, `course`, `channel`) follows the same layered structure:

```
auth.routes.ts       →  defines Express routes, applies middleware
auth.controller.ts   →  extracts req data, calls service, sends ApiResponse
auth.service.ts      →  contains all business logic + Prisma queries
auth.validation.ts   →  Zod schemas for each route's body/params/query
```

**Validation (`src/middleware/validation.middleware.ts`)** wraps Zod parsing into an Express middleware:

```ts
export const validate = (schema: any) =>
  async (req, _res, next) => {
    await schema.parseAsync({ body: req.body, query: req.query, params: req.params });
    // On ZodError → formats all field issues into one readable string → ApiError.badRequest()
  };
```

---

### 8. Error Handling

A two-stage global error pipeline sits at the end of `app.ts`:

**Stage 1 — `errorConverter`**: converts any error type into an `ApiError`.

It handles the full set of Prisma error codes explicitly:

| Prisma Code | Meaning | HTTP Response |
|---|---|---|
| P2002 | Unique constraint violation | 409 Conflict |
| P2025 | Record not found | 404 Not Found |
| P2003 | Foreign key violation | 400 Bad Request |
| P2011 | Null constraint | 400 Bad Request |
| P2021/P2022 | Schema mismatch | 500 Internal |

**Stage 2 — `errorHandler`**: sends the final JSON response.

```ts
// In production, non-operational errors are masked:
if (config.isProduction && !err.isOperational) {
  statusCode = 500;
  message = 'Internal server error';
}
// In development, the full stack trace is included in the response.
```

**`ApiError` (`src/utils/api-error.ts`)** uses static factory methods for clean throw syntax:

```ts
throw ApiError.notFound('User not found');
throw ApiError.conflict('Email already registered');
throw ApiError.unauthorized('Invalid or expired token');
```

**`catchAsync` (`src/utils/catch-async.ts`)** eliminates try/catch boilerplate in every controller:

```ts
export const catchAsync = (fn: Function) =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
```

---

### 9. Utilities

**`ApiResponse` (`src/utils/api-response.ts`)** — standardises every success response shape:

```ts
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": { ... }
}
```

Static methods: `ApiResponse.success(data, message)`, `ApiResponse.created(data, message)`, `ApiResponse.noContent()`.

**`Logger` (`src/config/logger.ts`)** — custom class with `info`, `error`, `warn`, `debug`. Debug logs only print in development. Every log includes an ISO timestamp.

---

## Data Models

```prisma
model User {
  id          String   @id @default(uuid())
  email       String   @unique
  phoneNumber String   @unique
  password    String
  name        String
  role        Role     @default(USER)   // USER | ADMIN
}

model Banner {
  id    String  @id @default(uuid())
  title String?
  image String  @unique
  link  String
}

model Course {
  id       String          @id @default(cuid())
  name     String
  image    String?
  contents CourseContent[]
}

model CourseContent {
  id          String      @id @default(cuid())
  type        ContentType            // TEXT | IMAGE | VIDEO
  description String?
  assetLink   String?
  courseId    String
  course      Course      @relation(...)
}

model Channel {
  id       String           @id @default(cuid())
  name     String
  image    String
  messages ChannelMessage[]
}

model ChannelMessage {
  id          String      @id @default(cuid())
  message     String?
  assetLink   String?
  contentType ContentType  // TEXT | IMAGE | VIDEO
  channelId   String
  channel     Channel      @relation(...)
}
```

---

## API Reference

All routes are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ✗ | Register a new user. Returns `{ user, token }`. |
| `POST` | `/login` | ✗ | Login. Returns `{ user, token }`. |
| `GET` | `/me` | ✓ Bearer | Returns the authenticated user from the token. |

### Banners — `/api/v1/banner`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | ✓ ADMIN | Create a banner. |
| `PUT` | `/:id` | ✓ ADMIN | Update a banner. |
| `GET` | `/` | ✗ | List all banners. |
| `DELETE` | `/:id` | ✓ ADMIN | Delete a banner. |

### Courses — `/api/v1/course`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | ✓ ADMIN | Create a course. |
| `PUT` | `/:id` | ✓ ADMIN | Update a course. |
| `GET` | `/` | ✗ | List all courses. |
| `DELETE` | `/:id` | ✓ ADMIN | Delete a course. |

### Channels — `/api/v1/channel`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | ✓ ADMIN | Create a channel. |
| `PUT` | `/:id` | ✓ ADMIN | Update a channel. |
| `GET` | `/` | ✗ | List all channels. |
| `DELETE` | `/:id` | ✓ ADMIN | Delete a channel. |

### Health Check

```
GET /health
→ { "success": true, "message": "Server is healthy", "timestamp": "..." }
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Minimum 32 characters |
| `ADMIN_EMAILS` | ✅ | — | Comma-separated list of admin emails |
| `PORT` | ✗ | `3000` | HTTP server port |
| `NODE_ENV` | ✗ | `development` | `development` / `production` / `test` |
| `JWT_ACCESS_EXPIRATION` | ✗ | `15m` | JWT expiry duration |
| `BCRYPT_ROUNDS` | ✗ | `10` | bcrypt hash rounds |
| `CORS_ORIGIN` | ✗ | `*` | Comma-separated allowed origins |
| `RATE_LIMIT_WINDOW_MS` | ✗ | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | ✗ | `100` | Max requests per window per IP |

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/devvarunbhardwaj/chat-app-backend.git
cd chat-app-backend

# 2. Install dependencies
bun install

# 3. Start PostgreSQL via Docker
docker compose up -d

# 4. Set up environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, ADMIN_EMAILS at minimum

# 5. Run migrations
bun run prisma:migrate

# 6. Start dev server (with hot reload)
bun run dev
```

Server starts at `http://localhost:3000` and WebSocket at `ws://localhost:3000`.

---

## Scripts

| Script | What it does |
|---|---|
| `bun run dev` | Start with hot-reload (`--watch`) |
| `bun run build` | Clean `dist/` and compile with Bun bundler (minified + sourcemaps) |
| `bun run start` | Run compiled `dist/index.js` |
| `bun run start:prod` | Same but with `NODE_ENV=production` |
| `bun run typecheck` | TypeScript check with no output |
| `bun run lint` | Biome lint on `src/` |
| `bun run format` | Biome format on `src/` |
| `bun run test` | Bun test runner |
| `bun run prisma:generate` | Regenerate Prisma client after schema changes |
| `bun run prisma:migrate` | Apply pending migrations (`migrate deploy`) |
| `bun run prisma:studio` | Open Prisma Studio GUI |
