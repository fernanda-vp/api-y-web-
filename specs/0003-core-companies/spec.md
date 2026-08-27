# 0003 — Módulo `core/companies` (ejemplo funcional completo, 4 capas)

Estado: **aprobado**

Ver [glosario](../glossary.md) para nomenclatura.

## Objetivo

Implementar el módulo `core/companies` como el **ejemplo de referencia completo** de las 4 capas del backend (Presentación → Aplicación → Dominio → Infraestructura), tal como pide el documento de contexto para `core/empresas`. Este módulo es la plantilla que se copiará para los catálogos futuros (Zone, Department, JobTitle...).

## Alcance

CRUD completo sobre `Company`, siempre respetando "nunca borrado físico":

1. `POST /companies` — crear empresa (`name`, `rfc`; `status` se asigna automáticamente como `ACTIVE`).
2. `GET /companies` — listar (filtro opcional `?status=active|inactive`, orden por `name`). Sin paginación: por instalación se esperan pocas empresas (holding con unas cuantas razones sociales, no cientos).
3. `GET /companies/:id` — detalle.
4. `PATCH /companies/:id` — actualizar `name`/`rfc`.
5. `PATCH /companies/:id/enable` y `PATCH /companies/:id/disable` — cambiar estatus. **No existe DELETE.**

Todos los endpoints requieren autenticación (`JwtAuthGuard`) — Sprint 0 no incluye autorización por rol/permiso todavía (eso es `RoleAssignment`, fuera de alcance).

## Fuera de alcance

- Paginación, búsqueda avanzada, ordenamiento configurable.
- Autorización por `Role`/`Permission`/`RoleAssignment` (solo autenticación).
- Relaciones anidadas en la respuesta (no se listan `zones`/`departments` de la empresa aquí).
- Endpoints para `Zone`/`Department`/`JobTitle`/`Position` — quedan para tareas siguientes usando este módulo como plantilla.

## Estructura de carpetas (capas)

```
apps/backend/src/core/companies/
├── domain/
│   └── rfc.policy.ts            # validación de formato de RFC, pura, sin I/O
├── infrastructure/
│   └── companies.repository.ts  # Prisma: create, findMany, findById, update, setStatus
├── application/
│   └── companies.service.ts     # orquesta repository + domain policy + resolución de Status
├── presentation/
│   ├── companies.controller.ts
│   └── dto/
│       ├── create-company.dto.ts
│       └── update-company.dto.ts
└── companies.module.ts
```

## Reglas de negocio

- `rfc`: se valida formato con una regla simplificada (persona moral: 3 letras + 6 dígitos + 3 alfanuméricos; persona física: 4 letras + 6 dígitos + 3 alfanuméricos) — es una validación de forma, no verifica el RFC contra el SAT.
- Ninguna empresa se borra físicamente: `disable` solo cambia `statusId` al `Status` "INACTIVE" del grupo `COMPANY`.
- Al crear, si no existe todavía el `StatusGroup` "COMPANY" con sus `Status` (`ACTIVE`/`INACTIVE`), el seed debe haberlos creado — **se extiende `prisma/seed.ts`** para agregarlos (mismo patrón que `USER`/`EMPLOYEE`).

## Decisiones técnicas

1. **DTOs**: `CreateCompanyDto` (`name`, `rfc` requeridos), `UpdateCompanyDto` (`name`/`rfc` opcionales, `class-validator` con `@IsOptional()`).
2. **Enable/disable como acciones, no como PATCH genérico de status**: dos endpoints explícitos (`/enable`, `/disable`) en vez de aceptar un `statusId`/`statusCode` arbitrario por body — más seguro y más claro que "cualquier estatus se puede setear desde el cliente".
3. **Repository devuelve el modelo de Prisma con `status` incluido** (`include: { status: true }`), sin DTO de respuesta separado por ahora (Sprint 0, alcance mínimo).
4. **Guard**: todos los endpoints requieren `JwtAuthGuard` (reutilizado de la tarea 0002).

## Adición no planeada: `core/statuses`

Al implementar `CompaniesService` se hizo evidente que resolver "el `Status` activo/inactivo del grupo X" es una operación que **todo catálogo futuro** (Zone, Department, JobTitle, Position) va a necesitar igual. En vez de duplicar la consulta `prisma.status.findFirst({ where: { code, group: { code } } })` en cada servicio, se creó un módulo compartido:

```
apps/backend/src/core/statuses/
├── infrastructure/statuses.repository.ts   # findByGroupAndCode
├── application/statuses.service.ts         # getRequired (lanza 500 si el seed no corrió)
└── statuses.module.ts                      # exporta StatusesService
```

`CompaniesModule` lo importa; los módulos de catálogo futuros harán lo mismo.

## Criterios de aceptación

- [x] `prisma/seed.ts` extendido con `StatusGroup` "COMPANY" (`ACTIVE`/`INACTIVE`).
- [x] Los 5 endpoints implementados y protegidos con `JwtAuthGuard`.
- [x] `pnpm --filter intranet-api build` y `pnpm --filter intranet-api lint` limpios (verificado por mí).
- [x] Verificación manual del CRUD completo contra Postgres real, confirmada por el usuario.

## Pasos para que el usuario verifique manualmente

```powershell
# El seed ahora también crea el StatusGroup "COMPANY" — hay que volver a correrlo
pnpm --filter intranet-api exec prisma db seed

pnpm --filter intranet-api start:dev
```

Luego en `http://localhost:3001/api`, autenticado con el token de `/auth/login` (botón "Authorize"):
1. `POST /companies` con `{ "name": "Acme SA de CV", "rfc": "ACM010101AB1" }` → debería crear con estatus `ACTIVE`.
2. `GET /companies` → debería listarla.
3. `GET /companies/:id` → detalle.
4. `PATCH /companies/:id/disable` → cambia a `INACTIVE`.
5. `GET /companies?status=inactive` → debería aparecer ahí y no en `?status=active`.
6. Probar `POST /companies` con un `rfc` inválido (ej. `"123"`) → debería responder `400 Bad Request`.
