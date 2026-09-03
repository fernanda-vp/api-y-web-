import { SetMetadata } from '@nestjs/common';
import type { PermissionAction } from '../domain/permission-catalog';

export const PERMISSION_KEY = 'requiredPermission';

export const RequirePermission = (permission: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, permission);
