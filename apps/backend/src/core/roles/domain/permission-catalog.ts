export const PERMISSIONS = [
  'zones:create',
  'zones:read',
  'zones:update',
  'zones:enable',
  'zones:disable',
  'departments:create',
  'departments:read',
  'departments:update',
  'departments:enable',
  'departments:disable',
  'job-titles:create',
  'job-titles:read',
  'job-titles:update',
  'job-titles:enable',
  'job-titles:disable',
  'employees:create',
  'employees:read',
  'employees:update',
  'employees:activate',
  'employees:deactivate',
  'employees:terminate',
  'positions:create',
  'positions:read',
  'positions:update',
  'positions:transfer',
  'positions:end',
  'roles:create',
  'roles:read',
  'roles:update',
  'roles:enable',
  'roles:disable',
  'roles:manage-permissions',
  'roles:assign',
  'roles:revoke',
] as const;

export type PermissionAction = (typeof PERMISSIONS)[number];

export const PREDEFINED_ROLES = [
  'Administrador General',
  'Administrador de Encuestas',
  'Administrador de Reportes',
  'Administrador de Mapa de Sistemas',
  'Administrador de Vacantes',
  'Administrador de Permisos',
  'Administrador de Carpetas/Foros',
] as const;

export const ROLE_PERMISSIONS: Record<string, readonly PermissionAction[]> = {
  'Administrador General': PERMISSIONS,
  'Administrador de Permisos': [
    'roles:create',
    'roles:read',
    'roles:update',
    'roles:enable',
    'roles:disable',
    'roles:manage-permissions',
    'roles:assign',
    'roles:revoke',
    // Dependencias de roles:assign/revoke (ver PERMISSION_DEPENDENCIES) — sin
    // esto el rol quedaría en un estado inconsistente desde el propio seed.
    'employees:read',
    'zones:read',
    'departments:read',
    'job-titles:read',
  ],
};

/**
 * `permission` requiere que todas las acciones listadas también estén
 * otorgadas al mismo rol — dirigido por datos (tabla `PermissionDependency`),
 * este mapa es solo el bootstrap inicial vía seed.
 */
export const PERMISSION_DEPENDENCIES: Partial<
  Record<PermissionAction, readonly PermissionAction[]>
> = {
  'roles:assign': [
    'roles:read',
    'employees:read',
    'zones:read',
    'departments:read',
    'job-titles:read',
  ],
  'roles:revoke': [
    'roles:read',
    'employees:read',
    'zones:read',
    'departments:read',
    'job-titles:read',
  ],
};
