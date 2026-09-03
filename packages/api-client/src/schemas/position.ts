import { z } from 'zod';
import { departmentSchema } from './department';
import { employeeSchema } from './employee';
import { jobTitleSchema } from './job-title';
import { paginatedSchema, type PaginationParams } from './pagination';
import { statusSchema } from './status';
import { zoneSchema } from './zone';

export const positionSchema = z.object({
  id: z.number(),
  employeeId: z.number(),
  employee: employeeSchema,
  jobTitleId: z.number(),
  jobTitle: jobTitleSchema,
  departmentId: z.number(),
  department: departmentSchema,
  zoneId: z.number(),
  zone: zoneSchema,
  managerPositionId: z.number().nullable(),
  functionalManagerPositionId: z.number().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  statusId: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Position = z.infer<typeof positionSchema>;

export const positionsPageSchema = paginatedSchema(positionSchema);

export const managerResolutionSchema = z.object({
  source: z.enum(['explicit', 'derived', 'ambiguous', 'none']),
  position: positionSchema.optional(),
  candidates: z.array(positionSchema).optional(),
});
export type ManagerResolution = z.infer<typeof managerResolutionSchema>;

export const positionWithManagerResolutionSchema = positionSchema.extend({
  managerResolution: managerResolutionSchema,
});
export type PositionWithManagerResolution = z.infer<typeof positionWithManagerResolutionSchema>;

export const createPositionSchema = z.object({
  employeeId: z.number(),
  jobTitleId: z.number(),
  departmentId: z.number(),
  zoneId: z.number(),
  managerPositionId: z.number().optional(),
  functionalManagerPositionId: z.number().optional(),
  startDate: z.coerce.date().optional(),
});
export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = z.object({
  managerPositionId: z.number().nullable().optional(),
  functionalManagerPositionId: z.number().nullable().optional(),
});
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

export const transferPositionSchema = z.object({
  jobTitleId: z.number(),
  departmentId: z.number(),
  zoneId: z.number(),
  managerPositionId: z.number().optional(),
  functionalManagerPositionId: z.number().optional(),
  effectiveDate: z.coerce.date().optional(),
});
export type TransferPositionInput = z.infer<typeof transferPositionSchema>;

export const endPositionSchema = z.object({
  effectiveDate: z.coerce.date().optional(),
});
export type EndPositionInput = z.infer<typeof endPositionSchema>;

export const positionStatusFilterSchema = z.enum(['active', 'ended']);
export type PositionStatusFilter = z.infer<typeof positionStatusFilterSchema>;

export interface FindPositionsParams extends PaginationParams {
  employeeId?: number;
  departmentId?: number;
  zoneId?: number;
  jobTitleId?: number;
  status?: PositionStatusFilter;
}
