import { z } from 'zod';
import { paginatedSchema, type PaginationParams } from './pagination';
import { statusSchema } from './status';

export const departmentSchema = z.object({
  id: z.number(),
  companyId: z.number(),
  name: z.string(),
  parentDepartmentId: z.number().nullable(),
  statusId: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Department = z.infer<typeof departmentSchema>;

export const departmentsPageSchema = paginatedSchema(departmentSchema);

const departmentTreeBaseSchema = departmentSchema.extend({
  parentId: z.number().nullable(),
});

export interface DepartmentTreeNode extends z.infer<typeof departmentTreeBaseSchema> {
  children: DepartmentTreeNode[];
}

export const departmentTreeNodeSchema: z.ZodType<DepartmentTreeNode> = departmentTreeBaseSchema.extend({
  children: z.lazy(() => z.array(departmentTreeNodeSchema)),
});

export const createDepartmentSchema = z.object({
  companyId: z.number(),
  name: z.string().min(1).max(200),
  parentDepartmentId: z.number().optional(),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentDepartmentId: z.number().nullable().optional(),
});
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

export const departmentStatusFilterSchema = z.enum(['active', 'inactive']);
export type DepartmentStatusFilter = z.infer<typeof departmentStatusFilterSchema>;

export interface FindDepartmentsParams extends PaginationParams {
  companyId?: number;
  parentDepartmentId?: number;
  status?: DepartmentStatusFilter;
  search?: string;
}
