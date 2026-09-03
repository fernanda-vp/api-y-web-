export function hasPermission(permissions: string[], action: string): boolean {
  return permissions.includes(action);
}

export const RESOURCE_LABELS: Record<string, string> = {
  zones: "Zonas",
  departments: "Departamentos",
  "job-titles": "Puestos",
  employees: "Empleados",
  positions: "Plazas",
  roles: "Roles",
  assignments: "Asignaciones",
};

/**
 * Override explícito de agrupación visual para permisos cuyo prefijo (antes
 * de ":") no coincide con el grupo deseado en pantalla — hoy solo
 * roles:assign/revoke, que se muestran separados de "Roles" (gestión del
 * catálogo) bajo su propio grupo "Asignaciones", aunque comparten el mismo
 * `action` en la base de datos.
 */
const PERMISSION_GROUP_OVERRIDES: Record<string, string> = {
  "roles:assign": "assignments",
  "roles:revoke": "assignments",
};

export function permissionGroupOf(action: string): string {
  return PERMISSION_GROUP_OVERRIDES[action] ?? action.split(":")[0];
}

export const ACTION_LABELS: Record<string, string> = {
  create: "Crear",
  read: "Ver",
  update: "Editar",
  enable: "Habilitar",
  disable: "Deshabilitar",
  activate: "Activar",
  deactivate: "Desactivar",
  terminate: "Dar de baja",
  transfer: "Transferir",
  end: "Finalizar",
  "manage-permissions": "Gestionar permisos",
  assign: "Asignar",
  revoke: "Revocar",
};

export const SCOPE_TYPE_LABELS: Record<string, string> = {
  GLOBAL: "Global (toda la instalación)",
  COMPANY: "Empresa",
  ZONE: "Zona",
  DEPARTMENT: "Departamento",
  JOB_TITLE: "Puesto",
};
