import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env';
import { rateLimiter } from './middleware/rateLimiter.middleware';
import { errorConverter, errorHandler } from './middleware/error.middleware';
import { ApiError } from './utils/ApiError';
import authRoutes from './modules/auth/auth.routes';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.isDevelopment) {
  app.use(morgan('dev'));
}

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  throw ApiError.notFound('Route not found');
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;

