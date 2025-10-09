import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { authenticate } from '@/middleware/auth.middleware';
import { authLimiter } from '@/middleware/rate-limiter.middleware';
import { authValidation } from './auth.validation';
import { authController } from './auth.controller';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate(authValidation.register),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(authValidation.login),
  authController.login
);

router.get('/me', authenticate, authController.me);

export default router;
