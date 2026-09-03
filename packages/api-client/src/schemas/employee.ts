import { z } from 'zod';
import { paginatedSchema, type PaginationParams } from './pagination';
import { statusSchema } from './status';

const employeeUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  lastName: z.string(),
  photoUrl: z.string().nullable(),
  statusId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const contractTypeSchema = z.enum(['INDEFINITE', 'FIXED_TERM', 'PROJECT', 'INTERN']);
export type ContractType = z.infer<typeof contractTypeSchema>;

export const employeeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  code: z.string(),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  hireDate: z.coerce.date(),
  contractType: contractTypeSchema,
  contractEndDate: z.coerce.date().nullable(),
  terminationDate: z.coerce.date().nullable(),
  statusId: z.number(),
  status: statusSchema,
  user: employeeUserSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Employee = z.infer<typeof employeeSchema>;

export const employeesPageSchema = paginatedSchema(employeeSchema);

export const createEmployeeSchema = z.object({
  name: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  code: z.string().min(1).max(50),
  phone: z.string().max(30).optional(),
  bio: z.string().max(2000).optional(),
  hireDate: z.coerce.date().optional(),
  contractType: contractTypeSchema.optional(),
  contractEndDate: z.coerce.date().optional(),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const createEmployeeResponseSchema = z.object({
  employee: employeeSchema,
  temporaryPassword: z.string(),
});
export type CreateEmployeeResponse = z.infer<typeof createEmployeeResponseSchema>;

export const updateEmployeeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(50).optional(),
  phone: z.string().max(30).optional(),
  bio: z.string().max(2000).optional(),
  hireDate: z.coerce.date().optional(),
  contractType: contractTypeSchema.optional(),
  contractEndDate: z.coerce.date().nullable().optional(),
});
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const updateMyProfileSchema = z.object({
  // `null` explícito = "borrar este campo"; `undefined`/omitido = "no tocar".
  photoUrl: z.string().url().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
});
export type UpdateMyProfileInput = z.infer<typeof updateMyProfileSchema>;

export const employeeStatusFilterSchema = z.enum(['active', 'inactive', 'terminated']);
export type EmployeeStatusFilter = z.infer<typeof employeeStatusFilterSchema>;

export interface FindEmployeesParams extends PaginationParams {
  status?: EmployeeStatusFilter;
  search?: string;
}
