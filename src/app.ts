import express from "express"
import type { Application, Request, RequestHandler, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from '@/config/env';
import { rateLimiter } from '@/middleware/rate-limiter.middleware';
import { errorConverter, errorHandler } from './middleware/error.middleware';
import { ApiError } from '@/utils/api-error';
import authRoutes from '@/modules/auth/auth.routes';
import bannerRouter from "./modules/banner/banner.routes";
import courseRouter from "@/modules/course/course.routes";

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression() as unknown as RequestHandler);

// Logging
if (config.isDevelopment) app.use(morgan('dev'));


// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use("/api/v1/banner", bannerRouter);
app.use('/api/v1/course', courseRouter);

// 404 handler
app.use((_req: Request, _res: Response) => {
  throw ApiError.notFound('Route not found');
});

// Error handling
app.use(errorConverter);
app.use(errorHandler);

export default app;

