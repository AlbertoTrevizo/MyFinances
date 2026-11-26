# Spec: Modernización de la UI

**Estado:** Aprobada el 2026-11-25.
**Alcance:** todo el frontend (`src/app/**/*.tsx`, `src/components`, `src/lib/styles.ts`, `src/app/globals.css`).

## Propósito
Corregir prácticas viejas o malas de la interfaz según la skill `modern-web-guidance` (guías en `.agents/skills/modern-web-guidance/guides/`): accesibilidad, formularios, modales y tablas. Sale de dos revisiones independientes, una de Claude y otra de Codex, comparadas entre sí.

No agrega funcionalidades ni dependencias. Toda etiqueta nueva sale de los diccionarios `es` y `en`.

## Reglas

### Modales y confirmaciones
- **UI-1.** Los modales usan el `<dialog>` nativo abierto con `showModal()`. Al abrirse, el foco entra al modal; la página de atrás no responde ni se desplaza; al cerrarse, el foco vuelve al botón que lo abrió. El título nombra al diálogo para los lectores de pantalla.
- **UI-2.** Todo modal tiene un botón visible "Cerrar". Escape y un clic fuera lo siguen cerrando y descartan lo escrito (GAS-9 no cambia).
- **UI-3.** Eliminar pide confirmación con un modal propio en vez del aviso del navegador. El foco inicial queda en "Cancelar". Mientras se borra, el botón "Eliminar" queda deshabilitado y dice "Eliminando…", así que un segundo clic no borra dos veces.

### Formularios
- **UI-4.** Si guardar falla, el formulario conserva lo que el usuario escribió. Hoy React lo vacía o lo regresa a los valores iniciales. En el formulario de gasto, la cuenta elegida y la visibilidad de MSI siguen coincidiendo.
- **UI-5.** Los errores de una acción se anuncian a los lectores de pantalla. Si un campo es inválido, el foco va al primer campo con error.
- **UI-6.** Cuando un formulario se reemplaza por un mensaje (registro enviado, contraseña cambiada, enlace no válido), el foco pasa al mensaje.
- **UI-7.** Todo campo tiene etiqueta, incluidos el monto por categoría del presupuesto y los campos de edición en la tabla.
- **UI-8.** El correo de inicio de sesión se autocompleta como usuario, y ningún campo de correo marca errores de ortografía. Restablecer contraseña muestra el mismo aviso de longitud que el registro.
- **UI-9.** En celulares, el texto de los campos mide al menos 16 px para que iOS no haga zoom al tocarlos. En pantallas grandes se ve igual que hoy.

### Tablas
- **UI-10.** La columna ordenada anuncia su dirección a los lectores de pantalla. El orden sigue funcionando por URL (GAS-18 no cambia).
- **UI-11.** Los botones de cada fila (editar, eliminar, cambiar rol) indican a qué registro afectan.
- **UI-12.** Las tablas que se desplazan se pueden recorrer con el teclado.
- **UI-13.** **Reemplaza a GAS-17.** Un gasto con notas muestra un botón con icono; al hacer clic, tocarlo o pulsar Enter aparece el texto, y Escape o un clic fuera lo cierran.
- **UI-14.** **Precisa GAS-29.** Una mensualidad muestra a la vista, no solo con el cursor, que se cambia desde la compra original.
- **UI-15.** En la edición dentro de la tabla, Escape cancela siempre, sin guardar. Enter no guarda mientras se está componiendo texto con un teclado de idioma (IME).
- **UI-16.** Los registros originales de MSI se distinguen sin opacidad, para que su texto siga legible.

### Navegación y página
- **UI-17.** Cada página tiene su propio título de pestaña, por ejemplo "Gastos | Mis Finanzas".
- **UI-18.** Un enlace "Saltar al contenido" aparece al navegar con teclado, antes del menú lateral. El menú anuncia la página actual.
- **UI-19.** El selector de idioma anuncia cuál está activo.
- **UI-20.** Escribir en la búsqueda de gastos no llena el historial: "Atrás" regresa a la página anterior, no a cada letra escrita.

### Contraste y foco
- **UI-21.** El foco con teclado se ve en todos los botones, con un contorno de al menos 3:1, también en modo de alto contraste.
- **UI-22.** El texto tenue llega a 4.5:1. El borde de los campos usa el mismo gris suave que los separadores de tarjetas, por decisión de diseño; al enfocarlos se marcan con el color principal.
- **UI-23.** La casilla de MSI usa el color de la marca.

## Fuera de alcance
- **Navegar al cambiar un `<select>`.** La guía recomienda un botón para aplicar, pero GAS-20 e INI-1 piden aplicar al instante. Se queda así.
- **Modo oscuro.** Es una funcionalidad nueva y necesita su propia spec.
- **Mover los cálculos del inicio a `src/lib`.** `src/app/page.tsx` suma totales en la página, contra el principio 3 de la constitución. No cambia la UI, así que va en un encargo aparte.
- **Cambiar el desplegable de mes (`<details>`) a `popover`, y la barra de presupuesto a `<meter>`.** Hoy funcionan; cambiarlos agrega riesgo sin beneficio visible.
