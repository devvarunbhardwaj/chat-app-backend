import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error';
import { catchAsync } from '../utils/catch-async';
import { config } from '../config/env';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  name: string;
}

export const authenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized('No token provided');

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };

      next();
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }
);

export const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required');

    if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient permissions');

    next();
  };
};
