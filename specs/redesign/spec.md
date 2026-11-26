# Spec: Rediseño y marca

**Estado:** Aprobada el 2026-11-25.
**Alcance:** todo el frontend. Las referencias visuales están en `docs/design/references/`.

## Propósito
Darle a la app una identidad propia a partir del logo nuevo, para que no se vea genérica. Cambian el nombre, el logo, el favicon, los colores, la tipografía, el menú lateral, las tablas, el resumen de lo gastado y las pantallas de acceso.

No cambia ninguna regla de datos. Siguen vigentes las reglas de accesibilidad de `specs/ui-modernization/spec.md` (UI-1 a UI-23). Toda etiqueta nueva sale de los diccionarios `es` y `en`.

## Reglas

### Marca
- **RED-1.** La app se llama "Mis Finanzas" en español y "My Finances" en inglés. El nombre aparece en el menú, en los títulos de pestaña y en los correos.
- **RED-2.** El logo nuevo reemplaza al cuadro con la inicial del menú. También encabeza las pantallas de acceso.
- **RED-3.** El logo es el icono de la pestaña en todas las páginas, incluidas las de acceso. También es el icono al guardar la app en la pantalla de inicio del iPhone.
- **RED-4.** Los colores salen del logo: azul marino (`#012635`), verde azulado (`#02AD98`) y menta (`#01F2C5`). Los botones y los enlaces usan una variante más oscura del verde azulado, para que el texto llegue a 4.5:1 (UI-22). La menta solo decora.
- **RED-5.** La letra cambia de Geist a Plus Jakarta Sans. Los montos usan la misma letra con números de ancho fijo, en vez de la monoespaciada.

### Menú lateral
- **RED-6.** El menú sigue el estilo de `reference.jpg`:
  - Fondo blanco, con el logo y el nombre arriba.
  - Opciones más amplias, con icono.
  - La opción activa va rellena del color principal, con texto blanco.
  - El correo del usuario y "Cerrar sesión", con icono, van abajo.
  - En el celular sigue siendo la barra horizontal de hoy, con el estilo nuevo.

### Tablas
- **RED-7.** Las tablas siguen el estilo de `reference.jpg`:
  - Cada tabla va en una tarjeta blanca con esquinas redondeadas.
  - El encabezado usa texto pequeño gris. Solo la columna por la que se ordena muestra una flecha: hacia arriba si es ascendente y hacia abajo si es descendente. Las demás columnas no llevan icono.
  - Las filas son más altas, con separadores y un fondo suave al pasar el cursor.
  - La primera columna va en negritas y las secundarias en gris.
  - El tipo de gasto y la marca de MSI se muestran como etiquetas redondeadas de color suave.
- **RED-8.** Los botones de cada fila (editar, eliminar, cambiar rol) no cambian. No se agregan menús "…" ni paginación.

### Inicio: tarjeta de lo gastado
- **RED-9.** La tarjeta "Gastado en <mes>" sigue el estilo de los indicadores de `reference2.jpg`. Muestra, en orden:
  - Icono y etiqueta.
  - El monto gastado.
  - La comparación con el mes anterior.
  - "Presupuesto: $X".
  - Una barra con su porcentaje.
- **RED-10.** Lo gastado es el total del mes que ya se muestra hoy (GAS-15, PRE-9). El presupuesto es la suma de los presupuestos por tipo: Necesidades, Deseos y Ahorro. Los presupuestos por categoría no se suman aquí (PRE-8).
- **RED-11.** La barra y el porcentaje van en verde si lo gastado es menor o igual al presupuesto, y en rojo si lo pasa (PRE-13). La barra llega como máximo al 100 %, pero el porcentaje puede pasar de 100.
- **RED-12.** El color nunca es la única señal: debajo de la barra dice cuánto queda o por cuánto se excedió, con los textos del panel de presupuesto.
- **RED-13.** Si no hay presupuesto por tipo mayor que 0, no hay barra. En su lugar dice "Sin presupuesto", con el enlace a `/budget`.
- **RED-14.** La comparación con el mes anterior muestra el cambio en porcentaje, redondeado, con flecha: "↑ 12 % vs octubre 2026".
  - Gastar más se muestra en rojo y gastar menos en verde.
  - Si no cambió, o el cambio redondeado es 0 %, la comparación va sin color ni flecha y usa el texto sin cambio.
  - Si el mes anterior no tuvo gastos, la comparación no aparece.
  - El mes anterior es el mes de calendario previo al mes elegido (INI-1).

### Acceso: inicio de sesión y registro
- **RED-15.** `/login` y `/register` muestran una tarjeta con dos mitades: el formulario y un panel de marca. Sigue a `Login.jpg` y `SignUp.jpg`, pero con el panel liso de `LoginNotImage.jpg`.
  - El panel usa un degradado de los colores del logo, sin foto.
  - Tiene un título, una frase y un botón con borde para cambiar al otro formulario.
- **RED-16.** Al cambiar entre las dos vistas, el panel se desliza al otro lado y los formularios se desvanecen, en unos 0.65 s.
  - Si el sistema pide reducir el movimiento, el cambio es inmediato.
  - La URL pasa a `/register` o `/login` sin recargar, y "Atrás" regresa a la vista anterior.
  - El título de la pestaña cambia con la vista.
- **RED-17.** Solo el formulario visible se alcanza con el teclado y con el lector de pantalla. Al cambiar de vista, el foco pasa al título del formulario nuevo.
- **RED-18.** En el celular (menos de 768 px) no hay panel ni deslizamiento. Se ve el formulario solo, con el logo arriba y un enlace abajo para cambiar al otro.
- **RED-19.** "Continuar con Google" es un botón redondo con la "G" de Google en sus colores oficiales, como en `LoginNotImage.jpg`. Va arriba de los campos, seguido de "o usa tu correo". Su nombre para lectores de pantalla es "Continuar con Google". Sigue siendo un enlace simple, por la política de seguridad (CSP).
- **RED-20.** Todo lo que hoy funciona en el acceso se conserva:
  - Los avisos y errores de `/login`.
  - Reenviar la confirmación.
  - "¿Olvidaste tu contraseña?".
  - El mensaje tras registrarse.
  - Los valores que se conservan al fallar, de UI-4 a UI-8.
  - Los campos pasan al estilo gris relleno de la referencia, y el botón principal es una píldora.
- **RED-21.** Confirmar correo, olvidé mi contraseña, restablecer contraseña y completar perfil usan el mismo estilo de tarjeta, logo y campos, sin el panel ni la animación.

### Selector de mes en gastos
- **RED-22.** El selector de mes de gastos (GAS-20) y sus listas de mes y año usan la misma flecha: un chevrón gris tenue, a la derecha, con espacio hasta la orilla.
  - La flecha del selector gira al abrirlo.
  - Las opciones de mes y año se abren en una lista con el estilo de la app, no en la del sistema operativo. El teclado y los lectores de pantalla siguen funcionando como en un `<select>` normal.
  - En navegadores que no permiten personalizar la lista, como Firefox, se ve la lista del sistema.

## Fuera de alcance
- Modo oscuro.
- La barra superior de las referencias: búsqueda, notificaciones y avatar.
- Más indicadores en el inicio. Solo cambia la tarjeta de lo gastado.
- Paginación y menús "…" en las tablas.
- Botones de Facebook, Twitter o LinkedIn.
- App instalable (PWA) con manifiesto.
