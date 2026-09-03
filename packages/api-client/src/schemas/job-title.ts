import { z } from 'zod';
import { paginatedSchema, type PaginationParams } from './pagination';
import { statusSchema } from './status';

export const jobTitleSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentJobTitleId: z.number().nullable(),
  statusId: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type JobTitle = z.infer<typeof jobTitleSchema>;

export const jobTitlesPageSchema = paginatedSchema(jobTitleSchema);

const jobTitleTreeBaseSchema = jobTitleSchema.extend({
  parentId: z.number().nullable(),
});

export interface JobTitleTreeNode extends z.infer<typeof jobTitleTreeBaseSchema> {
  children: JobTitleTreeNode[];
}

export const jobTitleTreeNodeSchema: z.ZodType<JobTitleTreeNode> = jobTitleTreeBaseSchema.extend({
  children: z.lazy(() => z.array(jobTitleTreeNodeSchema)),
});

export const createJobTitleSchema = z.object({
  name: z.string().min(1).max(200),
  parentJobTitleId: z.number().optional(),
});
export type CreateJobTitleInput = z.infer<typeof createJobTitleSchema>;

export const updateJobTitleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentJobTitleId: z.number().nullable().optional(),
});
export type UpdateJobTitleInput = z.infer<typeof updateJobTitleSchema>;

export const jobTitleStatusFilterSchema = z.enum(['active', 'inactive']);
export type JobTitleStatusFilter = z.infer<typeof jobTitleStatusFilterSchema>;

export interface FindJobTitlesParams extends PaginationParams {
  parentJobTitleId?: number;
  status?: JobTitleStatusFilter;
  search?: string;
}
