import { z } from 'zod';

export const courseValidation = {
  create: z.object({
    body: z.object({
      name: z.string(),
      image: z.string(),
    }),
  }),

  update: z.object({
    params: z.object({ id: z.string() }),
    body: z.object({
      name: z.string().optional(),
      image: z.string().optional(),
    }),
  }),

  delete: z.object({
    params: z.object({ id: z.string() })
  })
};
