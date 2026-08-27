# 0006 — Login + sesión (cookie httpOnly, Server Components)

Estado: **aprobado**

Decisión de arquitectura confirmada por el usuario: JWT guardado en cookie httpOnly, páginas leen datos en el servidor (Server Components/Actions) llamando directo al backend con el token de la cookie. TanStack Query queda pospuesto para interacciones client-side futuras, no se usa en esta tarea.

## Objetivo

Implementar el login conectado al backend (item 3 del alcance de Sprint 0) y la gestión de sesión que todas las pantallas protegidas van a usar (shell, listado de Empresas).

## Nota sobre la versión de Next.js

`apps/web` corre Next.js 16.3.2. Antes de escribir código se revisó `node_modules/next/dist/docs` (por el aviso en `AGENTS.md` de que esta versión tiene cambios que rompen con lo esperado por entrenamiento): **`middleware.ts` fue renombrado a `proxy.ts`** en Next 16 (mismo comportamiento, archivo y export distintos). Se usa `proxy.ts`, no `middleware.ts`.

## Alcance

1. `apps/web/app/lib/session.ts` — `createSession(accessToken)`, `getSessionToken()`, `deleteSession()`, usando la API `cookies()` de `next/headers`. Cookie `httpOnly`, `secure` en producción, `sameSite: lax`, expira según el `exp` real del JWT (decodificado del payload, sin verificar firma — la verificación la sigue haciendo el backend en cada request).
2. `apps/web/app/lib/api.ts` — `getApiClient()`: instancia de `@intranet/api-client` con `getToken` leyendo la cookie de sesión, para usar en Server Components/Actions.
3. `apps/web/app/actions/auth.ts` — Server Actions `login(prevState, formData)` y `logout()`.
4. `apps/web/app/login/page.tsx` — formulario (Client Component, `useActionState`) que invoca `login`.
5. `apps/web/proxy.ts` — protege rutas: sin cookie de sesión → redirige a `/login`; con cookie y en `/login` → redirige a `/`.
6. `apps/web/app/page.tsx` — se convierte en la página protegida post-login: llama a `auth.me()` en el servidor, muestra nombre de usuario y botón de "Cerrar sesión". La vista previa de la paleta de colores (tarea 0004) se mueve a `apps/web/app/design-system/page.tsx` (pública, de referencia) para no perderla.

## Fuera de alcance

- Shell de navegación real (sidebar/navbar) — tarea siguiente.
- Listado de Empresas — tarea siguiente, se construye sobre este mismo patrón de Server Component + `getApiClient()`.
- TanStack Query — pospuesto (ver decisión de arquitectura arriba).
- Refresh de token / renovación de sesión — la cookie expira junto con el JWT; al expirar, el usuario simplemente vuelve a loguearse (sin manejo especial de "sesión próxima a expirar" en este sprint).

## Decisiones técnicas

1. **Cookie `session`**: guarda el JWT del backend tal cual (no se re-encripta con `jose` como sugiere el ejemplo genérico de la documentación de Next — no aplica aquí porque el token ya viene firmado y validado por el backend NestJS, una segunda capa de cifrado sería redundante).
2. **`NEXT_PUBLIC_API_URL`**: sigue con ese nombre aunque ya no se exponga al navegador (todas las llamadas ahora son servidor→servidor) — no se renombra para evitar tocar `.env`/`.env.example` sin necesidad real.
3. **Validación del form**: se reutiliza `loginRequestSchema` de `@intranet/api-client` (evita duplicar la regla "username/password requeridos").

## Criterios de aceptación

- [x] Los 5 archivos/páginas de la sección "Alcance" implementados.
- [x] `pnpm --filter intranet build` y `pnpm --filter intranet lint` limpios (verificado por mí; el build confirma que `proxy.ts` se registró correctamente — "ƒ Proxy (Middleware)" en la tabla de rutas — y que `/` quedó dinámico, `/login`/`/design-system` estáticos).
- [x] Flujo verificado manualmente por el usuario: login y cierre de sesión funcionan correctamente.

## Nota de instalación

Se agregó `server-only` a `apps/web/package.json` (usado en `lib/session.ts`/`lib/api.ts` para garantizar que ese código nunca se incluya en el bundle del navegador). Ya estaba disponible transitivamente en `node_modules` así que el build no falló, pero conviene correr `pnpm install` para que quede declarado y fijado en el lockfile.
