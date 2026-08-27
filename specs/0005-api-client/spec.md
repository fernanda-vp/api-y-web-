# 0005 — `packages/api-client` (zod + cliente tipado, Auth y Companies)

Estado: **aprobado**

Ver [glosario](../glossary.md) para nomenclatura.

## Objetivo

Completar el esqueleto vacío de `packages/api-client` (creado en la migración a monorepo) con esquemas zod y funciones tipadas para `auth` y `companies`, espejando exactamente los contratos ya implementados en el backend (specs [0002](../0002-auth-core-users/spec.md) y [0003](../0003-core-companies/spec.md)). Este paquete lo van a consumir tanto `apps/web` como, a futuro, `apps/mobile`.

## Alcance

1. Esquemas zod: `Status`, `LoginRequest`/`LoginResponse`, `Employee`, `MeResponse`, `Company`, `CreateCompanyInput`/`UpdateCompanyInput`.
2. `createApiClient({ baseURL, getToken })` — factory que devuelve un cliente axios tipado con métodos `auth.login`, `auth.me`, `companies.list/get/create/update/enable/disable`.
3. Cada método valida la respuesta del backend con el schema zod correspondiente antes de devolverla (`schema.parse(response.data)`) — si el backend cambia de forma sin avisar, el cliente falla ruidosamente en vez de devolver datos con forma incorrecta silenciosamente.

## Fuera de alcance

- Manejo de dónde se guarda el token (localStorage, cookie, SecureStore) — el paquete solo recibe un `getToken()` inyectado por quien lo consuma (Web o Mobile deciden cómo persistirlo).
- Refresh de token / reintentos automáticos.
- React Query / hooks — eso es capa de "Estado/Aplicación" del frontend, se construye en la tarea del login/shell usando este cliente como base.
- Schemas para Zone/Department/JobTitle/Position/Role/etc. — no existen esos endpoints todavía en el backend.

## Estructura

```
packages/api-client/src/
├── schemas/
│   ├── status.ts
│   ├── auth.ts
│   └── company.ts
├── client.ts        # createApiClient(config)
└── index.ts         # re-exporta todo
```

## Decisiones técnicas

1. **`axios`** dentro del paquete (no `fetch` nativo) — funciona igual en Next.js y en React Native/Expo, evita reimplementar manejo de headers/params en cada consumidor.
2. **Inyección de `getToken`**: `createApiClient({ baseURL: string, getToken?: () => string | null | Promise<string | null> })`. Un interceptor de request agrega `Authorization: Bearer <token>` si `getToken()` devuelve algo.
3. **Fechas**: los campos `createdAt`/`updatedAt`/`terminationDate` se validan con `z.coerce.date()` (el backend los serializa como string ISO en JSON; zod los convierte a `Date` en el cliente).
4. **Tipos inferidos**: cada schema exporta su tipo con `z.infer<>` (`LoginRequest`, `Company`, etc.) para que Web/Mobile los usen sin duplicar interfaces.

## Criterios de aceptación

- [x] Los 3 archivos de schemas + `client.ts` + `index.ts` implementados según lo de arriba.
- [x] `axios` agregado como dependencia del paquete e instalado.
- [x] Compila sin errores de tipo (`tsc --noEmit` limpio, confirmado por el usuario).
- [x] Se deja sin consumir todavía — la tarea de login/shell es la que lo conecta a una pantalla real.
