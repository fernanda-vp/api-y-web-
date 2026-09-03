import { z } from 'zod';
import { statusSchema } from './status';

export const scopeTypeSchema = z.enum(['GLOBAL', 'COMPANY', 'ZONE', 'DEPARTMENT', 'JOB_TITLE']);
export type ScopeType = z.infer<typeof scopeTypeSchema>;

// Forma mínima anidada en `Role.rolePermissions` — no incluye `dependsOn`
// porque el backend no trae esa relación anidada ahí (Prisma no cascada
// `include`); el chequeo de dependencias se hace cruzando `role.rolePermissions`
// (solo necesita el `id`) contra el catálogo completo de `GET /permissions`.
const rolePermissionEntrySchema = z.object({
  id: z.number(),
  action: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const permissionSchema = rolePermissionEntrySchema.extend({
  dependsOn: z.array(z.number()),
});
export type Permission = z.infer<typeof permissionSchema>;

export const roleSchema = z.object({
  id: z.number(),
  name: z.string(),
  isSystem: z.boolean(),
  statusId: z.number(),
  status: statusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  rolePermissions: z.array(z.object({ permission: rolePermissionEntrySchema })),
});
export type Role = z.infer<typeof roleSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const grantPermissionSchema = z.object({
  permissionId: z.number(),
});
export type GrantPermissionInput = z.infer<typeof grantPermissionSchema>;

export const bulkSetPermissionsSchema = z.object({
  permissionIds: z.array(z.number()).min(1),
  grant: z.boolean(),
});
export type BulkSetPermissionsInput = z.infer<typeof bulkSetPermissionsSchema>;

export const roleAssignmentSchema = z.object({
  id: z.number(),
  userId: z.number(),
  roleId: z.number(),
  scopeType: scopeTypeSchema,
  scopeId: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  role: roleSchema.omit({ rolePermissions: true }).optional(),
});
export type RoleAssignment = z.infer<typeof roleAssignmentSchema>;

export const createRoleAssignmentSchema = z.object({
  userId: z.number(),
  roleId: z.number(),
  scopeType: scopeTypeSchema,
  scopeId: z.number().optional(),
});
export type CreateRoleAssignmentInput = z.infer<typeof createRoleAssignmentSchema>;
