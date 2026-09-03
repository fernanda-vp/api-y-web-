# 0014 — Frontend de Sprint 1 (Zonas, Departamentos, Puestos, Empleados, Plazas)

Estado: **aprobado**

Cierra el frontend de Sprint 1, sobre el patrón ya validado en `core/companies` (spec 0007) y las decisiones de backend de specs 0009–0013.

## Diferencia clave vs. el patrón de Empresas

Empresas usa paginación **client-side** (carga todo, pagina en el navegador) porque son pocas por instalación. Zonas/Departamentos/Puestos/Empleados/Plazas **sí paginan en el backend** (`?page&limit&search&status`, respuesta `{ data, meta }`). El patrón de frontend cambia acorde:

- Las páginas de lista son Server Components que leen `searchParams` (`page`, `search`, `status`, `companyId`) y llaman al backend con esos filtros — la paginación/búsqueda se resuelve navegando (`?page=2`), no con estado de React ni fetch en el cliente.
- Búsqueda con debounce (Client Component) que actualiza la URL, no un `useState` local filtrando un array ya cargado.

## Componentes compartidos nuevos

- `app/(shell)/_components/pagination-controls.tsx` — flechas + "Página X de Y", navega vía `router.push` con el `page` actualizado. Reemplaza la paginación hecha a mano que tenía Empresas.
- `app/(shell)/_components/status-pill.tsx` — pill de estatus reutilizado en las 5 tablas nuevas (antes estaba inline en `companies-table.tsx`).
- `app/(shell)/_components/company-picker.tsx` — selector de `Company` (vía URL `?companyId=`), usado en Zonas y Departamentos (ambos requieren una empresa para listar/crear).

## Sidebar

`CONFIG_SIDEBAR_NAV` (antes solo "Empresas") crece a 6 items, cada uno con ícono: Empresas (`Building2`), Zonas (`MapPin`), Departamentos (`Network`), Puestos (`Briefcase`), Empleados (`Users`), Plazas (`IdCard`).

## Por módulo

### Zonas (`/configuracion/zonas`)
Tabla paginada server-side, con `<CompanyPicker>` arriba (filtra `companyId`). Crear/editar/habilitar/deshabilitar — mismo patrón que Empresas.

### Departamentos y Puestos (`/configuracion/departamentos`, `/configuracion/puestos`)
**Vista de árbol**, no tabla paginada — encajan mejor como jerarquía y el endpoint `/tree` ya trae todo sin paginar. Cada nodo: nombre, pill de estatus, botón "+" (agregar hijo), menú (editar, reparentar, habilitar/deshabilitar). Departamentos además lleva `<CompanyPicker>` (Puestos es catálogo global, sin selector de empresa).

### Empleados (`/configuracion/empleados`)
Tabla paginada server-side. Crear: `name`, `lastName`, `code`, `phone?`, `bio?` (sin `username`, se autogenera). **Al crear, se muestra un modal que no se cierra solo** con la contraseña temporal — se le advierte al usuario que la copie porque no se puede volver a ver. Menú de fila: Editar, Activar/Desactivar/Dar de baja (los 3 estados). Se agrega **"Mi Perfil"** como item nuevo en el dropdown del avatar del header → `/mi-perfil`, página donde el propio empleado edita `photoUrl`/`bio`/`phone` (`PATCH /employees/me`).

### Plazas (`/configuracion/plazas`)
Tabla paginada server-side (empleado, puesto, departamento, zona, fechas, estatus). Crear: selects dependientes de Empleado/Puesto/Departamento/Zona (poblados con listas simples, sin autocompletar por ahora — Sprint 1 no tiene tantos registros para necesitarlo) + overrides opcionales de jefe. Detalle: muestra `managerResolution` (explícito/derivado/ambiguo/ninguno) con texto claro para el caso ambiguo. Acciones: **Transferir** (formulario con los 4 selects + fecha efectiva) y **Finalizar**.

## Fuera de alcance

- Autocompletar/búsqueda tipo "combobox" en los selects de Plazas — selects simples por ahora.
- Vista de organigrama visual (nodos con líneas) para Positions — la relación jefe/reportes se muestra como texto, no como diagrama.
- Cualquier cosa de `core/roles` (no existe todavía en el backend).

## Criterios de aceptación

- [x] Componentes compartidos implementados (`PaginationControls`, `StatusPill`, `CompanyPicker`, más `SearchBox`, agregado sobre la marcha para el patrón de búsqueda por URL).
- [x] Los 5 módulos con sus páginas de lista/árbol + crear/editar + acciones de estatus.
- [x] "Mi Perfil" accesible desde el header (`PATCH /employees/me`).
- [x] `pnpm --filter intranet build`/`lint` y `pnpm --filter intranet-api build`/`lint` limpios.
- [x] Lista de verificación manual consolidada — confirmada por el usuario, los 5 módulos funcionan.

## Notas de implementación

- `packages/api-client` se amplió con schemas + métodos para `zones`, `departments` (incl. `tree`), `jobTitles` (incl. `tree`), `employees` (incl. `createEmployeeResponseSchema` con `temporaryPassword`) y `positions` (incl. `managerResolution`). Se renombró `Employee`/`employeeSchema` de `schemas/auth.ts` a `MeEmployee`/`meEmployeeSchema` para no chocar con el `Employee` "rico" del nuevo `schemas/employee.ts`.
- Plazas: los selects de Empleado/Puesto/Departamento/Zona se precargan completos (límite 100) en el servidor y se filtran en el cliente — no hay autocompletar/búsqueda remota (ver "fuera de alcance").
- El botón "Ver detalle" de Plazas usa una Server Action (`getPositionDetail`) llamada desde el cliente para traer el `managerResolution` bajo demanda, en vez de precalcularlo para todas las filas de la lista.

## Revisión 1 — 2 hallazgos de code review (formulario de Plazas, prioridad media)

Continuación de la revisión de código de Sprint 2 (ver Revisión 3 de spec 0016 para los otros hallazgos de prioridad media de esa misma tanda). Ambos hallazgos son sobre `PositionOrgFields`, compartido por "Nueva posición" y "Transferir":

1. **`functionalManagerPositionId` no tenía campo en ningún formulario**: el backend lo soporta completo desde spec 0013 (independiente de `managerPositionId`, nunca se deriva automáticamente), pero `PositionOrgFields` solo exponía el input de "Jefe directo" — no había forma de setearlo ni de verlo desde el UI. Fix: nuevo input "Jefe funcional — ID de posición (opcional)", mismo patrón que el de jefe directo (número libre, vacío = sin override).
2. **Transferir una posición borraba el jefe explícito sin avisar**: `PositionOrgFields` nunca pasaba `defaultValue` a los inputs de jefe directo/funcional, así que `PositionTransferModal` siempre los mostraba vacíos — un jefe asignado manualmente en la posición actual se perdía silenciosamente al transferir (el nuevo `managerPositionId` se mandaba `undefined`, no el valor anterior). Fix: `PositionOrgFields` gana `defaultManagerPositionId`/`defaultFunctionalManagerPositionId`; `PositionTransferModal` los precarga directamente desde los campos escalares de la `Position` actual (`position.managerPositionId`/`position.functionalManagerPositionId` — si son `null`, es que no había override explícito, y el campo queda vacío correctamente).

Sin cambios de schema ni de endpoints (la action de transferir ya aceptaba `functionalManagerPositionId`, solo no había campo para mandarlo). `pnpm --filter intranet build`/`lint` limpios.

### Criterios de aceptación — Revisión 1

- [x] El formulario de Plazas (crear y transferir) tiene campo para jefe funcional.
- [x] Transferir una posición con jefe directo/funcional explícito los precarga en el formulario.
- [ ] Verificación manual del usuario.
