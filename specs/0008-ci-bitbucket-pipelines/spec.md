# 0008 — CI: lint + build + test (Bitbucket Pipelines)

Estado: **aprobado**

## Desviación del stack documentado

El documento de contexto fija "GitHub Actions" como CI/CD (sección "no renegociar sin razón de peso"). El usuario decidió alojar el repo en **Bitbucket** (`https://bitbucket.org/Arcosz/intranet-2.0`), no GitHub — GitHub Actions no puede ejecutarse sobre un repo que no vive en GitHub. Se usa el equivalente de Bitbucket: **Bitbucket Pipelines** (`bitbucket-pipelines.yml`). Mismo objetivo (lint + build + test en cada PR, sin deploy), formato de archivo distinto.

## Hallazgo: se detectó que nada estaba commiteado

Antes de esta tarea, todo el trabajo de Sprint 0 (monorepo, backend, frontend, specs) estaba solo en el working tree — **cero commits**. Se resolvió como parte de esta tarea:
- Se agregaron `.agents/`, `.claude/`, `.windsurf/`, `skills-lock.json` a `.gitignore` (carpetas de configuración de herramientas de IA auto-instaladas por `prisma init`, no son código del proyecto).
- Se limpiaron los directorios `.git-old-empty`/`.git-old-scaffold-commit` que quedaron de la migración a monorepo (spec 0000, sin valor real).
- Commit inicial con todo el Sprint 0 construido hasta ahora, pusheado a `origin/main` en Bitbucket.

## Objetivo

Que cada Pull Request (y cada push a `main`) corra automáticamente lint + build + test de todo el monorepo, sin intervención manual.

## Alcance

1. `bitbucket-pipelines.yml`: un solo step reutilizado (vía YAML anchor) para PRs y para `main`, corriendo:
   - `pnpm install --frozen-lockfile`
   - `prisma generate` (necesario antes de lint/build del backend — el cliente generado no se commitea)
   - typecheck de `packages/api-client`
   - `pnpm run lint` / `pnpm run build` / `pnpm run test` (Turborepo, corre en los 3 paquetes del workspace)
2. Caché del store de pnpm entre corridas (definido en `definitions.caches`).

## Fuera de alcance

- Tests e2e con base de datos real (`test/app.e2e-spec.ts` del backend) — arranca el `AppModule` completo, que ahora exige una conexión Postgres real vía `PrismaService`. Se excluye deliberadamente: `pnpm run test` ya solo corre los tests unitarios (Jest del backend tiene `rootDir: "src"`, no toca `test/app.e2e-spec.ts` — ese archivo vive fuera de `src/` y solo lo ejecuta el script separado `test:e2e`, que no se llama aquí). Agregar Postgres real al pipeline (vía `definitions.services`) queda para cuando haya más lógica de negocio que justifique probar contra base de datos real en CI.
- Deploy — explícitamente fuera de alcance del Sprint 0 según el documento de contexto.
- Cache de Turborepo (remote caching) — optimización futura, no esencial para que el gate funcione.

## Decisiones técnicas

1. **Imagen**: `node:20.19.5` (misma versión usada localmente; Prisma 7 exige Node ≥20.19.0).
2. **pnpm vía Corepack**: `corepack enable && corepack prepare pnpm@9.15.0 --activate` (misma versión que `packageManager` en el `package.json` raíz), en vez de instalar pnpm como dependencia separada.
3. **Sin secrets/env vars en el pipeline**: nada en `build`/`lint`/`test` hoy necesita `DATABASE_URL`/`JWT_SECRET` reales (ya verificado: `PrismaService`/`JwtModule` solo llaman `getOrThrow` en tiempo de arranque de la app, no durante build/lint/test unitario). Si más adelante se agregan tests e2e con DB real, ahí sí hace falta configurar variables de repositorio en Bitbucket.

## Paso manual pendiente (Bitbucket)

**Bitbucket Pipelines debe habilitarse manualmente** en la configuración del repositorio (Repository settings → Pipelines → Enable Pipelines) — es un toggle de la cuenta/repo que no se puede activar desde el código. El usuario lo hace una vez, después de que este archivo esté pusheado.

## Criterios de aceptación

- [x] `bitbucket-pipelines.yml` implementado según lo de arriba.
- [x] Validado localmente, comando por comando, la secuencia exacta que correrá el pipeline (`pnpm install --frozen-lockfile`, `prisma generate`, typecheck de `api-client`, `lint`, `build`, `test`) — todo pasa limpio.
- [x] El usuario commiteó/pusheó `bitbucket-pipelines.yml`, habilitó Pipelines en Bitbucket y confirmó una corrida real en verde.
