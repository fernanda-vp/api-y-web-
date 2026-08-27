import { z } from 'zod';
import { statusSchema } from './status';

export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  rfc: z.string(),
  statusId: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Company = z.infer<typeof companySchema>;

export const companyListSchema = z.array(companySchema);

export const createCompanySchema = z.object({
  name: z.string().min(1).max(200),
  rfc: z.string().min(1).max(13),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

export const updateCompanySchema = createCompanySchema.partial();
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const companyStatusFilterSchema = z.enum(['active', 'inactive']);
export type CompanyStatusFilter = z.infer<typeof companyStatusFilterSchema>;
