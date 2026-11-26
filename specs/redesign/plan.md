# Plan: Rediseño y marca

**Estado:** Aprobada el 2026-11-25. Implementa `specs/redesign/spec.md`.

## Archivos de marca
| Archivo | Destino | Por qué |
|---|---|---|
| `public/MyFinancesLogo.png` (1254 px, 1.2 MB) | `docs/design/logo.png` | Es el original. Fuera de `public` no se publica. |
| Logo para la UI | `src/assets/logo.png`, de 512 px | Se importa con `next/image`, que lo optimiza y le pone tamaño. |
| Favicon | `src/app/favicon.ico` (16, 32 y 48 px), reemplaza el de Next | Convención de archivos de Next, ver `app-icons.md`. |
| Icono moderno | `src/app/icon.png`, de 512 px | Next genera el `<link rel="icon">`. |
| Icono de iPhone | `src/app/apple-icon.png`, de 180 px, con el fondo azul marino | Convención de Next. iOS no acepta transparencia. |
| `public/References/` | `docs/design/references/` | Todo lo que está en `public` se publica en producción. Las referencias no deben estar ahí. |
| `public/{file,globe,next,vercel,window}.svg` | Se borran | Son restos de la plantilla de Next y nada los usa. |

`src/proxy.ts` ya deja pasar `/favicon.ico`, `/icon.png` y `/apple-icon.png` sin sesión, así que el icono se ve en `/login`.

Los iconos se generan con `sips` y un script de Python sin dependencias. El `.ico` guarda PNGs dentro, algo que el formato permite. El script se queda en el scratchpad y no se sube.

## Decisiones técnicas
| Tema | Decisión |
|---|---|
| Colores | En `globals.css`: `--primary` `#0F766E` (5.5:1 sobre blanco), `--primary-strong` `#115E59` y `--primary-soft` `#E6F6F3`. Se agregan `--brand-navy` `#012635`, `--brand-teal` `#02AD98` y `--brand-mint` `#01F2C5`, y el foco usa `--primary`. Las paletas de las gráficas de `page.tsx` empiezan con los colores de marca en vez del azul `#3457FF`. |
| Letra | `next/font/google` con `Plus_Jakarta_Sans` en `layout.tsx`, en lugar de Geist. Se quita `font-mono` de los montos y se usa `tabular-nums`. No es una dependencia nueva. |
| Estilos | Las tarjetas pasan a `rounded-2xl` y los botones principales a píldora `rounded-full`. Se agregan `badge` (etiqueta suave) y `inputFilled` (campo gris relleno, para el acceso) en `styles.ts`. Los campos de la app conservan el borde suave de UI-22. |
| Menú | `Sidebar.tsx` usa `next/image` con `src/assets/logo.png` y `alt=""`, porque el nombre va al lado. La opción activa lleva `bg-primary text-white shadow-sm`. Se agrega un icono de cerrar sesión en `icons.tsx`. |
| Tablas | Cambian `SortableHeader` (icono ⇅ en reposo, flecha según la dirección), `ExpensesTable`, `MonthExpensesTable`, `AccountsTable`, `UsersTable` y las tablas de categorías y presupuesto. Solo cambian las clases. |
| Tarjeta de lo gastado | Una función pura `spentSummary({ spentCents, budgetCents, previousCents })` en `src/lib/budget.ts`, que reusa `budgetProgress`. Regresa `{ percent, width, over, remaining, hasBudget, change: { percent, direction } \| null }`. Se agrega `previousMonthKey(key)` en `src/lib/date.ts`. El componente es `src/components/SpentCard.tsx`. En `page.tsx`, el total del mes anterior sale de una sola consulta `aggregate` con `excludeFromTotals: false`. |
| Acceso | Un componente cliente `src/components/auth/AuthSwitcher.tsx` que usan las páginas `/login` y `/register`, con los dos formularios ya armados por el servidor. Detalle abajo. |
| Google | `GoogleSignIn` pasa a ser un `<a>` redondo con el SVG de la "G" de cuatro colores y `aria-label` con el texto existente `auth.googleButton`. El divisor usa un texto nuevo, "o usa tu correo". |
| Dependencias | Ninguna. |

### AuthSwitcher
- **Estructura.** Una tarjeta con `grid md:grid-cols-2`:
  - El formulario de inicio de sesión va en la columna 1 y el de registro en la columna 2, ambos en la fila 1.
  - Así la altura se ajusta al formulario más alto, sin alturas fijas.
- **Panel.** Encima va un panel `absolute` de 50 % de ancho, con el degradado azul marino y verde azulado y un brillo menta.
  - Con `translate` cubre el formulario inactivo: está a la derecha en la vista de inicio de sesión y a la izquierda en la de registro, como en las referencias.
  - Dentro tiene dos bloques de texto que se desvanecen entre sí.
  - Transición `translate` y `opacity` de 650 ms `ease-in-out`. Con `@media (prefers-reduced-motion: reduce)` no hay transición.
- **Vista.** La vista sale de `usePathname()`.
  - El botón del panel llama `window.history.pushState(null, "", "/register")`, o con `"/login"`. Next lo sincroniza con `usePathname`, ver `linking-and-navigating.md`. "Atrás" funciona solo.
  - Un `useEffect` cambia `document.title` con el título de la vista, usando la misma plantilla `"%s | <appName>"`.
- **Accesibilidad.** El formulario inactivo lleva `inert`.
  - Al cambiar de vista, no al cargar, el foco va al `<h1 tabIndex={-1}>` del formulario nuevo.
  - Hay un solo `<h1>` visible. El del formulario inactivo queda inerte.
- **Celular** (`< md`). Se ve solo el formulario activo, con el logo arriba y un enlace para cambiar abajo. El panel queda con `hidden md:block`.
- **Lo que se conserva.** `LoginForm`, `RegisterForm` y sus acciones siguen igual, incluidos los avisos de `/login`, `ResendForm` y el mensaje tras registrarse. Solo cambian las clases de los campos y del botón, que vienen de `FormField` y `styles.ts`. `FormField` recibe una variante `filled` en vez de duplicarse.
- **Otras pantallas.** `AuthCard` se rediseña para las demás pantallas de acceso (RED-21), con el logo arriba.

## Entregas a Codex
Una a la vez. Reviso cada diff y corro lint, tipos y `npm test` antes de pasar a la siguiente.

1. **Marca y base:**
   - Mover y generar los archivos de marca de la tabla de arriba.
   - `globals.css`, `styles.ts`, la letra y `layout.tsx`.
   - `appName` en los diccionarios (RED-1).
   - El menú lateral (RED-6) y los colores de las gráficas.
2. **Tablas:** RED-7 y RED-8.
3. **Inicio:** `spentSummary`, `previousMonthKey`, sus checks y `SpentCard` (RED-9 a RED-14).
4. **Acceso:** `AuthSwitcher`, `GoogleSignIn`, `AuthCard` y `FormField` con la variante rellena (RED-15 a RED-21).

## Verificación
- Lint, tipos y `npm test` en cada entrega.
- **Checks nuevos con prueba de mutación:**
  - `spentSummary`: igual al presupuesto no es excedido, sin presupuesto, mes anterior en 0, sube, baja y sin cambio.
  - `previousMonthKey`: enero regresa a diciembre del año anterior.
- **En el navegador, lo hago yo con Playwright y capturas:**
  - El favicon en `/login` y en `/`.
  - El menú y las tablas en escritorio y en el celular.
  - La tarjeta de lo gastado en verde, en rojo y sin presupuesto.
  - El cambio de vista animado, con "Atrás" y el foco.
  - El movimiento reducido.
  - El celular a 375 px.
  - El error de inicio de sesión que conserva el correo.
  - Sin escribir en la base: las acciones se interceptan.
- **Specs:** RED-1 cambia el nombre de la app que aparece en otras specs. Se busca y se corrige en el mismo commit.
