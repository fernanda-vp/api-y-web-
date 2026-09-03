# 0015 — Motor de `core/roles` (Roles + Permisos + Alcance)

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-2-CLAUDE-CODE.md`, tareas 1-4. Cubre el backend completo: modelo de datos, seed de roles predefinidos, motor de verificación (guard + servicio de alcance) y la protección retroactiva de los módulos de Sprint 1 (Zones, Departments, JobTitles, Employees, Positions).

## Decisiones confirmadas por el usuario (vía AskUserQuestion)

1. **5 niveles de alcance**: `GLOBAL`, `COMPANY`, `ZONE`, `DEPARTMENT`, `JOB_TITLE` — se mantiene `COMPANY` (ya scaffoldeado desde Sprint 0) y se agrega `JOB_TITLE` (el "puesto específico" del documento — confirmado en `specs/glossary.md`: Puesto = `JobTitle`). Razón para mantener `COMPANY`: sin él, operaciones de creación (ej. crear una Zona nueva dentro de la Empresa X) no tendrían ningún recurso existente contra el cual validar alcance salvo `GLOBAL`.
2. **Herencia jerárquica**: un alcance `DEPARTMENT`/`JOB_TITLE` asignado sobre un nodo padre **aplica automáticamente a todos sus descendientes** en el árbol — calculado al vuelo (reutilizando `core/common/hierarchy/tree.util.ts`), nunca materializado.
3. **"Administrador General"**: dirigido por datos — el seed le otorga **todos** los permisos existentes vía `RolePermission`. Sin bypass hardcodeado en el guard. Costo aceptado: cada módulo nuevo debe agregar sus permisos nuevos a este rol en su propio seed (mismo patrón ya usado con `StatusGroup` por módulo).

## Objetivo

Proteger con permisos reales + alcance todos los endpoints ya construidos en Sprint 1 (hoy cualquier usuario autenticado puede hacer cualquier cosa), y dejar la base de datos + API lista para que el frontend (spec 0016) construya las pantallas de administración de roles.

## Modelo de datos (ya scaffoldeado desde Sprint 0 — sin cambios de fondo, solo el enum)

```prisma
enum ScopeType {
  GLOBAL
  COMPANY
  ZONE
  DEPARTMENT
  JOB_TITLE   // nuevo
}

model Role { id, name (único), rolePermissions[], roleAssignments[] }
model Permission { id, action (único, ej. "zones:create"), rolePermissions[] }
model RolePermission { roleId, permissionId — tabla puente }
model RoleAssignment { id, userId → User, roleId → Role, scopeType, scopeId? (null solo si scopeType=GLOBAL) }
```

`scopeId` es polimórfico (no es una FK real de Prisma — no se puede, apunta a tablas distintas según `scopeType`): `COMPANY.id`, `Zone.id`, `Department.id` o `JobTitle.id` según corresponda. La integridad referencial de `scopeId` se valida en `RoleAssignmentsService`, no en el schema.

## Convención de permisos

`<recurso>:<acción>`, un `Permission` por combinación:

| Recurso | Acciones |
|---|---|
| `zones` | `create`, `read`, `update`, `enable`, `disable` |
| `departments` | `create`, `read`, `update`, `enable`, `disable` |
| `job-titles` | `create`, `read`, `update`, `enable`, `disable` |
| `employees` | `create`, `read`, `update`, `activate`, `deactivate`, `terminate` |
| `positions` | `create`, `read`, `update`, `transfer`, `end` |
| `roles` | `create`, `read`, `update`, `enable`, `disable`, `manage-permissions`, `assign`, `revoke` (Revisión 1: antes solo los últimos 4) |

`PATCH /employees/me` (Mi Perfil) **no requiere permiso** — sigue siendo estructural (deriva del JWT, solo puede tocar el propio perfil), como se documentó en spec 0012.

## Seed — roles predefinidos

Los 7 roles del documento, creados sin pantalla:
`Administrador General`, `Administrador de Encuestas`, `Administrador de Reportes`, `Administrador de Mapa de Sistemas`, `Administrador de Vacantes`, `Administrador de Permisos`, `Administrador de Carpetas/Foros`.

- **Administrador General**: recibe todos los permisos existentes a la fecha (30 originales + 4 de Revisión 1 = 34).
- **Administrador de Permisos**: recibe los 8 permisos de `roles` (4 originales + 4 de Revisión 1 — es quien administra roles/asignaciones desde el frontend de spec 0016).
- El resto (Encuestas, Reportes, Mapa de Sistemas, Vacantes, Carpetas/Foros): se crean **sin permisos** — sus módulos no existen todavía; se les asignarán permisos cuando se construyan (tal como indica el documento).
- El usuario `admin` seedeado desde Sprint 0 recibe una `RoleAssignment` a `Administrador General` con alcance `GLOBAL` — necesario para no quedar bloqueado apenas se aplique el retrofit de permisos (de lo contrario, tras este sprint nadie, ni siquiera el admin semilla, podría operar ningún endpoint).

## Motor de verificación

División en dos capas, siguiendo la arquitectura de 4 capas ya establecida:

### 1. Guard (Presentación) — gate barato, sin resolver alcance

`@RequirePermission('zones:update')` (decorator, `SetMetadata`) + `PermissionsGuard` (usa `Reflector`) — verifica que el usuario tenga **al menos una** `RoleAssignment` que otorgue ese permiso, en cualquier alcance. Si no tiene ninguna, `403` inmediato sin tocar el `Service`. Se registra junto a `JwtAuthGuard`: `@UseGuards(JwtAuthGuard, PermissionsGuard)`.

### 2. `PermissionsService` (Aplicación) — resolución real de alcance

Vive en `core/roles/application/permissions.service.ts`, inyectado en los Services de cada módulo (Zones, Departments, JobTitles, Employees, Positions). Dos métodos:

- **`assertScope(userId, permission, target)`**: para operaciones sobre un recurso puntual (`update`, `enable`, `transfer`, etc.). `target` es `{ companyId?, zoneId?, departmentId?, jobTitleId? }` — el Service que lo llama ya tiene esos datos cargados (o los recibe en el DTO, para `create`). Internamente:
  1. Trae las `RoleAssignment` del usuario para roles que tengan el permiso pedido.
  2. `GLOBAL` → siempre pasa. `COMPANY` → pasa si `scopeId === target.companyId`. `ZONE` → pasa si `scopeId === target.zoneId`. `DEPARTMENT` → pasa si `scopeId` es el propio `target.departmentId` **o un ancestro** de él (recorre `parentDepartmentId` hacia arriba). `JOB_TITLE` → igual, vía `parentJobTitleId`.
  3. Si ninguna asignación matchea, `ForbiddenException`.
- **`buildScopeFilter(userId, permission)`**: para endpoints de listado (`GET /zones`, `GET /employees`, etc.) — en vez de permitir/rechazar toda la petición, devuelve un fragmento de `where` de Prisma que el Service mezcla con sus filtros existentes (`companyId`, `search`, etc.), de forma que el usuario **solo ve las filas dentro de su alcance**. Si alguna asignación es `GLOBAL`, devuelve `{}` (sin restricción). Si no, arma un `OR` de condiciones por cada asignación (ej. `departmentId: { in: [...ids del subárbol] }`).

### Caso especial: `Employee` (posiciones múltiples y simultáneas)

Un empleado puede tener varias `Position` activas a la vez (spec 0013), en departamentos distintos. Regla: un empleado está **dentro del alcance** si **al menos una** de sus posiciones activas matchea (no todas) — evita bloquear a un manager legítimo de una de sus posiciones solo porque el empleado también tiene otra posición fuera de su alcance. Se implementa como `some` sobre la relación `positions` tanto en `assertScope` (existencial) como en `buildScopeFilter` (`positions: { some: { ...filtro, status: ACTIVE } }`).

## Aplicación a los módulos existentes (retrofit)

Cada controller de Zones/Departments/JobTitles/Employees/Positions agrega `@RequirePermission(...)` por endpoint (tabla de la sección anterior), y cada Service llama `permissionsService.assertScope(...)` o `.buildScopeFilter(...)` según corresponda, **antes** de tocar Prisma.

## Endpoints nuevos (`core/roles`)

1. `GET /roles` — lista roles con sus permisos (`roles:read`).
2. `GET /permissions` — catálogo completo de permisos (`roles:read`).
3. `POST /roles` — crear rol custom (`roles:create`, Revisión 1).
4. `PATCH /roles/:id` — renombrar rol custom (`roles:update`, Revisión 1 — 400 si `isSystem`).
5. `PATCH /roles/:id/enable` / `/disable` — (Revisión 1 — 400 si `isSystem`).
6. `POST /roles/:id/permissions` / `DELETE /roles/:id/permissions/:permissionId` — otorgar/quitar permiso a un rol (`roles:manage-permissions`).
7. `POST /role-assignments` — `{ userId, roleId, scopeType, scopeId? }`, valida que `scopeId` exista en la tabla correspondiente a `scopeType` (`roles:assign`).
8. `DELETE /role-assignments/:id` (`roles:revoke`).
9. `GET /role-assignments?userId=` — asignaciones de un usuario, para la pantalla de asignación (`roles:read`).

## Fuera de alcance

- Auditoría de cambios (sprint siguiente).
- Módulos de contenido nuevo (Encuestas, Vacantes, etc.) — sus roles ya existen (sin permisos) pero sus permisos se agregan cuando se construyan.
- Borrado físico de roles (Revisión 1: se reemplaza por enable/disable).
- Renombrar/deshabilitar los 7 roles semilla (Revisión 1).
- Crear/editar `Permission` individuales (siguen fijos por seed).

## Criterios de aceptación

- [x] `ScopeType` incluye `JOB_TITLE`; migración pendiente de correr por el usuario.
- [x] Seed: 7 roles, 30 permisos, `Administrador General` con todos, `Administrador de Permisos` con los 4 de `roles`.
- [x] `PermissionsGuard` + `@RequirePermission` protegiendo los 6 endpoints nuevos de `core/roles`.
- [x] Los 5 módulos de Sprint 1 requieren permiso real por endpoint.
- [x] Herencia jerárquica implementada (`getDescendantIds`/`isAncestorOrSelf` en `tree.util.ts`).
- [x] Alcance en listados filtra resultados vía `Prisma.WhereInput` (no solo permite/rechaza toda la petición).
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [ ] Verificación manual del usuario (pendiente, requiere correr migración + seed primero).

## Simplificaciones aceptadas durante el retrofit

1. **Árboles (`departments:read`/`job-titles:read` en `/tree`)**: no se filtran nodos individuales — filtrar rompería la estructura padre/hijo si un nodo intermedio queda fuera de alcance pero sus hijos no. El árbol se trae completo si el usuario tiene el permiso en **algún** alcance (para Departments, además se exige alcance sobre la `companyId` pedida). Revisar si esto es suficiente cuando se pruebe con un usuario de alcance limitado.
2. **`employees:create`**: un `Employee` recién creado no tiene ninguna `Position` todavía, así que no hay departamento/zona/puesto contra el cual validar alcance — solo un alcance `GLOBAL` puede dar de alta empleados (mismo criterio usado para crear un `JobTitle` raíz sin padre).
3. **`positions:transfer`**: la autorización se valida contra la posición **actual** (la que se cierra), no contra el departamento/zona/puesto de destino. Un caso de negocio futuro podría requerir validar ambos lados de la transferencia.
4. **Alcance de `Employee`**: un empleado sin ninguna `Position` activa solo es gestionable por un alcance `GLOBAL` (no hay dimensión contra la cual matchear un alcance más específico).

## Revisión 1 — crear/editar/deshabilitar roles custom desde la UI

El documento ya anticipaba esto ("si más adelante se quiere permitir crear roles custom, el modelo ya lo soporta"), marcado fuera de alcance en la versión original. El usuario pidió habilitarlo. Dos decisiones confirmadas por el usuario (vía AskUserQuestion):

1. **Los 7 roles semilla quedan protegidos** (`isSystem: true`) contra renombrar/deshabilitar/borrar. Razón: el seed hace `upsert({ where: { name } })` — si un rol semilla se renombra desde la UI, la siguiente corrida de `prisma db seed` (rutinaria, no destructiva hasta ahora) no encuentra ese `name` y **crea un duplicado nuevo** con el nombre original, dejando el renombrado huérfano. Gestionar permisos (`roles:manage-permissions`) sobre roles semilla sigue permitido — solo se bloquea renombrar/enable/disable.
2. **"Eliminar" un rol = deshabilitarlo (Status), no borrado físico** — consistente con el resto del proyecto (Company/Zone/Department/JobTitle/User/Employee/Position, ninguno se borra físicamente). Además, `RoleAssignment.roleId` no tiene `onDelete` configurado — un `DELETE` real sobre un rol con asignaciones existentes fallaría con un error crudo de FK de Postgres. Un rol deshabilitado dejar de otorgar permisos automáticamente (el motor de verificación filtra por status), sin tocar las `RoleAssignment` existentes (quedan ahí, inertes, recuperables si se reactiva el rol).

### Cambios en el schema

```prisma
model Role {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isSystem  Boolean  @default(false)   // nuevo — true solo para los 7 roles semilla
  statusId  Int                        // nuevo
  status    Status   @relation(fields: [statusId], references: [id])
  ...
}
```
`Status` gana `roles Role[]` (mismo patrón de relación inversa que el resto de los módulos). Nuevo `StatusGroup` "ROLE" (`ACTIVE`/`INACTIVE`) en el seed.

### Permisos nuevos

`roles` gana los mismos verbos que Zones/Departments/JobTitles: `create`, `update`, `enable`, `disable` (además de los 4 ya existentes: `read`, `manage-permissions`, `assign`, `revoke` — 8 en total). Se agregan a `Administrador General` (todos) y a `Administrador de Permisos` (los 4 nuevos, además de los 4 que ya tenía).

### Reglas de negocio

- `POST /roles` (`roles:create`): `{ name }` — crea con `isSystem: false`, status `ACTIVE`. `name` único (mismo `ConflictException` que ya se usa en Employees/Zones para colisiones).
- `PATCH /roles/:id` (`roles:update`): `{ name }` — rechaza con `BadRequestException` si `role.isSystem`.
- `PATCH /roles/:id/enable` / `/disable` (`roles:enable`/`roles:disable`): rechaza si `role.isSystem`.
- `PermissionsService` (`findGrantingAssignments`, `hasGrantingAssignment`, `findPermissionActionsForUser`) ahora filtra `role: { status: { isActive: true } }` — un rol deshabilitado deja de contar para el Guard, `assertScope`, `getScopeGrant` y los permisos efectivos de `/auth/me`, todo en el mismo punto.

### Fuera de alcance (sigue igual)

- Borrado físico de roles.
- Renombrar/deshabilitar los 7 roles semilla.
- Crear/editar `Permission` individuales (siguen fijos por seed).

### Criterios de aceptación — Revisión 1

- [x] `Role` gana `isSystem`/`statusId`; `StatusGroup` "ROLE" en el seed; los 7 roles semilla se crean con `isSystem: true`.
- [x] `POST /roles`, `PATCH /roles/:id`, `PATCH /roles/:id/enable`/`disable` implementados y protegidos.
- [x] Los 3 endpoints anteriores rechazan con 400 sobre un rol `isSystem`.
- [x] `PermissionsGuard`/`PermissionsService`/`/auth/me` dejan de contar los permisos de un rol deshabilitado.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [ ] Migración corrida + verificación manual (pendiente del usuario — ver nota de migración abajo).

### Nota de migración — posible conflicto con datos existentes

`Role.statusId` es una columna requerida nueva sobre una tabla que **ya existe** desde el `init` de Sprint 0 (los 7 roles pudieron haberse creado si ya corriste `prisma db seed` de la Revisión 0 de este mismo spec). Si la tabla `Role` ya tiene filas, `prisma migrate dev` va a fallar al agregar una columna `NOT NULL` sin default. Dos caminos:

- **Si `Role` está vacía todavía** (no corriste `prisma db seed` desde la primera versión de este spec): `pnpm --filter intranet-api exec prisma migrate dev --name add_role_status_and_system_flag` aplica limpio.
- **Si ya hay roles sembrados**: la forma más simple en este punto (todavía sin datos reales de cliente, solo datos de prueba) es `pnpm --filter intranet-api exec prisma migrate reset` — recrea la base de datos local desde cero, reaplicando todas las migraciones y volviendo a correr el seed automáticamente. Confirmar con el usuario antes, ya que borra los datos de prueba locales (empleados/plazas de prueba creados a mano tendrían que rehacerse).

En la práctica esto pasó (los 7 roles ya estaban sembrados). Se usó el tercer camino, más seguro: `prisma migrate dev --create-only` para generar el archivo sin aplicarlo, editado a mano para: crear el `StatusGroup`/`Status` "ROLE" vía SQL directo (idempotente, `ON CONFLICT DO NOTHING` — no depende de que el seed ya haya corrido), agregar `statusId` como columna opcional primero, hacer el `UPDATE` de backfill sobre las 7 filas existentes (`statusId` = el status ROLE/ACTIVE recién asegurado, `isSystem = true` para los 7 nombres del seed) y solo al final volver la columna `NOT NULL` + agregar la FK. Sin pérdida de datos de prueba.

## Bug encontrado probando en vivo — `RoleAssignment.role` sin `status`

Mismo patrón que el bug de Positions (spec 0013): `RolesRepository.createAssignment()`/`findAssignmentsByUser()` usaban `include: { role: true }` — trae los campos propios de `Role`, pero no su relación `status` (Prisma no anida `include` automáticamente). Al agregar `status` como campo requerido de `roleSchema` (Revisión 1), el frontend falló con un `ZodError` (`role.status: Required`) al cargar `/configuracion/asignaciones`.

**Fix**: `ROLE_ASSIGNMENT_INCLUDE = { role: { include: { status: true } } } satisfies Prisma.RoleAssignmentInclude`, reutilizado en ambos métodos.

## Revisión 2 — otorgar/quitar permisos en bloque por módulo

El usuario pidió un checkbox maestro por módulo en `/configuracion/roles` (spec 0016) que active/desactive todos sus permisos de una vez. Decisión confirmada: hacerlo **atómico en el backend** (no un bucle de llamadas individuales desde el frontend), mismo criterio que ya se usa para operaciones multi-fila en este proyecto (`$transaction`, igual que la creación de `Employee`).

### Endpoint nuevo

`PATCH /roles/:id/permissions/bulk` (`roles:manage-permissions`) — `{ permissionIds: number[], grant: boolean }`. El backend no conoce el concepto de "módulo" (es una agrupación puramente visual del frontend, ver Revisión 2 de spec 0016) — solo recibe la lista final de ids a otorgar o revocar y la aplica **completa o nada**:
- `grant: true` → `$transaction` con un `upsert` de `RolePermission` por cada id (evita fallar si alguno ya estaba otorgado).
- `grant: false` → un solo `deleteMany({ where: { roleId, permissionId: { in: permissionIds } } })`.

### Criterios de aceptación — Revisión 2

- [x] `PATCH /roles/:id/permissions/bulk` implementado y protegido.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.

## Revisión 3 — escalación de privilegios en `role-assignments` (hallazgo de code review)

Una revisión de código sobre todo el diff de Sprint 2 encontró que `POST/DELETE /role-assignments` y `GET /role-assignments?userId=` eran los **únicos** endpoints de todo el motor de permisos que no seguían el patrón ya establecido (`PermissionsService.assertScope`/`getScopeGrant`) — quedaban protegidos solo por el chequeo grueso del `PermissionsGuard` ("¿tiene `roles:assign` en algún alcance?"), sin validar que el alcance del que asigna/revoca/lee cubra el alcance real de la operación.

**Impacto verificado**: un usuario con `roles:assign` otorgado en un solo `DEPARTMENT` podía llamar `POST /role-assignments` con `{ scopeType: "GLOBAL", roleId: <Administrador General> }` y volverse administrador global — escalación de privilegios completa. Lo mismo con `roles:revoke` sobre la asignación `GLOBAL` de otro admin, y con `roles:read` para listar las asignaciones de cualquier usuario del sistema sin relación con el alcance del que pregunta.

### Fix — mismo patrón que el resto del motor, sin mecanismos nuevos

1. **`createAssignment`**: antes de crear la fila, se valida `assertScope(callerUserId, 'roles:assign', target)` donde `target` es el alcance **que se está otorgando** (no el del creador) — construido con `buildScopeTargetForScope(scopeType, scopeId)`:
   - `GLOBAL` → `{}` (objeto vacío — por diseño de `grantCoversTarget`, un target vacío solo lo cubre un alcance `GLOBAL` propio, igual que ya se usa para `employees:create` y la creación de un `JobTitle` raíz).
   - `COMPANY` → `{ companyId: scopeId }`.
   - `ZONE`/`DEPARTMENT` → se resuelve también el `companyId` de la zona/departamento (nuevos `RolesRepository.getZoneCompanyId`/`getDepartmentCompanyId`, mismo patrón que `PositionsRepository`), para que un alcance `COMPANY` también pueda delegar dentro de sus propias zonas/departamentos.
   - `JOB_TITLE` → `{ jobTitleId: scopeId }` (la herencia por jerarquía ya la resuelve `getScopeGrant`).

   Con esto, alguien con `roles:assign` de alcance `DEPARTMENT` puede asignar roles con alcance igual o más angosto dentro de ese departamento (o sus descendientes), pero nunca `GLOBAL` ni de otra rama.

2. **`deleteAssignment`**: mismo `buildScopeTargetForScope`, pero calculado sobre el `scopeType`/`scopeId` **de la asignación que se va a borrar** (no de una nueva) — valida `assertScope(callerUserId, 'roles:revoke', target)` antes de borrar.

3. **`findAssignmentsByUser`**: el usuario objetivo no tiene compañía/departamento propios — se derivan de las `Position` activas de su `Employee`, exactamente el mismo criterio ya usado en `EmployeesService.assertEmployeeScope` (spec 0015 original, sección "Caso especial: Employee"): alcanza con que **una** de sus posiciones matchee el alcance del que pregunta. Nuevo `RolesRepository.findActivePositionsForUser(userId)` (User → Employee → Position activa, ya que `RolesModule` no puede depender de `EmployeesModule` sin crear un ciclo).

Sin cambios de schema — no requiere migración.

### Criterios de aceptación — Revisión 3

- [x] `createAssignment`/`deleteAssignment`/`findAssignmentsByUser` validan alcance real, no solo el permiso grueso del Guard.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.

## Nota — nombre engañoso de la migración `20260829012755_add_roles_permissions_engine` (hallazgo de code review, cosmético)

La revisión de código de Sprint 2 notó que esta migración, pese a su nombre, **no** crea el motor de roles/permisos (eso lo hace `20260827183334_init`, ya scaffoldeado desde Sprint 0) — su único contenido real es agregar `JOB_TITLE` al enum `ScopeType`. El nombre quedó así por un `prisma migrate dev --name` mal elegido en el momento.

**Decisión: no renombrarla.** Es una migración ya aplicada y confirmada por el usuario en su base de datos — Prisma rastrea las migraciones por el nombre de su carpeta en `_prisma_migrations`; renombrar la carpeta sin también editar esa tabla haría que Prisma la vea como "nueva" en el próximo `migrate deploy`/`migrate status` (drift), un riesgo real sobre el historial de migraciones para corregir algo puramente cosmético. Esta nota documenta la discrepancia para quien lea el historial de migraciones más adelante, sin tocar nada ya aplicado.
- [ ] Verificación manual: repetir el escenario de escalación (asignar GLOBAL desde un alcance de departamento) y confirmar que ahora responde 403.
