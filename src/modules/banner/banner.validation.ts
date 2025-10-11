import { z } from "zod";

export const bannerValidation = {
  create: z.object({
    body: z.object({
      title: z.string().optional(),
      image: z.string().min(1, "Image link is required"),
      link: z.string().min(1, "Redirect link is required"),
    }),
  }),
  update: z.object({
    body: z.object({
      title: z.string().optional(),
      image: z.string().optional(),
      link: z.string().optional(),
    }),
  }),
};
