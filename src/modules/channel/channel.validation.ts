import { z } from "zod";

export const channelValidation = {
  create: z.object({
    body: z.object({
      name: z.string({ required_error: "Channel name is required" }),
      image: z.string({ required_error: "Channel image is required" }),
    }),
  }),

  update: z.object({
    params: z.object({
      id: z.string({ required_error: "Channel ID is required" }),
    }),
    body: z.object({
      name: z.string().optional(),
      image: z.string().optional(),
    }),
  }),
  delete: z.object({
    params: z.object({ id: z.string() })
  })
};

