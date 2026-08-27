# 0007 — Shell de navegación + listado de Empresas

Estado: **aprobado**

Basado en `11-especificacion-shell-navegacion.md` (wireframe validado, adjuntado por el usuario) + 4 decisiones confirmadas por el usuario:
1. **Alcance**: se construye solo lo que existe hoy (Empresas), con el código estructurado de forma extensible (lista de items de navegación como datos, no hardcodeado) para agregar módulos futuros sin rehacer el shell.
2. **Color activo**: `primary` (azul) para ítems de navegación activos — consistente con la guía de la tarea 0004 ("Azul — Navegación").
3. **Íconos**: `lucide-react`.
4. **Panel derecho**: se construye el slot pero se deja sin usar/oculto en esta tarea (no hay Notificaciones/Eventos reales todavía).

## Objetivo

Envolver las pantallas autenticadas con el shell validado (header + sidebar de Configuración) y construir el listado de Empresas como el patrón de referencia "catálogo tipo tabla" que se reutilizará para los catálogos futuros (Departamentos, Zonas, etc.).

## Decisión de ruteo

- `/configuracion/empresas` pasa a ser el destino real de la sección Configuración → Empresas.
- El login (`/login` → tarea 0006) y la raíz `/` redirigen a `/configuracion/empresas` (ya no hay pantalla placeholder "Hola, Admin").
- Header: como no existe ningún módulo de contenido (Noticias, Micrositios, etc.), el único tab de navegación visible es **"Configuración"** (activo), construido como un array de items — agregar "Noticias" más adelante es agregar un elemento a esa lista, no rehacer el header.
- Sidebar de Configuración: solo el ítem **"Empresas"**, mismo patrón de lista extensible.

## Alcance

### Shell
1. `app/(shell)/layout.tsx` — Header: logo (placeholder de marca, cuadro 22px con `bg-primary`), nombre del producto, tab "Configuración" (activo, `text-primary`/`bg-primary-50`), buscador visual (sin backend de búsqueda global — no funcional en esta tarea), ícono de campana (visual, sin datos reales), avatar circular con iniciales del usuario + dropdown con "Cerrar sesión".
2. `app/(shell)/configuracion/layout.tsx` — Sidebar de Configuración (160px, ítem "Empresas") + slot de panel derecho (presente en el layout, sin contenido/oculto en esta tarea) + área de contenido principal.

### Listado de Empresas
3. `app/(shell)/configuracion/empresas/page.tsx` (Server Component): obtiene la lista completa vía `getApiClient().companies.list()`.
4. Tabla (Client Component para la interacción de búsqueda/paginación/menú):
   - Columna 1: avatar cuadrado 28px con iniciales de la empresa (color de fondo determinado por hash del nombre, rotando entre tokens `primary-200`/`accent-200`/`neutral-200`) + nombre.
   - Columna 2: RFC.
   - Columna 3: estatus como "pill" (`bg-success`/`text-success` si `status.isActive`, `bg-neutral-100`/`text-neutral-700` si no).
   - Columna 4: menú contextual (ícono `MoreHorizontal`) con "Editar" y "Habilitar"/"Deshabilitar" (según estatus actual).
   - Buscador **funcional pero client-side** (filtra por substring de `name` sobre la lista ya cargada — no hay endpoint de búsqueda en el backend, y con pocas empresas por instalación no hace falta).
   - Paginación **client-side** (10 filas por página) + checkbox "Mostrar todos" (desactiva el slicing). Sin cambios al backend (que no pagina).
5. Botón "Agregar" (arriba a la derecha del header de sección) → abre un formulario simple (modal) para crear empresa (`name`, `rfc`), usando `companies.create()`. Errores de validación (ej. RFC inválido → 400 del backend) se muestran en el formulario.
6. Acción "Editar" del menú contextual → mismo formulario modal, pre-llenado, usando `companies.update()`.
7. Acción "Habilitar"/"Deshabilitar" → llama `companies.enable()`/`companies.disable()` directo desde el menú, sin modal de confirmación (Sprint 0, sin necesidad de confirmar algo reversible).

## Fuera de alcance

- Búsqueda global del header (input visual, no funcional).
- Notificaciones / próximos eventos reales (el slot del panel derecho queda construido pero vacío/oculto).
- Cualquier otro módulo de header/sidebar (Noticias, Micrositios, Departamentos, Roles, etc.) — se agregan cuando existan.
- Paginación real en el backend (se pagina en el cliente sobre la lista completa).
- Confirmación de diálogo antes de deshabilitar una empresa.
- Responsive/mobile del shell (se ajusta si hace falta cuando exista `apps/mobile`, que tiene su propia navegación nativa).

## Decisiones técnicas

1. **`lucide-react`** como librería de íconos (nueva dependencia de `apps/web`).
2. **Ruta con route group** `app/(shell)/...` para que `/login` y `/design-system` quedan fuera del layout del shell (no tienen header/sidebar).
3. **Colores**: `primary` para navegación activa (header tab, sidebar ítem activo), `accent` (verde) se reserva para el botón "Agregar" (acción/CTA), tal como ya se documentó en la tarea 0004.
4. **`proxy.ts`** (tarea 0006) se actualiza: la ruta pública sigue siendo `/login` y `/design-system`; todo bajo `/configuracion` sigue protegido igual que antes. Se agrega el redirect de `/` → `/configuracion/empresas` para usuarios ya autenticados.

## Criterios de aceptación

- [x] Shell (header + sidebar de Configuración) implementado según wireframe, con navegación como datos (no hardcodeada).
- [x] Listado de Empresas con avatar+nombre, RFC, pill de estatus, menú contextual, búsqueda y paginación client-side.
- [x] Crear, editar, habilitar y deshabilitar empresas implementado (Server Actions + `revalidatePath`).
- [x] `pnpm --filter intranet build` y `pnpm --filter intranet lint` limpios (build confirma las rutas `/configuracion` y `/configuracion/empresas` dinámicas, y `proxy.ts` registrado).
- [ ] Verificación manual del usuario: login → aterriza en `/configuracion/empresas`; crear una empresa nueva; editarla; deshabilitarla y volver a habilitarla; buscar por nombre; cerrar sesión desde el avatar.

## Revisión 1 — menú de 3 puntos oculto (Radix UI)

El usuario reportó que el menú contextual (3 puntos) de cada fila no se visualizaba al abrirlo. Causa: el contenedor de la tabla usa `overflow-hidden` para lograr las esquinas redondeadas, y eso recorta cualquier elemento `position: absolute` que se salga de sus límites — el dropdown hecho a mano quedaba recortado por el propio contenedor.

En vez de parchar el `overflow-hidden`, se adoptó **Radix UI** (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-dialog`) como base para todo menú/modal de aquí en adelante — resuelve el posicionamiento vía portal (el contenido se monta fuera del árbol recortado), maneja foco/teclado/escape correctamente, y evita que este tipo de bug se repita en cada catálogo futuro. Se refactorizaron:
- `CompanyRowMenu` → `DropdownMenu.Root/Trigger/Portal/Content/Item` de Radix.
- `UserMenu` (avatar del header) → mismo patrón, por consistencia.
- `CompanyFormModal` → `Dialog.Root/Portal/Overlay/Content` de Radix (antes era un `<div>` fijo hecho a mano).

`pnpm --filter intranet build`/`lint` limpios tras instalar las dos librerías nuevas.

## Revisión 2 — pulido visual

Ajustes de estética pedidos por el usuario tras probar la tarea:
- **`sonner`** (nueva dependencia): toast de confirmación/error en crear, editar, habilitar y deshabilitar empresa — antes esas acciones eran silenciosas.
- Animaciones de entrada/salida (keyframes propios en `globals.css`, sin plugin nuevo) en dropdowns y modal.
- Header de la tabla de Empresas: pasó de gris plano a `bg-primary-50`/`text-primary-900` con borde inferior, mayúsculas y más padding — tenía "poca presencia".
- Sidebar de Configuración: íconos (`lucide-react`) en cada item, color activo cambiado de gris a `primary` (azul), y **contracción** (solo íconos) con preferencia persistida en `localStorage`.
- Botón "Agregar": de `bg-accent` (verde claro) + texto oscuro, a `bg-accent-700` (verde más profundo) + texto blanco — el verde claro con texto blanco no pasaba contraste mínimo legible (~2.2:1); `accent-700` da ~3.5:1, aceptable para texto de botón en negrita.

`pnpm --filter intranet build`/`lint` limpios (se ajustó un warning de `react-hooks/set-state-in-effect` en la lectura de `localStorage` del sidebar, justificado con comentario ya que no hay forma de leer `localStorage` durante el render en servidor).
