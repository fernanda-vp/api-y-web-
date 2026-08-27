# 0004 — Sistema de diseño web (paleta de marca Kenmeina)

Estado: **aprobado**

## Objetivo

Definir los tokens de color de `apps/web` a partir de la paleta de marca que el usuario proporcionó (extraída del logo de Kenmeina), como base para las pantallas del resto de Sprint 0 (login, shell de navegación, listado de Empresas). Es la primera tarea de frontend; las siguientes (api-client, login, shell, listado) se apoyan en esta.

## Insumos

- Paleta de referencia (`paleta-intranet-kenmeina.html`, adjuntada por el usuario): azul de marca `#3072B0`, verde de marca `#A0BC0C`, gris de marca `#787775`, cada uno con escalas 900/700/DEFAULT/400/200/50(-100), más semánticos success/warning/error/info.
- Logo Kenmeina (imagen adjunta): confirma los mismos tonos de azul/verde, tipografía redondeada tipo geométrica sans para el nombre.

## Alcance

1. Migrar la paleta a `apps/web/app/globals.css` usando `@theme` (Tailwind v4, CSS-first — ya es como está configurado el proyecto, no se toca `tailwind.config`).
2. Nombrar los tokens **semánticamente** (`primary`, `accent`, `neutral`, `success`, `warning`, `error`, `info`) en vez de `k-blue`/`k-green`/`k-gray` — así las clases utilitarias de Tailwind quedan `bg-primary`, `text-accent-700`, etc., desacopladas del nombre de marca (si el día de mañana cambia la paleta de un cliente vertical, no hay que renombrar clases en todo el código).
3. Actualizar metadata de `apps/web/app/layout.tsx` (título/descripción reales, no el placeholder de `create-next-app`).
4. Modo claro únicamente en esta tarea — el scaffold de `prefers-color-scheme: dark` que trae `create-next-app` por defecto se retira (la paleta entregada no define variantes oscuras; agregar dark mode no fue pedido y se dejaría a medias sin tokens dark reales para cada color).

## Fuera de alcance

- Modo oscuro completo (posible tarea futura si se pide).
- Tipografía custom (se mantiene Geist, la fuente por defecto del scaffold — no hay pedido de tipografía de marca).
- Componentes reutilizables (Button, Alert, etc.) — esta tarea solo define los tokens de color; los componentes se construyen en las tareas de login/shell.
- Logo como asset real en el proyecto (SVG/PNG) — no se adjuntó el archivo de imagen en sí, solo la vista previa; se agrega cuando el usuario proporcione el archivo.

## Mapeo de tokens

| Semántico | Escala | Hex |
|---|---|---|
| `primary` | 900/700/DEFAULT/400/200/50 | `#173654` `#204F82` `#3072B0` `#5C93C6` `#A9C6E1` `#EAF2F9` |
| `accent` | 900/700/DEFAULT/400/200/50 | `#5C6E07` `#7C930A` `#A0BC0C` `#BBD24F` `#D9E8A0` `#F3F8E4` |
| `neutral` | 900/700/DEFAULT/400/200/100 | `#3A3A38` `#5B5A57` `#787775` `#A2A19E` `#D6D5D2` `#EDEDEB` |
| `success` / `warning` / `error` | única | `#3E8E3E` / `#D69A1E` / `#C24A3E` |
| `info` | única | `= primary` (`#3072B0`) |

## Decisiones técnicas

1. **Tailwind v4 CSS-first**: los tokens se declaran como variables CSS (`--color-primary-900`, etc.) dentro de `@theme`, lo que genera automáticamente las utilidades (`bg-primary-900`, `border-accent`, ...) sin tocar ningún archivo de configuración JS.
2. **Sin dark mode** por ahora (ver "Fuera de alcance").
3. **Título de la app**: `"Intranet Kenmeina"` (metadata de `layout.tsx`) — ajustable si el usuario prefiere otro texto.

## Criterios de aceptación

- [x] `apps/web/app/globals.css` con los tokens semánticos de la tabla de arriba.
- [x] `apps/web/app/layout.tsx` con metadata actualizada.
- [x] `pnpm --filter intranet build` y `pnpm --filter intranet lint` limpios (verificado por mí).
- [x] Vista previa visual confirmada por el usuario — tonos correctos. La página de `apps/web/app/page.tsx` sigue siendo temporal, se reemplaza por el contenido real en la tarea del shell/listado.
