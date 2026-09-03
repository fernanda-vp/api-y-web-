# 0011 — Módulo `core/job-titles`

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-1-CLAUDE-CODE.md`, punto 3. Mismo patrón que `core/departments` (spec [0010](../0010-core-departments/spec.md)), reutilizando `core/common/hierarchy/tree.util.ts` y `core/common/pagination/`.

## Objetivo

CRUD de `JobTitle` con jerarquía propia e **independiente** de `Department` (auto-referencia `parentJobTitleId`).

## Diferencia clave con Departments

`JobTitle` **no tiene `companyId`** (confirmado en el schema — spec 0001: "catálogo global del producto, no por empresa"). Esto simplifica el módulo respecto a Departments:
- Sin scoping por empresa en ningún endpoint.
- Sin validación "el padre debe pertenecer a la misma empresa" (no aplica, es un catálogo único para toda la instalación).
- `GET /job-titles/tree` no necesita `companyId` — devuelve el árbol completo de la instalación.

## Alcance

1. `prisma/seed.ts` extendido con `StatusGroup` "JOB_TITLE" (`ACTIVE`/`INACTIVE`).
2. `core/job-titles/`:
   - `POST /job-titles` — `name`, `parentJobTitleId?`.
   - `GET /job-titles` — paginado, filtros `status`, `search`, `parentJobTitleId`.
   - `GET /job-titles/tree` — árbol completo, sin paginar.
   - `GET /job-titles/:id`.
   - `PATCH /job-titles/:id` — `name`, `parentJobTitleId` (reparentar, con el mismo cycle-check de Departments).
   - `PATCH /job-titles/:id/enable` / `/disable`.

## Reglas de negocio

- Mismas que Departments salvo el scoping por empresa: sin borrado físico, prevención de ciclos al reparentar, árbol independiente del de `Department` (se cumple por construcción — modelos Prisma separados).

## Fuera de alcance

- Igual que los módulos anteriores: sin frontend en este sprint.

## Criterios de aceptación

- [x] `StatusGroup` "JOB_TITLE" en el seed.
- [x] Los 6 endpoints implementados y protegidos.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [x] Verificación manual del usuario: todo correcto.
