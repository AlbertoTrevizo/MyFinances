# Plan: Modernización de la UI

**Estado:** Aprobada el 2026-11-25. Implementa `specs/ui-modernization/spec.md`.

## Origen
| Hallazgo | Claude | Codex | Decisión |
|---|---|---|---|
| Modal sin `<dialog>` nativo (UI-1, UI-2) | ✓ | ✓ | Se hace |
| Formularios que se vacían al fallar (UI-4) | — | ✓ | Se hace. Confirmado en el código: React 19 reinicia los formularios no controlados al terminar la acción, aunque regrese error. |
| `DeleteButton` no espera la acción (UI-3) | ✓ | ✓ | Se hace |
| `window.confirm()` (UI-3) | ✓ | — | Se hace, reusando el modal |
| Errores no anunciados y foco (UI-5, UI-6) | ✓ | ✓ | Se hace |
| Campos sin etiqueta (UI-7) | ✓ | ✓ | Se hace |
| Autocompletado y aviso de contraseña (UI-8) | ✓ | ✓ (aviso) | Se hace |
| Zoom de iOS en campos (UI-9) | — | ✓ | Se hace con `text-base sm:text-sm` |
| `aria-sort`, `scope`, `caption` y región desplazable (UI-10, UI-12) | ✓ | ✓ | Se hace |
| Botones de fila sin contexto (UI-11) | ✓ | ✓ | Se hace con `aria-describedby`, sin textos nuevos |
| Notas solo con el cursor (UI-13, UI-14) | ✓ | ✓ | Se hace con `popover` nativo |
| Escape que guarda e IME (UI-15) | ✓ | ✓ (IME) | Se hace |
| Títulos, saltar al contenido, `aria-current` (UI-17, UI-18) | ✓ | ✓ | Se hace |
| Contraste y foco (UI-21, UI-22) | ✓ | ✓ | Se hace |
| Claves de React por etiqueta en gráficas | — | ✓ | Se hace: un "Otros" real choca con el grupo "Otros" |
| SVG decorativos, `role="list"`, `<search>`, `router.replace`, idioma, casilla | ✓ | parcial | Se hace (cambios de una línea) |
| Navegar al cambiar un `<select>` | ✓ | — | No: lo contradicen GAS-20 e INI-1 |
| Modo oscuro | — | ✓ | No: es una funcionalidad nueva |
| Cálculos en `page.tsx` | — | ✓ | En un encargo aparte |

## Decisiones técnicas
| Tema | Decisión |
|---|---|
| Modal | `<dialog ref>` siempre montado. `useEffect` llama `showModal()`/`close()` según `open`, con `onClose` y `aria-labelledby` vía `useId()`. Cierre con clic fuera mediante `closedby="any"` y, como respaldo en Safari, comparando el punto del clic contra el rectángulo del diálogo. No se llama `close()` en el cleanup (StrictMode). `overscroll-behavior: contain` en `globals.css`. |
| UI-4 | Al fallar, la acción regresa en su estado los valores enviados (`values`), y el formulario los usa como `defaultValue`. Antes de elegir el patrón, revisar `node_modules/next/dist/docs/` sobre formularios. |
| Confirmación | `DeleteButton` abre el `Modal` con "Cancelar" (`autoFocus`) y "Eliminar". La transición usa `startTransition(async () => { await action(); })`. |
| Notas | `<button popoverTarget>` + `<div popover>`, nativo en React 19. Sin posicionamiento con anchor: popover centrado o con desplazamiento fijo. |
| Títulos | `title.template` en `layout.tsx` y `generateMetadata` en cada página, con las claves de título existentes del diccionario. |
| Escape | Un ref `cancelled` que Escape marca y `onBlur` revisa antes de guardar. |
| Colores | `--ink-faint` ≈ `#6b7280`; `inputField` conserva el borde suave `--line`; foco con `outline-2 outline-offset-2 outline-primary`. |
| Dependencias | Ninguna. |

## Entregas a Codex
Una a la vez, para no tocar los mismos archivos en paralelo. Reviso cada diff y corro lint, tipos y `npm test` antes de pasar a la siguiente.

1. **Base compartida:** `styles.ts`, `globals.css`, `Modal`, `DeleteButton`, `icons`, `layout`, `Sidebar`, `LanguageSwitcher`, títulos por página y diccionarios (UI-1 a UI-3, UI-17 a UI-19, UI-21 a UI-23).
2. **Formularios:** todos los `*Form.tsx`, `FormField`, `CategoryBudgetManager` y las acciones que regresan valores (UI-4 a UI-9).
3. **Tablas:** `SortableHeader` y todas las tablas, `ExpensesTable`, `MonthExpensesTable`, `ExpenseFilters`, `DoughnutChart`, `TopCategories` (UI-10 a UI-16, UI-20).

## Verificación
- Lint, tipos y `npm test` en cada entrega.
- **UI-4:** si se extrae a `src/lib` una función pura que arme los valores de regreso, lleva un `*.check.ts` con su prueba de mutación (romper la función y ver que el check falle).
- **Manual, en el navegador (no lo puede verificar Codex):** foco al abrir y cerrar modales, Escape, clic fuera, confirmación de borrado, notas con teclado y en el celular, y un formulario con error que conserve lo escrito.
- **Specs:** al implementar se actualizan GAS-17 y GAS-29 en `specs/expenses/spec.md`, en el mismo commit.
