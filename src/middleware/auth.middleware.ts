import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error';
import { catchAsync } from '../utils/catch-async';
import { config } from '../config/env';
import { prisma } from '../config/database';

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

export const authenticate = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized('No token provided');

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, name: true }
      });

      if (!user) {
        throw ApiError.unauthorized('User not found or inactive');
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
      next();
    } catch (error) {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }
);

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized('Authentication required');

    if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient permissions');

    next();
  };
};
