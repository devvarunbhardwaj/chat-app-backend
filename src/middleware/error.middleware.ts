import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../config/logger';
import { Prisma } from '../../generated/prisma';
import { config } from '@/config/env';

const handlePrismaError = (error: any): ApiError => {
  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    const fields = error.meta?.target || ['field'];
    const fieldNames = Array.isArray(fields) ? fields.join(', ') : fields;
    return ApiError.conflict(
      `A record with this ${fieldNames} already exists`
    );
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return ApiError.notFound(
      error.meta?.cause || 'Record not found'
    );
  }

  // P2003: Foreign key constraint violation
  if (error.code === 'P2003') {
    const field = error.meta?.field_name || 'field';
    return ApiError.badRequest(
      `Invalid reference: ${field} does not exist`
    );
  }

  // P2014: Invalid relation
  if (error.code === 'P2014') {
    return ApiError.badRequest(
      'The change would violate a required relation'
    );
  }

  // P2011: Null constraint violation
  if (error.code === 'P2011') {
    const field = error.meta?.constraint || 'field';
    return ApiError.badRequest(
      `Required field ${field} cannot be null`
    );
  }

  // P2012: Missing required value
  if (error.code === 'P2012') {
    const field = error.meta?.path || 'field';
    return ApiError.badRequest(
      `Required value missing for ${field}`
    );
  }

  // P2000: Value too long for column
  if (error.code === 'P2000') {
    const field = error.meta?.column_name || 'field';
    return ApiError.badRequest(
      `Value provided for ${field} is too long`
    );
  }

  // P2001: Record does not exist (where condition)
  if (error.code === 'P2001') {
    return ApiError.notFound(
      'The record you are looking for does not exist'
    );
  }

  // P2015: Related record not found
  if (error.code === 'P2015') {
    return ApiError.notFound(
      'A related record was not found'
    );
  }

  // P2016: Query interpretation error
  if (error.code === 'P2016') {
    return ApiError.badRequest(
      'Query interpretation error: invalid query parameters'
    );
  }

  // P2021: Table does not exist
  if (error.code === 'P2021') {
    return ApiError.internal(
      'Database schema error: table not found'
    );
  }

  // P2022: Column does not exist
  if (error.code === 'P2022') {
    return ApiError.internal(
      'Database schema error: column not found'
    );
  }

  // Default Prisma error
  return ApiError.badRequest(
    error.message || 'Database operation failed'
  );
};

export const errorConverter = (err: any, _req: Request, _res: Response, next: NextFunction) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      error = handlePrismaError(error);
    }
    // Handle Prisma validation errors
    else if (error instanceof Prisma.PrismaClientValidationError) {
      error = ApiError.badRequest('Invalid data provided: please check your input');
    }
    // Handle Prisma initialization errors
    else if (error instanceof Prisma.PrismaClientInitializationError) {
      error = ApiError.internal('Database connection error');
    }
    // Handle Prisma Rust panic errors
    else if (error instanceof Prisma.PrismaClientRustPanicError) {
      error = ApiError.internal('A critical database error occurred');
    }
    // Handle generic errors
    else {
      const statusCode = error.statusCode || 500;
      const message = error.message || 'Internal server error';
      error = new ApiError(statusCode, message, false);
    }
  }

  next(error);
};

export const errorHandler = (err: ApiError, _req: Request, res: Response, _next: NextFunction) => {
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
