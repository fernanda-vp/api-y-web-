# 0010 — Módulo `core/departments`

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-1-CLAUDE-CODE.md`, punto 2. Mismo patrón de capas que `core/zones` (spec [0009](../0009-core-zones/spec.md)), incluyendo paginación/filtros estructurados.

## Objetivo

CRUD de `Department` con jerarquía de profundidad ilimitada (`parentDepartmentId`) + endpoint de árbol completo.

## Alcance

1. `prisma/seed.ts` extendido con `StatusGroup` "DEPARTMENT" (`ACTIVE`/`INACTIVE`).
2. `core/departments/` (mismo esqueleto de capas):
   - `POST /departments` — `companyId`, `name`, `parentDepartmentId?`.
   - `GET /departments` — lista **paginada** (patrón de la revisión 1 de spec 0009): filtros `companyId`, `status`, `search` (nombre), `parentDepartmentId` (hijos directos de un nodo).
   - `GET /departments/tree?companyId=` — árbol completo **sin paginar** (se necesita completo para renderizar un árbol; no tiene sentido paginar un árbol).
   - `GET /departments/:id`.
   - `PATCH /departments/:id` — `name`, `parentDepartmentId` (reparentar).
   - `PATCH /departments/:id/enable` / `/disable`.

## Reglas de negocio

- `parentDepartmentId`, si se manda, debe existir **y pertenecer a la misma `Company`** (no se permite un padre de otra empresa).
- **Prevención de ciclos**: al reparentar (`PATCH`), no se permite que el nuevo padre sea el propio departamento ni ninguno de sus descendientes (eso crearía un ciclo en el árbol). Se valida caminando hacia arriba desde el padre propuesto.
- `Department` y `JobTitle` son árboles independientes — no hay ningún campo ni lógica compartida entre ambos (se cumple por construcción: modelos Prisma separados, cada uno con su propia auto-referencia).
- Ningún departamento se borra físicamente — `Status`, igual que el resto.

## Fuera de alcance

- Mover un departamento completo (con sus hijos) a otra `Company` — no tiene sentido de negocio, no se contempla.
- Pantalla de frontend — igual que Zonas, este sprint es backend.

## Decisiones técnicas

1. **Construcción del árbol**: una sola consulta trae **todas** las `Department` de la `Company` (flat, con `status`), y se arma el árbol en memoria agrupando por `parentDepartmentId` — evita N+1 queries recursivas.
2. **Cycle-check**: vive en `DepartmentsService` (necesita acceso a datos vía repository, no es una regla "pura" de dominio aislable).
3. Mismo patrón de paginación de `core/common/pagination/` que Zonas.

## Criterios de aceptación

- [x] `StatusGroup` "DEPARTMENT" en el seed.
- [x] Los 6 endpoints implementados y protegidos.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [x] Reparentar a un descendiente propio responde 400 (ciclo rechazado) — confirmado por el usuario.
- [x] Verificación manual del usuario: jerarquía, árbol, reparentar, ciclo rechazado, paginación — todo correcto.

## Nota de implementación

El armado de árbol (`buildTree`) y la detección de ciclos (`findCycleConflict`) quedaron en `core/common/hierarchy/tree.util.ts` — genéricos, no específicos de `Department` — porque `core/job-titles` (siguiente tarea) va a necesitar exactamente la misma lógica sobre su propia jerarquía independiente.
