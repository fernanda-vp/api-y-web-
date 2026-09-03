# 0017 — Dependencias entre permisos

Estado: **aprobado**

Depende de spec [0015](../0015-core-roles-permissions/spec.md) (motor de permisos) y [0016](../0016-web-roles-admin/spec.md) (pantalla de Roles).

## Motivación

Al probar el rol de "Asignaciones" (`roles:assign`/`roles:revoke`) solo, el usuario descubrió que `/configuracion/asignaciones` seguía rechazándolo — la página necesita leer Empleados/Zonas/Departamentos/Puestos/Roles **solo para poblar los `<select>` del formulario**, y cada lectura exige su propio permiso completo (`employees:read`, `zones:read`, etc.), sin relación explícita con `roles:assign`.

Decisión del usuario: en vez de simplemente otorgar esos 4-5 permisos a mano cada vez, construir un **motor genérico de dependencias entre permisos** (dirigido por datos, no hardcodeado), reutilizable para cualquier caso futuro similar — no solo para Asignaciones.

## Modelo de datos

```prisma
model PermissionDependency {
  permissionId Int
  permission   Permission @relation("PermissionDependents", fields: [permissionId], references: [id])
  dependsOnId  Int
  dependsOn    Permission @relation("PermissionRequiredBy", fields: [dependsOnId], references: [id])
  createdAt    DateTime   @default(now())

  @@id([permissionId, dependsOnId])
}
```
`Permission` gana `dependencies PermissionDependency[] @relation("PermissionDependents")` (permisos de los que depende) y `dependents PermissionDependency[] @relation("PermissionRequiredBy")` (permisos que dependen de este).

Seed: `PERMISSION_DEPENDENCIES` en `permission-catalog.ts` (mismo patrón que `ROLE_PERMISSIONS`) — hoy solo:
```ts
'roles:assign': ['roles:read', 'employees:read', 'zones:read', 'departments:read', 'job-titles:read'],
'roles:revoke': ['roles:read', 'employees:read', 'zones:read', 'departments:read', 'job-titles:read'],
```

## Reglas de negocio

1. **Otorgar** un permiso cuya(s) dependencia(s) no estén ya otorgadas al rol se **rechaza** (`ConflictException`, no se auto-otorga en silencio) — el error incluye qué dependencias faltan, para que el llamador reintente incluyéndolas en la misma petición (vía el endpoint bulk de spec 0015 Revisión 2).
2. **Revocar** un permiso del cual dependen otros permisos **ya otorgados** en ese rol se rechaza igual — a menos que la misma petición también revoque esos dependientes.
3. La validación se hace sobre el **conjunto final resultante** (no permiso por permiso), y aplica igual a `grantPermission`/`revokePermission` (individuales) y a `bulkSetPermissions` — un solo validador compartido.
4. Roles semilla (`isSystem`) no quedan exentos de esta validación — aplica igual para todos.

## Revisión 1 — diálogo de confirmación profesional (shadcn/ui)

Los diálogos de "esto también otorgará/quitará X" se implementaron primero con `window.confirm()` (nativo del navegador). El usuario pidió algo visualmente más cuidado sin construir la vista desde cero. Se evaluó adoptar una librería de componentes completa (Material UI, Chakra, etc.) y se descartó — todas traen su propio sistema de theming, que competiría con la paleta de marca y Tailwind ya construidos desde Sprint 0. Se adoptó **shadcn/ui** en su lugar: no es una librería tradicional, es un CLI que copia componentes (`Button`, `AlertDialog`, etc.) como código fuente editable al repo, construidos sobre Radix UI — la misma base que ya usa el proyecto (`Dialog`, `DropdownMenu`, `Popover`).

**Decisión técnica importante**: desde julio 2026 shadcn/ui cambió su base por defecto de Radix UI a **Base UI** (librería nueva del equipo de MUI) para proyectos nuevos. Se inicializó explícitamente con `--base radix` para no mezclar dos librerías headless distintas en el mismo código — Radix sigue soportado y no está deprecado.

### Problemas encontrados al instalar

1. **La CLI de shadcn corre `npm install` internamente sin importar el gestor de paquetes del proyecto** — en este monorepo pnpm (con referencias `workspace:^`), `npm` no entiende esa sintaxis y el `init` falló a mitad de camino (`EUNSUPPORTEDPROTOCOL`). Solo alcanzó a escribir `components.json` antes de morir. Fix: instalar las dependencias (`clsx`, `tailwind-merge`, `class-variance-authority`, `tw-animate-css`, `radix-ui`) a mano con `pnpm add`, y volver a correr `init -f` / `add` para que la CLI ya no necesite instalar nada.
2. **Ni siquiera con eso quedó completo**: faltó `lib/utils.ts` (el helper `cn()` que importan todos los componentes) y **la CLI nunca agregó sus variables CSS a `globals.css`** — los componentes generados (`button.tsx`, `alert-dialog.tsx`) usan clases como `bg-secondary`, `text-muted-foreground`, `border-input`, `ring-ring`, `bg-popover`, que no existían en el tema de Tailwind del proyecto. Sin esto, los componentes se habrían visto rotos/sin estilo.

### Fix aplicado

- `apps/web/lib/utils.ts` creado a mano (`cn()` = `twMerge(clsx(inputs))`).
- `apps/web/app/globals.css`: se agregaron las variables que sí usan los componentes ya instalados (`primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`, `popover`, `popover-foreground`, `card`, `card-foreground`), en el mismo patrón ya establecido (`:root` + `@theme inline`) y **mapeadas a la paleta de marca real**, no a los valores genéricos que shadcn hubiera puesto por defecto.
- **Ojo con `accent`/`accent-foreground`**: se dejaron **sin definir a propósito**. En la convención de shadcn, `accent` es una superficie neutra resaltada al hover (ej. item de menú activo) — pero este proyecto ya usa `--color-accent` como el **verde de marca** (botones de acción tipo "Agregar"). Si un componente de shadcn agregado más adelante necesita `bg-accent`/`hover:bg-accent` (ej. `dropdown-menu`, `select`, `command`), va a heredar el verde de marca por el choque de nombres — hay que resolver esto (renombrar o mapear con cuidado) **antes** de agregar esos componentes, no después.
- `components/confirm-dialog.tsx` — wrapper reutilizable sobre `AlertDialog`+`Button` de shadcn, con API controlada (`open`, `title`, `description`, `onConfirm`, `onOpenChange`) para no atar el estado de "hay un cambio pendiente de confirmar" a un `window.confirm()` bloqueante — `RolesAdmin` ahora guarda el cambio pendiente en estado (`pendingChange`) y lo aplica solo si se confirma en el diálogo.

## Frontend

- `GET /permissions` ahora expone `dependsOn: number[]` (ids) por permiso.
- Al togglear un checkbox individual en `/configuracion/roles`:
  - **Otorgar**: si faltan dependencias, se muestra una confirmación listando cuáles (por su etiqueta legible) — al aceptar, se llama `bulkSetRolePermissions` con el permiso + las dependencias faltantes juntas.
  - **Revocar**: si otros permisos ya otorgados dependen de este, se muestra una confirmación listando cuáles quedarían "rotos" — al aceptar, se revocan todos juntos.
  - El checkbox maestro por grupo (spec 0016 Revisión 2) sigue la misma lógica al expandirse a varios permisos.
- Si el backend igual rechaza (carrera entre dos pestañas, datos desactualizados), se muestra el mensaje de error como toast — no debería pasar en el flujo normal, es defensa en profundidad.

## Fuera de alcance

- Pantalla para crear/editar dependencias entre permisos desde la UI — el mapeo inicial es fijo por seed, igual que los roles/permisos base. Si se necesita editar en caliente, es una tarea futura.
- Dependencias transitivas multi-nivel (A depende de B, B depende de C) — el caso actual es de un solo nivel. El validador no lo prohíbe, pero tampoco se probó con cadenas más largas.

## Criterios de aceptación

- [x] `PermissionDependency` en el schema (migración pendiente de correr por el usuario — tabla nueva, sin conflicto con datos existentes).
- [x] Seed de las dependencias de `roles:assign`/`roles:revoke`; `Administrador de Permisos` recibe también las 4 lecturas de las que depende.
- [x] `grantPermission`/`revokePermission`/`bulkSetPermissions` validan el conjunto resultante y rechazan con detalle claro si queda inconsistente.
- [x] `GET /permissions` expone `dependsOn`.
- [x] UI de Roles pregunta antes de otorgar/revocar cuando hay dependencias involucradas (checkbox individual y checkbox maestro de grupo).
- [x] `pnpm --filter intranet-api build`/`lint`, `pnpm --filter intranet build`/`lint` y typecheck de `@intranet/api-client` limpios.
- [ ] Verificación manual del usuario (pendiente, requiere correr la migración primero).
