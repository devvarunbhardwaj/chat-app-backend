import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { rateLimiter } from '@/middleware/rate-limiter.middleware';
import { bannerValidation } from './banner.validation';
import { bannerController } from './banner.controller';
import { authenticate, authorize } from '@/middleware/auth.middleware';

const router = Router();

router.post(
  "/create",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(bannerValidation.create),
  bannerController.create
);

router.put(
  "/update/:id",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(bannerValidation.update),
  bannerController.update
);

router.get(
  "/",
  rateLimiter,
  bannerController.get
);

router.delete(
  "/delete/:id",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  bannerController.delete
);

export default router;
