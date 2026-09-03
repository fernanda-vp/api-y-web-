# 0016 — Frontend de Roles y Permisos

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-2-CLAUDE-CODE.md`, tarea 5. Depende de spec [0015](../0015-core-roles-permissions/spec.md) (backend).

## Objetivo

Pantallas de administración de Roles/Permisos/Asignaciones, y que el resto del frontend (Zonas/Departamentos/Puestos/Empleados/Plazas) oculte o deshabilite acciones según los permisos reales del usuario autenticado — no solo confiar en que el backend rechace la petición.

## Alcance

### 1. `/configuracion/roles` — administración de roles
Lista de los 7 roles. Al seleccionar uno: catálogo completo de permisos (agrupados por recurso: Zonas, Departamentos, Puestos, Empleados, Plazas, Roles) con checkbox por permiso ya otorgado — togglear llama `POST`/`DELETE /roles/:id/permissions`.

### 2. `/configuracion/asignaciones` (o dentro del detalle de un empleado/usuario) — asignar rol + alcance
Formulario: seleccionar empleado (no "usuario" directamente — no existe un endpoint de `Users` en el frontend, se usa `employee.userId`), rol, tipo de alcance (`Global`/`Empresa`/`Zona`/`Departamento`/`Puesto`) y, si no es Global, un `<select>` plano con las opciones de ese tipo (empresas/zonas/departamentos/puestos, precargados con límite 100 — mismo patrón ya usado en los selects de Plazas, spec 0014). Lista de asignaciones existentes del empleado seleccionado con opción de revocar.

### 3. Permisos efectivos del usuario autenticado
`GET /auth/me` (o un endpoint nuevo) debe exponer el conjunto de permisos efectivos del usuario logueado, para que el frontend decida qué mostrar. Se calcula una vez por sesión (no por cada componente) y se expone vía un helper server-side (mismo patrón que `getApiClient()` — server-only, deriva del JWT).

### 4. Ocultar/deshabilitar acciones existentes
Cada botón de acción ya construido en Sprint 1 (Agregar, Editar, Activar/Desactivar, Transferir, etc.) se envuelve con una verificación del permiso correspondiente — si no lo tiene, el botón no se renderiza (no solo se deshabilita, para no dar pistas de acciones que no puede hacer).

## Fuera de alcance

- Crear/editar/borrar roles o permisos individuales (fijos por seed, ver spec 0015).
- Auditoría de quién asignó qué rol y cuándo (sprint siguiente).

## Decisiones técnicas

1. Los permisos efectivos se resuelven **server-side**: `GET /auth/me` ahora incluye `permissions: string[]` (todas las acciones que el usuario tiene por cualquier asignación, en cualquier alcance — cálculo grueso, igual al del `PermissionsGuard`, no resuelve alcance fino por botón). Se expone vía `getCurrentUser()` (`app/lib/permissions.ts`), envuelto en `cache()` de React para deduplicar la llamada dentro del mismo request (ya se necesitaba en `(shell)/layout.tsx` para el header — con `cache()` no se duplica la llamada a `/auth/me` cuando una página también la necesita).
2. Los selects de alcance (Empresa/Zona/Departamento/Puesto) usan listas planas precargadas (límite 100), no árboles — mismo criterio ya usado en los selects de Plazas (spec 0014): a esta escala no hace falta autocompletar/jerarquía visual para elegir un alcance.
3. Las constantes de etiquetas (`RESOURCE_LABELS`, `ACTION_LABELS`, `SCOPE_TYPE_LABELS`) viven en `app/lib/permission-labels.ts`, separado de `app/lib/permissions.ts` — este último importa `"server-only"` (por `getCurrentUser`), y Next.js prohíbe que un Client Component importe *cualquier* export de un módulo marcado `server-only`, aunque el export puntual usado sea una constante inocua.

## Criterios de aceptación

- [x] Pantalla de administración de roles funcional (ver/togglear permisos) — `/configuracion/roles`.
- [x] Pantalla de asignación de rol + alcance, con revocar — `/configuracion/asignaciones`.
- [x] Páginas de lista muestran un mensaje claro (no un error sin control) cuando el usuario no tiene el permiso.
- [x] Items del sidebar sin el permiso `:read` correspondiente no se muestran.
- [x] `pnpm --filter intranet build`/`lint` limpios.
- [x] Botones de acción **dentro** de cada página (Agregar/Editar/Activar/Transferir, etc.) ocultos según permiso.
- [x] Checkbox maestro por grupo en `/configuracion/roles` (otorga/quita todos los permisos del grupo de una vez, estado indeterminado si está parcial).
- [x] "Asignaciones" (`roles:assign`/`revoke`) se muestra como grupo separado de "Roles".
- [ ] Verificación manual del usuario con un rol de alcance limitado (pendiente).

## Revisión 2 — checkbox maestro por módulo + grupo "Asignaciones"

El usuario pidió poder activar/desactivar todos los permisos de un módulo de una sola vez, y notó que "Asignaciones" no existía como grupo separado (ver Revisión 2 de spec 0015 para la contraparte de backend, el endpoint bulk atómico).

- **Agrupador**: `groupPermissions()` (antes `groupByResource()`) usa `permissionGroupOf()` (`app/lib/permission-labels.ts`) en vez de partir el `action` directamente — un mapeo explícito saca `roles:assign`/`roles:revoke` del grupo "roles" hacia un grupo "assignments" ("Asignaciones"), y todo lo demás sigue cayendo al prefijo por defecto.
- **Checkbox maestro** (`PermissionGroup`): calcula cuántos de los permisos del grupo están otorgados — todos → marcado, ninguno → desmarcado, algunos → `indeterminate` (seteado imperativamente vía `ref` sobre el nodo DOM, ya que React no expone `indeterminate` como prop). Al hacer click llama `bulkSetRolePermissions()`, que golpea el endpoint bulk nuevo y revalida la página una sola vez (no un `revalidatePath` por permiso).

## Bug encontrado probando en vivo — 403 sin control

Al probar con un usuario sin permiso, las páginas de lista (Zonas/Departamentos/Puestos/Empleados/Plazas/Roles/Asignaciones) llamaban al API directamente en el Server Component sin capturar el error — el `403` del `PermissionsGuard` (spec 0015) se propagaba como una excepción no controlada (pantalla de error de Next.js).

**Fix**: `app/lib/errors.ts` (`isForbiddenError()`) + `app/(shell)/configuracion/_components/permission-denied.tsx`, usados en las 7 páginas afectadas. Cada página envuelve su *fetch* en `try/catch` y solo captura el 403 (cualquier otro error se re-lanza). La construcción del JSX se mantiene **fuera** del `try` (el linter de `eslint-plugin-react-hooks` lo exige — JSX es perezoso, un error ahí no lo captura el `catch`), así que cada página arma un objeto de resultado (`{ ...datos }` o `{ forbidden: true }`) dentro del `try/catch` y decide qué renderizar después.

## Sidebar filtrado por permiso

Además del punto 4 original (ocultar botones dentro de cada página), se agregó un filtro más simple y de alto valor: el propio item del sidebar desaparece si el usuario no tiene ni siquiera el permiso de lectura del módulo (no tiene sentido ofrecer una sección que va a rechazar cualquier acción). `NavItem` (`app/lib/nav.ts`) ganó un campo opcional `permission` (el `:read` de cada módulo; `Empresas` no lleva ninguno porque ese módulo no está protegido todavía).

**Bug encontrado al implementarlo**: el primer intento hacía el filtrado en `ConfiguracionLayout` (Server Component) y pasaba el arreglo `items` ya filtrado — pero `NavItem.icon` es un componente de `lucide-react` (una función/objeto `forwardRef`), y React Server Components solo puede serializar objetos planos hacia un Client Component; los íconos rompían el límite servidor/cliente ("Only plain objects can be passed to Client Components..."). **Fix**: `ConfiguracionLayout` solo resuelve `getCurrentUser()` (la misma llamada cacheada por request que ya usaba el header) y pasa `permissions: string[]` (datos serializables) a `SidebarNav`; `SidebarNav` (Client Component) sigue importando `CONFIG_SIDEBAR_NAV` localmente (con sus íconos, evaluados en el bundle del cliente, nunca cruzan la frontera) y filtra ahí mismo con el arreglo de permisos recibido.

## Punto 4 — botones ocultos dentro de cada página (completado)

Se aplicó `hasPermission(permissions, "recurso:accion")` en los 5 módulos de Sprint 1, con `permissions` recorriendo la cadena Server Component (`page.tsx` llama `getCurrentUser()`) → Client Component de lista/árbol → Client Component de menú de fila, exactamente como ya se hacía con `me` en el resto de la app:

- **Zonas** (`ZonesTable`/`ZoneRowMenu`): "Agregar" con `zones:create`; "Editar" con `zones:update`; "Habilitar"/"Deshabilitar" con `zones:enable`/`zones:disable` (según el estado actual de la fila, no ambos a la vez).
- **Departamentos** y **Puestos** (`*Tree`/`*Node`/`*RowMenu`, misma forma en ambos): "Agregar" (raíz) y "Agregar sub-X" con `<recurso>:create`; "Editar / reparentar" con `<recurso>:update`; "Habilitar"/"Deshabilitar" con `<recurso>:enable`/`disable`. `permissions` se propaga recursivamente a través de los nodos hijos del árbol.
- **Empleados** (`EmployeesTable`/`EmployeeRowMenu`): "Agregar" con `employees:create`; "Editar" con `employees:update`; cada acción de ciclo de vida (`Activar`/`Desactivar`/`Dar de baja`) se filtra individualmente por su propio permiso (`employees:activate`/`deactivate`/`terminate`) además de por el estatus actual del empleado (no se ofrece "Activar" a alguien ya activo, aunque tenga el permiso).
- **Plazas** (`PositionsTable`/`PositionRowMenu`): "Agregar" con `positions:create`; "Transferir"/"Finalizar" con `positions:transfer`/`positions:end`. "Ver detalle" queda sin gatear — ya está cubierto por el `positions:read` exigido para llegar a la página.

**Regla común**: si un menú de fila (`*RowMenu`) se queda sin ninguna acción disponible (ni edición ni cambio de estatus), el componente retorna `null` en vez de mostrar un botón de "···" que abre un menú vacío.

`Empresas` queda fuera de este punto — ese módulo todavía no está protegido por el motor de permisos (spec 0015 solo cubrió el retrofit de los 5 módulos de Sprint 1).

## Revisión 3 — 4 hallazgos de code review (prioridad media)

Continuación de la revisión de código de Sprint 2 (ver Revisión 3 de spec 0013 y Revisión 4 de spec 0012 para los hallazgos de prioridad alta ya corregidos). Los siguientes 4 hallazgos de prioridad media caen dentro del alcance de esta spec:

1. **Roles y Asignaciones sin el mismo gating que el resto de módulos**: el "Punto 4" original (arriba) cubrió los 5 módulos de Sprint 1, pero `/configuracion/roles` y `/configuracion/asignaciones` nunca recibieron el mismo tratamiento — un usuario con solo `roles:read` veía el botón "Crear rol", el lápiz de renombrar, el toggle de estatus y podía togglear cualquier checkbox de permiso, y en Asignaciones veía el formulario completo y el botón "Revocar" sin tener `roles:assign`/`roles:revoke`. Fix, mismo patrón que el resto (`hasPermission()` propagado `page.tsx` → componente):
   - `RolesAdmin`: "Crear rol" oculto sin `roles:create`; en `RoleHeader`, lápiz de renombrar oculto sin `roles:update`, toggle de estatus oculto sin `roles:enable`/`disable` (según el estado actual del rol). Los checkboxes de permisos (individuales y el maestro por grupo) se dejan **visibles pero `disabled`** sin `roles:manage-permissions` — a diferencia de otros botones, aquí ocultarlos escondería información real (qué permisos tiene el rol), no solo una acción no disponible.
   - `AssignmentsAdmin`: el panel "Nueva asignación" completo se oculta sin `roles:assign`; el botón "Revocar" por fila se oculta sin `roles:revoke`.
2. **Mensajes de error genéricos escondían el motivo real**: varias acciones "fire-and-forget" (no basadas en `useActionState`, sino llamadas directas: `bulkSetRolePermissions`, `toggleRolePermission`, `setRoleStatus`, `deleteRoleAssignmentAction` en `roles.ts`, y su equivalente en `employees.ts`/`zones.ts`/`departments.ts`/`job-titles.ts`/`companies.ts`/`positions.ts`) dejaban que el `AxiosError` crudo se propagara hasta el `catch` del componente, que siempre mostraba un texto fijo ("No se pudo actualizar el estatus.") — incluyendo el mensaje nuevo de "esto depende de otro permiso" del motor de dependencias (spec 0017), que quedaba invisible para el usuario. Fix: `errorMessage()` (antes duplicado en 7 archivos de `app/actions/`) se centralizó en `app/lib/errors.ts`; cada acción fire-and-forget ahora envuelve su llamada en `try/catch` y relanza `new Error(errorMessage(err))`, y cada `catch` de componente muestra `err instanceof Error ? err.message : "<texto genérico>"` en vez del texto fijo.
3. **Selects de Asignaciones no filtraban por empresa**: al elegir alcance Zona/Departamento, el `<select>` mostraba las opciones de **todas** las empresas mezcladas (con el nombre de empresa entre paréntesis para poder distinguirlas), sin forma de acotar la lista. Fix: nuevo selector "Empresa" (mismo patrón que `CompanyPicker`, pero como estado local del formulario en vez de la URL — aquí no hay necesidad de persistir el filtro entre navegaciones) que filtra las opciones de Zona/Departamento por `companyId` antes de listarlas.
4. **El selector de "reparentar" ofrecía hijos propios como opción**: en Departamentos y Puestos, el `<select>` de "Departamento/Puesto padre" excluía solo el nodo que se está editando (`item.id !== department?.id`), no sus descendientes — se podía intentar poner un departamento como padre de su propio hijo o nieto. El backend ya lo rechaza (violaría la jerarquía), pero no tiene sentido ofrecerlo. Fix: nuevo `getDescendantIds()` en `app/lib/tree.ts` (recorre el árbol ya cargado en el cliente, sin llamada extra al backend), usado para excluir el nodo y todos sus descendientes de `parentOptions` en ambos modales.

Sin cambios de schema ni de endpoints, no requiere migración. `pnpm --filter intranet build`/`lint` limpios.

### Criterios de aceptación — Revisión 3

- [x] Roles y Asignaciones ocultan sus acciones según el permiso real del usuario, igual que los demás módulos.
- [x] Los errores de backend (incluyendo el de dependencias de permisos) se muestran tal cual, no como texto genérico.
- [x] Los selects de alcance de Asignaciones se pueden filtrar por empresa.
- [x] El selector de reparentar no ofrece al propio nodo ni a sus descendientes.
- [ ] Verificación manual del usuario.
