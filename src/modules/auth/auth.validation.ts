import { z } from 'zod';

export const authValidation = {
  register: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      phoneNumber: z.string().min(10).max(10),
      name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    }),
  }),

  login: z.object({
    body: z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    }),
  }),
};
