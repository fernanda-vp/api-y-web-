# 0009 — Módulo `core/zones`

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-1-CLAUDE-CODE.md`, punto 1 del alcance. Sigue el mismo patrón de 4 capas de `core/companies` (spec [0003](../0003-core-companies/spec.md)).

## Objetivo

CRUD de `Zone` + habilitar/deshabilitar vía `Status`/`StatusGroup` (no campo booleano), igual que `Company`.

## Alcance

1. `prisma/seed.ts` extendido con `StatusGroup` "ZONE" (`ACTIVE`/`INACTIVE`).
2. `core/zones/` (domain/infrastructure/application/presentation), mismo esqueleto que `core/companies`:
   - `POST /zones` — `companyId`, `name`, `address`.
   - `GET /zones` — filtros opcionales `?companyId=` y `?status=active|inactive`.
   - `GET /zones/:id`.
   - `PATCH /zones/:id` — `name`/`address` (no se reasigna `companyId`).
   - `PATCH /zones/:id/enable` / `/disable`.
3. Todos los endpoints protegidos con `JwtAuthGuard` (igual que Companies).

## Fuera de alcance

- Reasignar una `Zone` a otra `Company` (no pedido; si hiciera falta, es un caso de negocio a confirmar aparte).
- Pantalla de frontend para Zonas — este sprint es solo backend según el documento de contexto (no lo menciona como entregable de Sprint 1); se agrega cuando se pida explícitamente.

## Decisiones técnicas

1. **Validación de `companyId`**: al crear/filtrar, si el `companyId` no corresponde a una `Company` existente, `create` responde 404 (se reutiliza el patrón `findById`-o-404, ahora contra `CompaniesRepository`... o más simple: se valida con una consulta directa, sin acoplar `ZonesModule` a `CompaniesModule` completo — solo importa lo necesario para validar existencia).
2. **Sin capa de dominio con reglas propias**: a diferencia de `rfc.policy.ts` en Companies, `Zone` no tiene una regla de formato que validar (`name`/`address` son texto libre) — la carpeta `domain/` se omite en este módulo si no hay nada que poner ahí (evitar carpetas vacías).
3. Mismo criterio que Companies: sin paginación (pocas zonas esperadas por empresa).

## Criterios de aceptación

- [x] `StatusGroup` "ZONE" en el seed.
- [x] Los 5 endpoints implementados y protegidos.
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [x] Verificación manual del usuario vía Swagger: paginado confirmado funcionando.

## Revisión 1 — paginación y filtros estructurados

El usuario señaló que Zonas/Departamentos/Empleados/Plazas van a tener muchos más registros que Companies (que sí se dejó sin paginar, correctamente, por ser pocas por instalación). Se agregó:

1. **`core/common/pagination/`** (nuevo, compartido para todos los módulos de catálogo):
   - `PaginationQueryDto` (`page`, `limit`, con defaults 1/20 y `@Max(100)` en `limit`).
   - `PaginatedResult<T>` + `buildPaginatedResult()` — respuesta `{ data, meta: { total, page, limit, totalPages } }`.
2. **`FindZonesQueryDto`** (extiende `PaginationQueryDto`) con `companyId`, `status`, `search` — reemplaza los `@Query('x')` sueltos por un DTO validado con `class-validator`/`class-transformer` (filtro "estructurado").
3. **Búsqueda por nombre** (`search`, `contains` + `mode: insensitive`) — nuevo, no estaba en el alcance original pero es trivial de agregar junto con el resto y da valor real para catálogos grandes.
4. `ZonesRepository` ahora expone `count()` además de `findMany(where, skip, take)`.

**Patrón a seguir en los módulos siguientes** (Departments, JobTitles, Employees, Positions): su propio `FindXQueryDto extends PaginationQueryDto`, repository con `findMany(where, skip, take)` + `count(where)`, service arma el `where` y devuelve `buildPaginatedResult(...)`. Companies queda igual (sin paginar), decisión ya justificada en spec 0003.

`pnpm --filter intranet-api build`/`lint` limpios tras el cambio.
