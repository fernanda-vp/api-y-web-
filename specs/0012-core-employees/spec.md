# 0012 — Módulo `core/employees`

Estado: **aprobado**

Basado en `CONTEXTO-SPRINT-1-CLAUDE-CODE.md`, punto 4.

## Objetivo

CRUD del perfil de RRHH de `Employee`, relacionado 1:1 con `User` (ya existente de Sprint 0), + endpoint separado de "Mi Perfil" (RF-110).

## Por qué es distinto a Zones/Departments/JobTitles

`name`, `lastName` y `photoUrl` viven en `User` (no en `Employee` — así quedó diseñado en Sprint 0: `Employee` es el perfil de RRHH, `User` es la identidad de login). `Employee` solo tiene `code`, `phone`, `bio`, `terminationDate`, `statusId`. Esto significa que **crear o editar un "empleado" casi siempre toca ambas tablas** en una sola operación transaccional.

## Alcance

1. `POST /employees` — crea `User` + `UserCredential` + `Employee` juntos, en una transacción:
   - Entrada: `username`, `name`, `lastName`, `code`, `phone?`, `bio?`.
   - Se genera una **contraseña temporal aleatoria** (no hay servicio de correo/invitación todavía) y se devuelve **una sola vez** en la respuesta (`{ employee, temporaryPassword }`) para que el administrador se la comparta al empleado por fuera del sistema.
2. `GET /employees` — paginado (patrón ya establecido), filtros `status`, `search` (nombre/apellido/código), incluye `user` anidado (nombre, apellido, foto, username).
3. `GET /employees/:id`.
4. `PATCH /employees/:id` — edición administrativa completa: `name`, `lastName` (User) + `phone`, `bio`, `code` (Employee).
5. Ciclo de vida vía `Status` (3 estados, confirmado por el usuario — no solo "terminate"):
   - `PATCH /employees/:id/activate` — `Employee.status = ACTIVE`, y **restaura el login**: `User.status = ACTIVE`.
   - `PATCH /employees/:id/deactivate` — `Employee.status = INACTIVE`, y **revoca el login**: `User.status = INACTIVE` (igual que `terminate`, ver nota abajo).
   - `PATCH /employees/:id/terminate` — `Employee.status = TERMINATED`, `terminationDate = now()`, y revoca el login (`User.status = INACTIVE`).
6. `PATCH /employees/me` — **"Mi Perfil" (RF-110)**: el propio empleado autenticado edita `photoUrl` (User) + `bio`/`phone` (Employee) sobre sí mismo, derivado del JWT (no recibe `:id` por parámetro — no puede editar el perfil de otro).

## Decisiones confirmadas por el usuario

1. **Contraseña temporal expuesta una vez en la respuesta de `POST /employees`** — aprobado (sin objeción).
2. **3 endpoints de ciclo de vida** (`activate`/`deactivate`/`terminate`), no solo `terminate` — pedido explícitamente por el usuario.
3. **La baja inhabilita el login** — confirmado. Se generalizó la misma regla a `deactivate` (no solo `terminate`): si el empleado no está `ACTIVE`, tampoco puede loguearse — es la interpretación más consistente, pero si en realidad "inactivo" debía conservar el acceso, avisar para ajustarlo.

## Separación de permisos "Mi Perfil" vs "administrar cualquier empleado"

El documento pide separar estos dos casos. **Sin `core/roles`/`RoleAssignment` (fuera de alcance de este sprint)**, la única separación real que puedo implementar hoy es **estructural**: `/employees/me` deriva el empleado del JWT (nunca recibe un `:id`, así que estructuralmente solo puede tocar el propio perfil), pero `PATCH /employees/:id` (administrar cualquiera) sigue protegido solo por `JwtAuthGuard` — **cualquier usuario autenticado podría llamarlo hoy**, no solo un admin. Esto quedará resuelto cuando se implemente `core/roles` (siguiente sprint, ya anticipado en el documento).

## Fuera de alcance

- `core/roles`/`RoleAssignment` — sprint siguiente, ya anunciado en el documento.
- Reactivar a un empleado dado de baja.
- Invitación por correo / flujo de "primer login, cambia tu contraseña".
- Frontend.

## Decisiones técnicas

1. **`TempPasswordPolicy`** (dominio, `core/employees/domain/`): genera una contraseña aleatoria (`crypto.randomBytes`), pura, sin I/O — se hashea con el `PasswordPolicy` ya existente de `core/users`.
2. **`CurrentUserId`**: nuevo decorador de parámetro compartido (`core/auth/infrastructure/current-user.decorator.ts`) que extrae `userId` del JWT — se refactoriza `AuthController.me()` para usarlo también (hoy tiene su propia interfaz `AuthenticatedRequest` duplicada).
3. Todas las operaciones que tocan `User` + `Employee` juntas usan `prisma.$transaction(...)`.

## Criterios de aceptación

- [x] Los 8 endpoints implementados (`POST`, `GET` lista, `GET :id`, `PATCH :id`, `PATCH me`, `activate`, `deactivate`, `terminate`).
- [x] `pnpm --filter intranet-api build`/`lint` limpios.
- [x] Verificación manual: crear empleado (ver password temporal), login con esa password, `PATCH /employees/me` (solo puede editarse a sí mismo), `deactivate`/`terminate` → confirmar que ese usuario ya no puede loguearse, `activate` → confirmar que vuelve a poder.

## Revisión 1 — username autogenerado

El usuario pidió que `username` ya no se reciba como input en `POST /employees`, sino que se genere automáticamente a partir de `name`/`lastName`. Algoritmo (`core/employees/domain/username.policy.ts`, generador puro, sin I/O):

1. Se toma la primera palabra de `name` y la primera de `lastName` (por si son nombres compuestos), normalizadas (sin acentos, minúsculas, solo `a-z`).
2. Candidato: 1 letra del nombre + apellido completo. Ej. "Juan Pérez" → `jperez`.
3. Si ya existe, se prueba con 2 letras del nombre (`juperez`), luego 3 (`juaperez`), etc., hasta agotar el nombre completo.
4. Si aun así colisiona (nombre completo agotado), se agrega un sufijo numérico (`juanperez2`, `juanperez3`...).

El chequeo de existencia (`usernameExists`) vive en `EmployeesService.generateUsername()` (necesita acceso a datos, no es puro); el generador de candidatos en sí es 100% puro y testeable sin base de datos.

`CreateEmployeeDto` ya no tiene el campo `username`. `pnpm --filter intranet-api build`/`lint` limpios tras el cambio.

## Revisión 2 — fecha de contratación, tipo de contrato y antigüedad

El usuario, probando el módulo, notó un vacío real: no había dónde guardar fecha de contratación, tipo de contrato, ni cómo se calcula la antigüedad. `CONTEXTO-SPRINT-1-CLAUDE-CODE.md` no contemplaba esto en absoluto. Decisiones confirmadas:

1. **Solo estado actual del contrato** (no historial completo) — campos directos en `Employee`, no una entidad `Contract` aparte.
2. **4 tipos de contrato**: Indefinido, Plazo fijo/temporal, Por obra o proyecto, Practicante.
3. **Transferir de Puesto/Departamento NO genera un contrato nuevo** — la antigüedad y el contrato se calculan desde `hireDate` de `Employee`, independiente de cuántas `Position` haya tenido (que es justo por qué estos campos NO viven en `Position`).

### Cambios en el schema

```prisma
enum ContractType {
  INDEFINITE
  FIXED_TERM
  PROJECT
  INTERN
}
```
`Employee` gana: `hireDate DateTime @default(now())`, `contractType ContractType @default(INDEFINITE)`, `contractEndDate DateTime?`. Los defaults evitan que la migración pida valores manuales para las filas ya existentes (empleados de prueba creados durante Sprint 1).

### Regla de negocio

Un contrato `INDEFINITE` **no puede tener** `contractEndDate` — validado en `EmployeesService` (`assertValidContract`), tanto en `create` como en `update` (en `update`, si solo se cambia una de las dos cosas, se compara contra el valor efectivo combinando lo nuevo con lo que ya tenía el empleado).

### Frontend

- Formulario de crear/editar: fecha de contratación (default hoy), tipo de contrato (select), fecha fin de contrato (deshabilitado si es Indefinido — un input `disabled` no se envía en el `FormData`, así que la regla de "indefinido sin fecha fin" se cumple solo con eso, sin JS extra).
- Tabla: nueva columna "Contrato" con el tipo + antigüedad calculada (`formatTenure()`, pura, en `app/lib/format.ts`) desde `hireDate` — nunca desde `Position.startDate`.

### Pendiente (a cargo del usuario)

Este cambio de schema requiere migración:
```bash
pnpm --filter intranet-api exec prisma migrate dev --name add_employee_contract_fields
pnpm --filter intranet-api exec prisma generate
```

`pnpm --filter intranet-api build`/`lint` y `pnpm --filter intranet build`/`lint` limpios tras el cambio. Migración corrida y confirmada por el usuario.

## Revisión 3 — date picker propio para `hireDate`/`contractEndDate`

El usuario probó los campos de fecha en Chrome/Edge y notó que el calendario nativo (`<input type="date">`) se mostraba en inglés y en formato `mm/dd/yyyy`, pese a que el `<html lang="es-MX">` del layout raíz ya estaba correcto. **Causa**: el selector nativo de fecha en navegadores Chromium ignora por completo el `lang` del documento — usa el idioma configurado en el navegador/SO del usuario, sin excepción (solo Firefox respeta el `lang` del documento para esto). No hay forma de forzarlo vía HTML/CSS/JS sobre el input nativo.

**Decisión**: reemplazar el input nativo por un componente propio (`DatePicker`, en `app/(shell)/configuracion/_components/date-picker.tsx`), reutilizable en el resto de módulos de `configuracion` a futuro. Implementado con:
- [`react-day-picker`](https://daypicker.dev) v10 (incluye `date-fns` como dependencia propia, no hace falta instalarlo aparte) + su locale `es` (`react-day-picker/locale`) — calendario siempre en español, independiente del navegador.
- `@radix-ui/react-popover` para el trigger/posicionamiento (mismo patrón que `Dialog`/`DropdownMenu` ya usados en la app).
- El valor visible se formatea con `formatDate()` (dd/mm/aaaa fijo, ya usado para el mismo propósito en Plazas — ver bug de hidratación resuelto antes).
- El componente expone el valor al `<form action={formAction}>` vía un `<input type="hidden">` interno (formato `yyyy-mm-dd`, igual que el input nativo que reemplaza) — no requiere cambios en las server actions ni en los schemas de `packages/api-client`.
- Se preserva la regla "contrato indefinido no lleva fecha fin" con el mismo truco: el input oculto respeta `disabled`, que excluye el campo del `FormData` igual que antes.

Alcance de este cambio: solo los campos de fecha del formulario de empleados. Los inputs de fecha nativos en Plazas (`position-create-modal`, `position-transfer-modal`) no se tocaron — quedan con el mismo problema latente en Chrome/Edge si se llegan a probar ahí, pendiente de decisión del usuario si quiere extenderlo.

### Pendiente (a cargo del usuario)

Instalar las dos dependencias nuevas:
```bash
pnpm --filter intranet add react-day-picker @radix-ui/react-popover
```

`pnpm --filter intranet build`/`lint` quedan pendientes de re-verificar hasta que el usuario instale (el código ya está escrito contra la API real de `react-day-picker@10.0.1`, confirmada vía el registro de npm).

## Revisión 4 — contrato "Indefinido" con fecha de fin (hallazgo de code review)

Una revisión de código encontró que `EmployeesService.create()` validaba la regla "un contrato indefinido no lleva fecha de fin" contra `input.contractType` **crudo** (`undefined` cuando no se manda), no contra el valor que realmente se persiste. El schema de Prisma pone `contractType @default(INDEFINITE)` cuando se omite — así que `POST /employees` con `contractEndDate` pero sin `contractType` pasaba la validación y terminaba guardando un empleado "indefinido" con fecha de fin, justo lo que la regla dice que no puede pasar.

`update()` no tenía este bug — ya resolvía `effectiveContractType = data.contractType ?? employee.contractType` antes de validar. El fix en `create()` es el mismo criterio: `const effectiveContractType = input.contractType ?? 'INDEFINITE'` antes de llamar `assertValidContract`.

`pnpm --filter intranet-api build`/`lint` limpios. Sin cambios de schema, no requiere migración.

## Revisión 5 — 3 hallazgos de code review (prioridad baja)

Cierre de la tanda de hallazgos de prioridad baja de la revisión de código de Sprint 2 (ver Revisión 3 de spec 0016 y Revisión 1 de spec 0014 para los de prioridad media ya corregidos):

1. **Race de generación de username sin manejar**: `generateUsername()` chequea disponibilidad (`usernameExists`) y luego `createWithUser()` inserta en dos pasos separados, sin lock — dos altas concurrentes para empleados con el mismo nombre pueden pasar ambas el chequeo y chocar en el `UNIQUE` de `User.username`, lo que antes se propagaba como un 500 sin controlar. Fix: nuevo `createWithUniqueUsername()` en `EmployeesService` envuelve el intento de creación en un `try/catch`; si Prisma devuelve `P2002` sobre `username` específicamente, se regenera el username (ahora sí ve la fila recién insertada por el otro request) y se reintenta, acotado a `MAX_USERNAME_COLLISION_RETRIES = 5` para no loopear indefinidamente ante un error real no relacionado con la colisión.
2. **Ciclo de vida de empleados devolvía 403 en vez de 404 para ids inexistentes**: `activate`/`deactivate`/`terminate` llamaban a `assertEmployeeScope()` antes de comprobar que el `id` existiera — como `assertEmployeeScope` sobre un `id` inexistente no encuentra ninguna posición activa (arreglo vacío) y por lo tanto no cubre ningún alcance, terminaba lanzando `ForbiddenException` (403) antes de llegar a `setLifecycle()`, que sí valida existencia. Esto era inconsistente con `findById`/`update`, que ya comprueban existencia primero. Fix: se agregó `await this.getByIdOrThrow(id)` al inicio de los 3 métodos, mismo orden que sus hermanos.
3. **"Mi Perfil" no podía limpiar un campo**: `updateMyProfileAction` (frontend) convertía cualquier campo vacío del formulario a `undefined` ("no tocar"), así que borrar el teléfono/bio/foto y guardar no hacía nada — pero la acción igual devolvía éxito, dando a entender que se guardó el borrado. Como el formulario de "Mi Perfil" siempre viene precargado con el valor actual (no es un parche parcial), un campo vacío al enviar solo puede significar que el usuario lo borró a propósito. Fix, en toda la cadena:
   - `updateMyProfileSchema` (`packages/api-client`): `photoUrl`/`phone`/`bio` ganan `.nullable()` — `null` explícito ahora significa "borrar", `undefined`/omitido sigue significando "no tocar".
   - `UpdateMyProfileDto` (backend): tipos ampliados a `string | null` — `@IsOptional()` de `class-validator` ya deja pasar `null` sin validar formato, solo valida cuando llega un valor real.
   - `EmployeesRepository.updateProfile()`/`EmployeesService.updateMyProfile()`: tipos ampliados a `string | null` en `phone`/`bio`/`photoUrl` (compartido con `update()` administrativo, que sigue sin mandar `null` — sin cambio de comportamiento ahí).
   - `updateMyProfileAction`: los campos vacíos ahora se mandan como `null` en vez de `undefined`.

Sin cambios de schema de base de datos, no requiere migración. `pnpm --filter intranet-api build`/`lint`, `pnpm --filter @intranet/api-client typecheck` y `pnpm --filter intranet build`/`lint` limpios.

### Criterios de aceptación — Revisión 5

- [x] Dos altas concurrentes con el mismo nombre no producen un 500 sin manejar.
- [x] `activate`/`deactivate`/`terminate` sobre un id inexistente devuelven 404, no 403.
- [x] Borrar un campo en "Mi Perfil" y guardar realmente lo borra.
- [ ] Verificación manual del usuario.
