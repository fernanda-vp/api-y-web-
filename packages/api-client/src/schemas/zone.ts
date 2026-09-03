import { z } from 'zod';
import { paginatedSchema, type PaginationParams } from './pagination';
import { statusSchema } from './status';

export const zoneSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  name: z.string(),
  address: z.string(),
  statusId: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Zone = z.infer<typeof zoneSchema>;

export const zonesPageSchema = paginatedSchema(zoneSchema);

export const createZoneSchema = z.object({
  companyId: z.number(),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(300),
});
export type CreateZoneInput = z.infer<typeof createZoneSchema>;

export const updateZoneSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  address: z.string().min(1).max(300).optional(),
});
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;

export const zoneStatusFilterSchema = z.enum(['active', 'inactive']);
export type ZoneStatusFilter = z.infer<typeof zoneStatusFilterSchema>;

export interface FindZonesParams extends PaginationParams {
  companyId?: number;
  status?: ZoneStatusFilter;
  search?: string;
}
