import { z } from 'zod';

export const loginRequestSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const employeeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  code: z.string(),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  terminationDate: z.coerce.date().nullable(),
  statusId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const meResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  lastName: z.string(),
  photoUrl: z.string().nullable(),
  employee: employeeSchema.nullable(),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
