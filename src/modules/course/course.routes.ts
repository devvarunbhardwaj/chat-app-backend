import { Router } from 'express';
import { validate } from '@/middleware/validation.middleware';
import { rateLimiter } from '@/middleware/rate-limiter.middleware';
import { authenticate, authorize } from '@/middleware/auth.middleware';
import { courseValidation } from './course.validation';
import { courseController } from './course.controller';

const router = Router();

router.post(
  "/",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(courseValidation.create),
  courseController.create
);

router.put(
  "/:id",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(courseValidation.update),
  courseController.update
);

router.get(
  "/",
  rateLimiter,
  courseController.get
);

router.delete(
  "/:id",
  rateLimiter,
  authenticate,
  authorize("ADMIN"),
  validate(courseController.delete),
  courseController.delete
);

export default router;
