# 0002 — Módulo `core/users` + `auth` (login JWT, `/auth/me`, guards)

Estado: **aprobado**

Ver [glosario](../glossary.md) para nomenclatura.

## Objetivo

Implementar el login JWT y `/auth/me` del alcance de Sprint 0, apoyado en el split `User`/`UserCredential`/`Employee` ya definido en el schema (spec [0001](../0001-prisma-schema-sprint0/spec.md)).

## Alcance

1. `PrismaService` (infraestructura, en `core/prisma/`): wrapper de NestJS sobre el `PrismaClient` generado (`../../generated/prisma`), con lifecycle hooks (`onModuleInit`/`onModuleDestroy`).
2. Módulo `core/users`: acceso a `User`/`UserCredential`/`Employee` necesario para login. **No** expone endpoints HTTP de gestión de usuarios (crear/editar/borrar) — eso no está pedido en Sprint 0 y sería adelantar alcance.
3. Módulo `core/auth`:
   - `POST /auth/login` — recibe `username`/`password`, valida contra `UserCredential`, devuelve JWT.
   - `GET /auth/me` — protegido por guard JWT, devuelve datos del usuario autenticado (`User` + `Employee` si existe).
   - `JwtStrategy` (passport-jwt) + `JwtAuthGuard` reutilizable para proteger rutas futuras.
4. Script de seed (`apps/backend/prisma/seed.ts`): crea los `StatusGroup`/`Status` mínimos (`USER`: ACTIVE/INACTIVE; `EMPLOYEE`: ACTIVE/INACTIVE/TERMINATED) y **un usuario admin de prueba** para poder probar el login de punta a punta.

## Fuera de alcance

- Endpoints de gestión de usuarios/empleados (alta, edición, baja) — no pedidos en Sprint 0.
- Refresh tokens, recuperación de contraseña, bloqueo por intentos fallidos.
- Enforcement de `Role`/`Permission`/`RoleAssignment` (autorización) — Sprint 0 solo pide guards de **autenticación**, no de autorización con scope.
- SSO/AD/LDAP — el doc pide dejar la interfaz lista pero no implementar el proveedor; no se toca en esta tarea.
- Resto de catálogos de `core/users` (Departamento, Puesto, etc.) — corresponde a la tarea de `core/companies`.

## Estructura de carpetas (capas)

```
apps/backend/src/
├── core/
│   ├── prisma/
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── users/
│   │   ├── domain/
│   │   │   └── password.policy.ts       # hashing/verificación (bcrypt), sin I/O
│   │   ├── infrastructure/
│   │   │   └── users.repository.ts      # Prisma: findByUsername, findById (con employee/credential)
│   │   ├── application/
│   │   │   └── users.service.ts         # orquesta repository + domain policy
│   │   └── users.module.ts
│   └── auth/
│       ├── presentation/
│       │   ├── auth.controller.ts
│       │   └── dto/login.dto.ts
│       ├── application/
│       │   └── auth.service.ts
│       ├── infrastructure/
│       │   ├── jwt.strategy.ts
│       │   └── jwt-auth.guard.ts
│       └── auth.module.ts
```

`core/users` no tiene capa de presentación en esta tarea (sin controller propio) porque no expone HTTP todavía — solo es consumido internamente por `core/auth`.

## Reglas de negocio

- El login valida `username` contra `User.username`, obtiene `UserCredential.passwordHash` y compara con bcrypt.
- Si `User.status.isActive === false` (vía `Status.isActive`), el login se rechaza aunque la contraseña sea correcta.
- El JWT incluye `sub` (userId) y `username`; expira según `JWT_EXPIRES_IN` (`.env`).
- `/auth/me` resuelve el usuario desde el JWT (no vuelve a pedir credenciales) e incluye el `Employee` asociado si existe (no todo `User` tiene `Employee` — ver spec 0001, revisión 2).

## Decisiones técnicas

1. **Hashing**: `bcrypt`, cost factor 10 (ya instalado).
2. **JWT**: `@nestjs/jwt` + `passport-jwt`, secreto y expiración desde `.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`, ya en `.env.example`).
3. **DTOs**: `class-validator`/`class-transformer` para `LoginDto` (username/password requeridos, sin reglas de complejidad de password en esta tarea).
4. **PrismaService**: se importa el cliente desde `../../generated/prisma` (path custom del generator, ver Hallazgos de spec 0001).
5. **Seed**: usa `prisma.config.ts` → `migrations.seed` (ya soporta seed vía `tsx prisma/seed.ts`, según lo visto en `references/init.md` del skill de Prisma CLI). Usuario admin de prueba: `admin` / contraseña temporal documentada en el seed (a cambiar en el primer login — el forzar cambio de password no es parte de esta tarea, solo se deja anotado).

## Infraestructura de base de datos (bloqueante para pruebas end-to-end)

Se agregó `docker-compose.yml` en la raíz del monorepo con un servicio Postgres 16, y se actualizó `apps/backend/.env.example` para apuntar a él (reemplaza el `prisma+postgres://` que dejó `prisma init` por defecto — ver Hallazgo #1 de spec 0001, ahora resuelto).

**Estos pasos los ejecuta el usuario manualmente** (según lo acordado, para reducir consumo de tokens):

```bash
# 0) Instalar los paquetes nuevos que requiere Prisma 7 (driver adapter) + tsx para el seed
pnpm --filter intranet-api add @prisma/adapter-pg pg
pnpm --filter intranet-api add -D @types/pg tsx

# 1) Levantar Postgres (publicado en el host como 5433, no 5432 — ver hallazgo #3)
docker compose up -d

# 2) apps/backend/.env con DATABASE_URL apuntando a localhost:5433

# 3) Generar y aplicar la migración inicial
pnpm --filter intranet-api exec prisma migrate dev --name init

# 4) Generar el cliente (por si el paso anterior no lo hizo)
pnpm --filter intranet-api exec prisma generate

# 5) Cargar el seed
pnpm --filter intranet-api exec prisma db seed

# 6) Verificar build y lint
pnpm --filter intranet-api build
pnpm --filter intranet-api lint

# 7) Levantar el backend
pnpm --filter intranet-api start:dev

# 8) Probar login (en otra terminal, o desde Swagger en http://localhost:3001/api)
curl -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"Admin123!\"}"

# 9) Probar /auth/me con el token que devuelva el paso anterior
curl http://localhost:3001/auth/me -H "Authorization: Bearer <token>"
```

**Resultado real verificado**: `/auth/me` devolvió `{ "id": 1, "username": "admin", "name": "Admin", "lastName": "User", "photoUrl": null, "employee": null }` — flujo completo funcionando.

## Criterios de aceptación

- [x] `PrismaService`/`PrismaModule` compilan y siguen el ciclo de vida de NestJS.
- [x] `core/users`: repository + service + domain policy implementados, sin endpoints HTTP propios.
- [x] `core/auth`: `POST /auth/login`, `GET /auth/me`, `JwtStrategy`, `JwtAuthGuard` implementados.
- [x] `apps/backend/prisma/seed.ts` crea los `StatusGroup`/`Status` mínimos + usuario admin de prueba.
- [x] `pnpm --filter intranet-api build` y `pnpm --filter intranet-api lint`: limpios tras instalar `@prisma/adapter-pg`/`pg`/`@nestjs/swagger@11.4.7`.
- [x] Migración, seed, login y `/auth/me` verificados **manualmente por el usuario**: `POST /auth/login` con `admin`/`Admin123!` devuelve JWT válido, `GET /auth/me` devuelve `{ id: 1, username: "admin", name: "Admin", lastName: "User", photoUrl: null, employee: null }`.

## Hallazgos adicionales durante la verificación manual

1. **`ts-node` no resuelve los imports internos del cliente generado**: el cliente de Prisma 7 usa imports internos con extensión `.js` apuntando a archivos `.ts` (convención pensada para `tsx`, no para `ts-node`). Se cambió `migrations.seed` en `prisma.config.ts` de `"ts-node prisma/seed.ts"` a `"tsx prisma/seed.ts"` (se agregó `tsx` como devDependency).
2. **`@nestjs/swagger` instalado inicialmente en v12.0.0, incompatible con Nest 11**: `pnpm add @nestjs/swagger` sin especificar versión trajo la v12, que exige `@nestjs/core`/`@nestjs/common` `^12.0.0` — este proyecto está en Nest 11. Se corrigió instalando `@nestjs/swagger@11.4.7` (última de la serie 11.x, compatible).
3. **Conflicto de puerto 5432 con un Postgres nativo de Windows**: la máquina del usuario tenía un Postgres instalado nativamente (servicio de Windows) escuchando en el puerto 5432, compitiendo con el contenedor Docker por el mismo puerto. Todas las conexiones (psql, pgAdmin, Prisma) estaban llegando al Postgres nativo en vez de al contenedor, de ahí el rechazo constante de credenciales aunque el contenedor tuviera la contraseña correcta (confirmado con `docker exec intranet-postgres env`). **Fix**: se remapeó el contenedor a `5433:5432` en `docker-compose.yml`, y se actualizó `DATABASE_URL` en `.env`/`.env.example` a puerto `5433`, sin tocar el Postgres nativo del usuario.

## Hallazgo adicional durante la implementación (driver adapters obligatorios en Prisma 7)

A diferencia de Prisma 5/6, en Prisma 7 el generator `prisma-client` (el nuevo generator por defecto, el que ya estábamos usando) **requiere un driver adapter explícito** para proveedores SQL — ya no basta con `new PrismaClient()`. Se agregó:
- `@prisma/adapter-pg` (adapter de Postgres) + `pg` (driver nativo) como dependencias nuevas, usadas en `PrismaService` y en `prisma/seed.ts`.
- El generator ahora incluye `moduleFormat = "cjs"` en `base.prisma`: el cliente generado por defecto es ESM (usa `import.meta.url`), pero este backend de NestJS es CommonJS (sin `"type": "module"` en `package.json`), así que sin este flag el cliente generado no habría cargado en tiempo de ejecución.
- El import correcto del cliente es `../generated/prisma/client` (el archivo `client.ts` dentro de la carpeta de salida), no la carpeta a secas — la carpeta no tiene `index`/`package.json` propio.
