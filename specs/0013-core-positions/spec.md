# 0013 — Módulo `core/positions`

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-1-CLAUDE-CODE.md`, punto 5 — "la pieza más delicada de este sprint". 2 decisiones confirmadas por el usuario:
1. La derivación automática de jefe busca candidatos dentro del mismo **`Department`** (no `Zone`).
2. El caso de ambigüedad (varios candidatos a jefe) se **calcula al vuelo**, no se persiste — siempre refleja el estado real actual.

## Objetivo

`Position` conecta `Employee` + `JobTitle` + `Department` + `Zone`, con historial de fechas (nunca se sobreescribe un cambio de puesto: se cierra la posición actual y se crea una nueva), jefe directo (override manual con prioridad absoluta) y jefe funcional (independiente, nunca deriva automáticamente), más el algoritmo de derivación automática de jefe directo cuando no hay override.

## Alcance

### Ciclo de vida (histórico — nunca se sobreescribe jobTitle/department/zone)

1. `POST /positions` — crea una posición nueva: `employeeId`, `jobTitleId`, `departmentId`, `zoneId`, `managerPositionId?`, `functionalManagerPositionId?`, `startDate?` (default: ahora).
2. `PATCH /positions/:id` — **solo** `managerPositionId`/`functionalManagerPositionId` (aceptan `null` explícito para volver a la derivación automática). No permite cambiar `jobTitleId`/`departmentId`/`zoneId`/`employeeId` — eso es lo que el documento llama "nunca sobreescribir".
3. `POST /positions/:id/transfer` — la operación real de "cambio de puesto": cierra la posición actual (`endDate = ahora`, estatus `ENDED`) y crea una posición nueva para el mismo `employeeId` con `jobTitleId`/`departmentId`/`zoneId` nuevos (+ `managerPositionId?`/`functionalManagerPositionId?` opcionales, `effectiveDate?`). Devuelve la posición nueva.
4. `PATCH /positions/:id/end` — cierra sin reemplazo (`endDate`, estatus `ENDED`) — para cuando una de varias posiciones simultáneas de un empleado termina sin transferencia inmediata.

### Consulta

5. `GET /positions` — paginado, filtros `employeeId`, `departmentId`, `zoneId`, `jobTitleId`, `status` (`active`/`ended`). **Sin** resolución de jefe calculada (sería una consulta extra por fila; ver punto 6).
6. `GET /positions/:id` — detalle, **incluye `managerResolution`** calculado en el momento:
   - `{ source: 'explicit', position }` — `managerPositionId` está seteado (prioridad absoluta).
   - `{ source: 'derived', position }` — sin override, un solo candidato ocupando el `JobTitle` padre en el mismo `Department`.
   - `{ source: 'ambiguous', candidates: Position[] }` — más de un candidato, pendiente de resolución manual (no se elige solo).
   - `{ source: 'none' }` — sin override, sin `JobTitle` padre, o nadie ocupa el puesto padre todavía.

## Algoritmo de derivación automática (solo cuando `managerPositionId` es `null`)

1. Buscar `parentJobTitleId` del `JobTitle` de esta posición. Si es `null` → `source: 'none'` (tope de la jerarquía).
2. Buscar todas las `Position` **activas** (`status = ACTIVE`, `endDate = null`) con `jobTitleId = parentJobTitleId` **y** `departmentId` igual al de esta posición.
3. 0 candidatas → `source: 'none'`. 1 candidata → `source: 'derived'`. 2+ candidatas → `source: 'ambiguous'` (nunca se elige automáticamente).

## Reglas de negocio

- `managerPositionId` tiene prioridad absoluta sobre la derivación — si está seteado, ni se calcula el algoritmo.
- `functionalManagerPositionId` es completamente independiente — nunca participa en la derivación de `managerPositionId` ni viceversa.
- Un `Employee` puede tener varias `Position` simultáneas (confirmado en el documento) — no hay restricción de unicidad.
- `department.companyId` y `zone.companyId` deben coincidir (integridad: una posición no puede mezclar departamento y zona de empresas distintas).
- No se permite transferir (`/transfer`) ni cerrar (`/end`) una posición que ya está `ENDED`.

## Fuera de alcance

- `core/roles`/`RoleAssignment` (scope de permisos) — el propio documento lo anuncia para el sprint siguiente, aunque `Position` ya deja lista la estructura (Department/Zone/JobTitle) que ese motor va a necesitar.
- Resolución de jefe calculada en el listado (`GET /positions`) — solo en el detalle.
- Frontend.

## Decisiones técnicas

1. **`StatusGroup` "POSITION"**: `ACTIVE`/`ENDED` — 2 estados, gobernados automáticamente por `transfer`/`end` (`endDate` es la fuente de verdad; el estatus la sigue), no hay `enable`/`disable` manual arbitrario como en los demás módulos.
2. **`resolveManager()`** vive en `PositionsService` (necesita acceso a datos — `JobTitle.parentJobTitleId` + búsqueda de `Position` candidatas — no es una regla "pura" de dominio aislable).
3. **Validaciones de existencia** (`employee`/`jobTitle`/`department`/`zone`/`managerPosition`/`functionalManagerPosition`) vía consultas directas de `PositionsRepository` a Prisma, sin importar los módulos de esas entidades (mismo patrón ya usado en Zones/Departments para `companyExists`).

## Criterios de aceptación

- [x] Los 6 endpoints implementados y protegidos.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [x] `managerResolution` en `GET /positions/:id` cubre los 4 casos (`explicit`/`derived`/`ambiguous`/`none`) — verificado por el usuario vía frontend.
- [x] `transfer` cierra la posición vieja y crea una nueva, sin perder historial — verificado por el usuario vía frontend.

## Bug encontrado durante la integración con el frontend

`POSITION_INCLUDE` en `positions.repository.ts` usaba `jobTitle: true`, `department: true`, `zone: true` y `employee: { include: { user: true } }` — pero Prisma **no incluye relaciones de relaciones automáticamente**: `include: { jobTitle: true }` trae los campos propios de `JobTitle`, no su relación `status`. El frontend (con validación zod estricta) lo detectó de inmediato al fallar el parseo de `GET /positions`.

**Fix**: cada relación anidada ahora especifica explícitamente su propio `status`:
```ts
const POSITION_INCLUDE = {
  status: true,
  employee: { include: { user: true, status: true } },
  jobTitle: { include: { status: true } },
  department: { include: { status: true } },
  zone: { include: { status: true } },
} satisfies Prisma.PositionInclude;
```

## Revisión 1 — 3 hallazgos de code review (integridad de datos)

Una revisión de código sobre todo el diff de Sprint 2 encontró tres huecos reales en `PositionsService`, todos corregidos con el mismo estilo ya establecido en el módulo (sin mecanismos nuevos):

1. **Jefe de otra empresa**: `assertPositionExists` (usado por `create`/`transfer`/`update` para validar `managerPositionId`/`functionalManagerPositionId`) solo comprobaba que la posición existiera, no que perteneciera a la **misma empresa** que la posición que la referencia — a diferencia del propio `department`/`zone`, que sí exigen coincidir en empresa. Renombrado a `assertManagerPositionValid(id, expectedCompanyId, label)`, ahora compara `position.department.companyId` contra la empresa de la posición actual (ya disponible sin query extra: `POSITION_INCLUDE` ya trae `department` completo). Aplica igual en `assertReferencesAreValid` (create/transfer) y en `update` (que ahora reutiliza el `companyId` ya calculado en `buildScopeTarget` en vez de pedirlo de nuevo).
2. **Dos plazas activas simultáneas**: `create()` no impedía dar de alta una posición nueva para un empleado que ya tenía una activa (el camino esperado es `/transfer`, que sí cierra la anterior). Nuevo `PositionsRepository.hasActivePosition(employeeId)`, chequeado justo después de `assertScope` — rechaza con `ConflictException` sugiriendo usar `/transfer`.
3. **`transfer` no era atómico**: cerrar la posición vieja (`close`) y crear la nueva (`create`) eran dos llamadas Prisma independientes — si el proceso fallaba entre medio, el empleado quedaba sin ninguna posición activa, sin forma de recuperarse automáticamente. Nuevo `PositionsRepository.transferAtomically(...)`, que envuelve ambas escrituras en un solo `prisma.$transaction([...])` (mismo patrón ya usado en `RolesRepository.bulkSetPermissions` para el caso `grant: true`).

Sin cambios de schema, no requiere migración. `pnpm --filter intranet-api build`/`lint` limpios.

### Criterios de aceptación — Revisión 1

- [x] Un jefe (directo o funcional) de otra empresa se rechaza en create/transfer/update.
- [x] `POST /positions` rechaza si el empleado ya tiene una posición activa.
- [x] `transfer` es atómico (una sola transacción).
- [ ] Verificación manual del usuario.
