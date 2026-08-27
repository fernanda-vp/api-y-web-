import { z } from 'zod';

export const statusSchema = z.object({
  id: z.number(),
  groupId: z.number(),
  code: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Status = z.infer<typeof statusSchema>;
