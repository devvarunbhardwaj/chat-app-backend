import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/api-error';

export const validate = (schema: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((issue) => {
          const path = issue.path.length > 0 ? `${issue.path.join('.')}` : 'root';
          return `${path}: ${issue.message}`;
        });
        next(ApiError.badRequest(messages.join(', ')));
      } else {
        next(error);
      }
    }
  };
};
