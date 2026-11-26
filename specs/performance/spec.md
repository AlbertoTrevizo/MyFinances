# Spec: Rendimiento de navegación y sesión

**Estado:** Aprobada el 2026-11-25, incluido el uso de `cache` de React en `src/lib/session.ts`.

## Contexto y objetivo

Cada consulta a Supabase tarda aproximadamente 420 ms desde la máquina de desarrollo. Las navegaciones tardan alrededor de 2.3 s y repiten la lectura de sesión en el proxy, el layout y la página. Se busca eliminar consultas redundantes, dar respuesta visual durante la navegación y acercar las funciones de Vercel a la base de datos existente en AWS us-west-2.

## Compatibilidad con la constitución

El punto 3 de `docs/constitution.md` exige que `src/lib` no dependa de React. La solicitud de envolver `getCurrentUser()` con `cache` de React requiere una excepción puntual en `src/lib/session.ts`, exclusivamente para deduplicar la lectura de sesión durante una petición. La excepción quedó aprobada; las reglas y cálculos de negocio conservan su separación de React.

Las reglas de acceso de Usuarios y Roles, las reglas del mes de Inicio y las reglas de búsqueda, periodo y limpieza de Gastos siguen vigentes. Esta spec añade requisitos de rendimiento y presentación a esas funcionalidades.

## Requisitos

- **REN-1. Proxy optimista.** `src/proxy.ts` conserva exactamente `PUBLIC_PATHS` y el matcher existentes. Las rutas públicas pasan sin comprobar sesión. Para las demás rutas cubiertas por el matcher, si falta el valor de la cookie `session`, redirige a `/login`; si existe, continúa sin consultar Prisma, comprobar el token, su vencimiento ni el usuario. Se eliminan la función de hash y las importaciones de Prisma y criptografía del proxy. Los comentarios describen esta comprobación como una primera capa optimista.
- **REN-2. Validación real y deduplicación.** `getCurrentUser()` conserva el nombre exportado, la llamada sin argumentos, el tipo de retorno y todo su comportamiento, incluido devolver `null` y borrar una sesión vencida con el mismo manejo de errores. Se envuelve con `cache` de React para que el layout y la página compartan una lectura en el contexto de renderizado de una petición, sin compartir resultados entre usuarios o peticiones. `requireUser()` y `requireAdmin()` mantienen las validaciones actuales; `/complete-profile` mantiene su comprobación directa.
- **REN-3. Carga de rutas.** `src/app/loading.tsx` muestra un esqueleto ligero dentro del contenido del layout raíz: barra de título y una tarjeta `rounded-2xl` con varias filas grises, usando los tokens existentes, como `bg-line` y `bg-canvas`. La decoración se oculta a tecnologías de asistencia; un texto visualmente oculto con `role="status"` anuncia `Cargando…` o `Loading…`. El texto sale de una nueva clave compartida en los diccionarios español e inglés y en `src/i18n/types.ts`. El pulso usa `animate-pulse` y se desactiva con `motion-reduce:animate-none`. El esqueleto respeta el espacio del contenido, conserva la barra lateral cuando corresponde y funciona también durante la navegación a páginas públicas de autenticación.
- **REN-4. Filtros de Gastos.** Las llamadas a `router.push()` y `router.replace()` de `ExpenseFilters` se ejecutan dentro de `useTransition`. Durante la transición, su elemento `search` expone `data-pending` y `aria-busy`; `data-pending` se elimina al terminar. Una regla CSS en `src/app/globals.css`, basada en `:has(search[data-pending])` dentro de `main`, atenúa la tabla a una opacidad de 0.55. La opacidad vuelve a su valor normal al terminar. La transición de opacidad dura 150 ms y se desactiva si se solicita movimiento reducido. No se pasan props de estado a la tabla ni se alteran el debounce de 300 ms, las URLs, el historial, la limpieza ni la edición inmediata del campo de búsqueda.
- **REN-5. Mes de Inicio.** `MonthSelect` ejecuta su navegación dentro de `useTransition` y expone `data-pending` y `aria-busy` en el selector o su contenedor. Mientras está pendiente se atenúa únicamente el contenido principal situado debajo de la cabecera que contiene el selector, con la misma opacidad y política de movimiento reducido que en Gastos. La cabecera y el selector siguen disponibles. Se conserva el parámetro `month` y el comportamiento de selección actual; no se propaga el estado pendiente mediante props.
- **REN-6. Región de ejecución.** Se crea `vercel.json` en la raíz con el contenido `{ "regions": ["pdx1"] }`. No se instala `@vercel/config`, no se usa `vercel.ts` y no se cambia la región ni la configuración de Supabase. El efecto se aplica en un despliegue posterior; esta tarea no incluye desplegar.

## Restricciones y límites

- No se accede a la base de datos real ni se lee o modifica `.env` durante este trabajo.
- No se añaden dependencias, cambios de esquema ni migraciones. No se hace commit.
- Se preservan los cambios previos del árbol de trabajo y se limita la implementación a los archivos necesarios para estos requisitos.
- Se consulta la documentación incluida de Next.js sobre Proxy, autenticación optimista, `loading.tsx` y aplicaciones interactivas antes de usar sus APIs.
- El esqueleto de `loading.tsx` no cubre la espera del propio layout raíz; esta tarea no cambia su estructura ni promete eliminar toda la latencia de una carga inicial.
- Las cifras proporcionadas son la referencia inicial, no una garantía de latencia final. Medir contra Supabase real queda fuera del alcance autorizado.

## Verificación de finalización

- Revisar que las rutas públicas y el matcher no cambien, que el proxy no pueda acceder a Prisma y que permanezcan los controles de acceso en páginas y acciones.
- Comprobar sin base de datos real los casos del proxy con y sin cookie y la conservación del comportamiento de sesión, usando dobles de prueba si son necesarios.
- Verificar la navegación de Gastos e Inicio: señales pendientes, recuperación de opacidad, controles disponibles y respeto a movimiento reducido.
- Revisar el esqueleto y las pantallas públicas (`/login`, `/register`, `/confirm-email`, `/forgot-password` y `/reset-password`) sin consultas ni mutaciones reales; indicar cualquier límite de la comprobación visual.
- Confirmar que el aviso de carga se obtiene de los diccionarios en ambos idiomas y que `vercel.json` contiene únicamente la región solicitada.
- Ejecutar `npm run lint`, `npx tsc --noEmit`, `npm test` y `git diff --check`; corregir fallos atribuibles al cambio y reportar cualquier fallo previo.
