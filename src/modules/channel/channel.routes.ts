import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { rateLimiter } from '@/middleware/rate-limiter.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { channelController } from './channel.controller';
import { channelValidation } from './channel.validation';

const router = Router();

router.post(
  "/",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(channelValidation.create),
  channelController.create
);

router.put(
  "/:id",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(channelValidation.update),
  channelController.update
);

router.get(
  "/",
  rateLimiter,
  channelController.get
);

router.delete(
  "/:id",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(channelValidation.delete),
  channelController.delete
);

export default router;
