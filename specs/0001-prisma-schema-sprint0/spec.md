# 0001 — Prisma schema (Sprint 0/1)

Estado: **aprobado (revisión 2)**

Ver [glosario de traducción](../glossary.md) — todos los identificadores de código están en inglés; esta spec queda en español para lectura, referenciando los nombres reales del schema.

## Objetivo

Definir `apps/backend/prisma/schema.prisma` con las entidades mínimas de catálogo y autenticación necesarias para arrancar el Sprint 0, según `CONTEXTO-SPRINT-0-CLAUDE-CODE.md`, con tres ajustes de arquitectura pedidos por el usuario tras la revisión 1 (ver "Revisión 2" abajo).

## Alcance

Incluye las 10 entidades del documento de contexto más las 4 tablas nuevas de la revisión 2 (`User`, `UserCredential`, `Status`, `StatusGroup`). No incluye migraciones de datos, seeds, ni lógica de derivación de jefe de Position (eso es lógica de servicio, tarea aparte).

## Entidades y campos (nombres reales del schema)

### Company (Empresa)
- `id`, `name`, `rfc`, `statusId` → Status

### Zone (Zona)
- `id`, `companyId` → Company, `name`, `address`, `statusId` → Status

### Department (Departamento)
- `id`, `companyId` → Company, `name`, `parentDepartmentId?` → Department (auto-referencia), `statusId` → Status

### JobTitle (Puesto)
- `id`, `name`, `parentJobTitleId?` → JobTitle (auto-referencia), `statusId` → Status
- **Sin `companyId`**: catálogo global del producto, no por empresa (así está listado en el documento de contexto).

### User (nuevo — identidad de acceso)
- `id`, `username` (único), `name`, `lastName`, `photoUrl?`, `statusId` → Status
- Relación 1:1 con `UserCredential` y 1:1 opcional con `Employee`.

### UserCredential (nuevo — credenciales separadas)
- `id`, `userId` (único, 1:1) → User, `passwordHash`

### Employee (Empleado — perfil de RRHH)
- `id`, `userId` (único, 1:1) → User, `code` (la `clave` del documento), `phone?`, `bio?`, `terminationDate?` (la `fechaBaja`), `statusId` → Status
- **Sin `companyId` directo**: la afiliación a Company se deriva vía Position → Department/Zone → Company.

### Position (Plaza)
- `id`, `employeeId` → Employee, `jobTitleId` → JobTitle, `departmentId` → Department, `zoneId` → Zone, `managerPositionId?` → Position (auto-referencia, override explícito, la `jefePlazaId`), `functionalManagerPositionId?` → Position (la `jefeFuncionalPlazaId`), `startDate`, `endDate?`, `statusId` → Status

### Role (Rol)
- `id`, `name`

### Permission (Permiso)
- `id`, `action`

### RolePermission (RolPermiso)
- `roleId` → Role, `permissionId` → Permission (clave compuesta, tabla puente)

### RoleAssignment (AsignacionRol)
- `id`, `userId` → User (**no** `employeeId` — el control de acceso pertenece a la identidad de login, no al perfil de RRHH), `roleId` → Role, `scopeType` (enum: `GLOBAL | COMPANY | ZONE | DEPARTMENT`), `scopeId?` (referencia polimórfica, `null` cuando `scopeType = GLOBAL`)

### StatusGroup (nuevo — agrupador de estatus)
- `id`, `code` (único, ej. `"COMPANY"`, `"USER"`, `"EMPLOYEE"`), `description`

### Status (nuevo — catálogo de estatus)
- `id`, `groupId` → StatusGroup, `code` (ej. `"ACTIVE"`, `"TERMINATED"`), `description`, `isActive` (booleano genérico para saber si el estatus cuenta como habilitado, sin comparar strings)

## Reglas de negocio relevantes al schema

- Ningún catálogo se borra físicamente: todos tienen `statusId`, nunca `delete`.
- Department y JobTitle son jerarquías independientes entre sí (cada una con su propia auto-referencia).
- `managerPositionId` es un override explícito almacenado; la **derivación automática** del jefe (a partir del puesto padre dentro del mismo Department/Zone, marcando "pendiente" si hay ambigüedad) es lógica de servicio — **no** se modela en el schema de esta tarea.

## Decisiones técnicas confirmadas

1. **IDs**: `Int @id @default(autoincrement())` en todas las entidades.
2. **Timestamps de auditoría**: se agregan `createdAt`/`updatedAt` a todas las entidades.
3. **Estatus como tabla, no enum**: reemplaza los enums originales (`EstadoCatalogo`/`EstadoEmpleado`) por `Status`/`StatusGroup`. Cada entidad referencia `statusId`; un `StatusGroup` por entidad (`COMPANY`, `ZONE`, `DEPARTMENT`, `JOB_TITLE`, `USER`, `EMPLOYEE`, `POSITION`) agrupa sus posibles valores. Permite agregar/editar estatus sin migración de schema y guardar metadata (`description`, `isActive`) por valor.
4. **`scopeType`/`scopeId` de RoleAssignment**: modelado mínimo (enum + int nullable, sin relación FK real por ser polimórfico). "Roles/Permisos con scope completo" sigue **fuera de alcance** del Sprint 0.
5. **Naming**: todo en inglés (modelos, campos, enums) — ver [glosario](../glossary.md). Sin mapeo `@map`/`@@map` a snake_case en la base de datos por ahora.
6. **Prisma 7**: confirmado en "Hallazgos" abajo.
7. **Sin herencia de BaseEntity**: Prisma no soporta herencia de modelos. `id`/`createdAt`/`updatedAt` se repiten por convención en cada modelo. Un `BaseEntity` real (interfaz/clase TypeScript) queda pendiente para cuando se construya la capa de Dominio (`core/domain`), desacoplado del schema de Prisma.
8. **User/UserCredential/Employee separados**: `User` es la identidad de login (username, nombre, credenciales, roles). `Employee` es el perfil de RRHH (código, teléfono, bio, fecha de baja, posiciones organizacionales), relacionado 1:1 con `User`. Esto deja preparado el terreno para usuarios que no sean empleados (cuentas de sistema/admin) y para SSO/AD/LDAP a futuro (múltiples formas de credencial por usuario).

## Fuera de alcance de esta tarea

- Lógica de derivación automática de jefe de Position (servicio, Sprint 1).
- Resolución de scope de RoleAssignment en runtime.
- Seeds / datos de prueba (incluye los valores iniciales de `StatusGroup`/`Status`, que se cargarán como seed en una tarea posterior).
- Migraciones aplicadas contra una base de datos real (eso requiere `DATABASE_URL` configurado por el usuario).
- `BaseEntity` en la capa de Dominio (tarea futura, cuando exista `core/domain`).

## Revisión 2 (post-aprobación inicial)

El usuario pidió, antes de avanzar a la siguiente tarea, tres ajustes sobre la revisión 1 ya implementada:
1. Patrón BaseEntity (no soportado nativamente por Prisma — resuelto como convención + nota para capa de Dominio, punto 7 arriba).
2. Separar credenciales de usuario en tabla propia (resuelto: `User` + `UserCredential` + `Employee`, punto 8 arriba).
3. Catálogo de Estatus con agrupador en vez de enums (resuelto, punto 3 arriba).

Adicionalmente, el usuario definió que todo el código (tablas, campos, servicios) se escribe en inglés de aquí en adelante, aunque la documentación quede en español — esto se aplicó retroactivamente a las 10 entidades originales de la revisión 1 (ver [glosario](../glossary.md)).

## Revisión 3 — schema multi-archivo

El usuario pidió tener un archivo `.prisma` por tabla en vez de un único `schema.prisma`, para mejor orden. Se confirmó que Prisma 7.9.1 soporta schema multi-archivo (probado con `prisma validate --schema=<carpeta>` antes de aplicarlo). Estructura final:

```
apps/backend/prisma/schema/
├── base.prisma           # generator + datasource
├── status.prisma         # Status, StatusGroup
├── company.prisma        # Company
├── zone.prisma           # Zone
├── department.prisma     # Department
├── job-title.prisma      # JobTitle
├── user.prisma           # User, UserCredential
├── employee.prisma       # Employee
├── position.prisma       # Position
├── role.prisma           # Role, Permission, RolePermission
└── role-assignment.prisma # RoleAssignment, ScopeType
```

`prisma.config.ts` actualizado: `schema: "prisma/schema"` (apunta a la carpeta, ya no al archivo). El path de salida del cliente generado en `base.prisma` se ajustó a `../../generated/prisma` (un nivel adicional porque los archivos ahora viven en `prisma/schema/`, no en `prisma/`) para que siga resolviendo a `apps/backend/generated/prisma`, ya cubierto por `.gitignore`. `prisma validate` y `prisma format` pasaron sin errores sobre la carpeta completa.

## Criterios de aceptación

- [x] `apps/backend/prisma/schema.prisma` existe con las 10 entidades y relaciones descritas.
- [x] `prisma validate` pasa sin errores.
- [x] `prisma format` aplicado (schema bien formateado).
- [x] No se ejecutó ninguna migración contra base de datos real en esta tarea.

## Hallazgos durante la ejecución (Prisma 7)

- `prisma init` (ya ejecutado por el usuario al instalar) generó `apps/backend/prisma.config.ts`: la URL de conexión ahora se resuelve ahí (`import "dotenv/config"` + `defineConfig`), **no** con `url = env("DATABASE_URL")` dentro de `schema.prisma` como en Prisma 5/6.
- El generator quedó como `provider = "prisma-client"` (no `prisma-client-js`) con `output = "../generated/prisma"` — el cliente generado vive en `apps/backend/generated/prisma`, no en `node_modules/@prisma/client`. Hay que importar desde esa ruta al construir el `PrismaService` en la siguiente tarea.
- ~~El `.env` autogenerado apunta a `prisma+postgres://localhost:51213/...`~~ — **resuelto en la tarea [0002](../0002-auth-core-users/spec.md)**: se agregó `docker-compose.yml` con Postgres 16 real y se actualizó `.env.example` acorde.
- ~~`prisma.config.ts` importa `dotenv/config`, pero `dotenv` no estaba declarado como dependencia explícita~~ — **resuelto**, ya se corrió `pnpm --filter intranet-api add -D dotenv`.
- Hay actualización disponible a Prisma 8 (RC). No se aplicó — quedó en 7.9.1/7.10.0 como se instaló manualmente.
