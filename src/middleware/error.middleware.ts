import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';
import { Prisma } from '../../generated/prisma';
import { config } from '@/config/env';

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof Prisma.PrismaClientKnownRequestError
        ? 400
        : 500;
    const message = error.message || 'Internal server error';
    error = new ApiError(statusCode, message, false);
  }

  next(error);
};

export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  let { statusCode, message } = err;

  if (config.isProduction && !err.isOperational) {
    statusCode = 500;
    message = 'Internal server error';
  }

  res.locals.errorMessage = message;

  const response = {
    success: false,
    statusCode,
    message,
    ...(config.isDevelopment && { stack: err.stack }),
  };

  if (config.isDevelopment) {
    logger.error('Error:', err);
  }

  res.status(statusCode).json(response);
};
