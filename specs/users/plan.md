# Plan: Usuarios

**Estado:** Aprobado el 2026-11-04. Implementa `specs/users/spec.md`.

## Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Correo | Brevo, llamado con `fetch` a su API | Sin paquete npm nuevo y sin dominio propio por ahora. Su plan gratis (300 al día) sobra para esta app. Si sus correos caen en spam, se cambia a un servicio con dominio verificado tocando solo `email.ts`. |
| Google | Código de autorización con `route.ts`, recuperando las dos rutas borradas en `8ae5daa` | Ya existían y funcionan con `fetch`, sin paquete nuevo. |
| Dependencias npm | Ninguna | El principio 1 queda cumplido sin agregar runtime. |
| Enlaces en los correos | Se arman con una variable `APP_URL`, nunca con el encabezado `Host` | Un `Host` falso podría mandar enlaces de recuperación a un sitio ajeno. |
| Enlaces de un solo uso | 32 bytes aleatorios, guardados solo como SHA-256 (igual que las sesiones) | RNF-2. Usarlos o anularlos es borrar la fila. |

## Datos
Una migración que solo agrega, así que no necesita respaldo según `docs/migrations.md`:

**`User`** (`name` sigue siendo el nombre):
- `lastName String?`
- `emailVerifiedAt DateTime?`: `null` significa Pendiente.
- `googleId String? @unique`: el `sub` de Google. Así, cambiar de correo no rompe la entrada con Google (RF-16).
- `profileIncomplete Boolean @default(false)`: solo para cuentas de Google sin nombre o apellido (RF-7). Las cuentas existentes sin apellido no quedan bloqueadas (RF-18).

**`UserToken`** (nueva, con RLS y borrado en cascada con el usuario):
- `tokenHash @unique`, `userId`, `expiresAt`, `createdAt`.
- `purpose`: `confirm`, `reset` o `email_change`.
- `newEmail?`: solo para `email_change`.

**`EmailSend`** (nueva, con RLS): `recipient`, `createdAt`, con índice por ambos. Sirve para el límite de RF-12, porque un contador en memoria no sobrevive entre instancias. Al insertar se borran las filas de más de 1 hora.

**Datos existentes (RF-18):** la migración incluye `UPDATE "User" SET "emailVerifiedAt" = "createdAt";`.

## Código nuevo y reutilizado

**Nuevo en `src/lib`, sin React, con `*.check.ts`** (principio 4):
- `user-validation.ts`: normaliza el correo y valida nombre, apellido, correo y contraseña (RF-3).
- `user-status.ts`: estado, método de registro y ordenamiento de la tabla (RF-14).

**Nuevo en `src/lib`, sin check porque hablan con servicios:**
- `email.ts`: `sendEmail()` con `fetch`, tiempo límite de 5 s y el tope de RF-12. Devuelve si salió o no y registra los fallos. Sin `BREVO_API_KEY` y fuera de producción, imprime el enlace en consola para poder desarrollar.
- `user-tokens.ts`: crear, buscar, consumir y anular enlaces.
- `app-url.ts` (`APP_URL`), `account-emails.ts` (arma los correos con texto del diccionario), `account-flows.ts` (reenvío de confirmación), `timing.ts` (tiempo mínimo de respuesta) y `log.ts` (registro en JSON).

**Reutilizado:**
- `src/lib/password.ts` para contraseñas.
- `createSession` y `destroySession` de `src/lib/session.ts`.
- `matchesSearch` de `src/lib/search.ts` para la búsqueda.
- `resolveSort`, `SortableHeader`, `Modal`, `PageContainer` y `src/lib/styles.ts`.

**Textos:** todo va en `src/i18n/dictionaries` (es y en), incluidos los correos. Los correos no incluyen el nombre de la persona, porque cualquiera podría registrar un nombre con contenido engañoso.

## Etapas

### 1. Base y acceso (RF-1, RF-18)
- Cambiar `prisma/schema.prisma` y generar la migración según `docs/migrations.md`, agregando RLS a las tablas nuevas.
- `src/proxy.ts`, `requireUser()` y la página de login exigen cuenta confirmada en lugar de `isAdmin`.
- Agregar `requireAdmin()`. Si `profileIncomplete` es verdadero, `requireUser()` lleva a `/complete-profile`.
- Abrir en el proxy las rutas públicas nuevas.
- `scripts/create-admin.ts` deja la cuenta confirmada.
- Actualizar GAS-1, CUE-1, CAT-1, PRE-1 y la regla de acceso de `AGENTS.md`.

### 2. Registro y confirmación (RF-2 a RF-6, RF-11 a RF-13)
- `/register`: formulario con errores por campo. Un error de correo duplicado de la base (`P2002`) sigue el camino neutro de RF-4.
- `/confirm-email?token=`: abrirlo solo consulta; el botón llama a un Server Action que confirma.
- Enlace inválido: formulario para pedir otro. Responde siempre lo mismo y solo envía a cuentas Pendientes.
- Login: cuenta Pendiente con contraseña correcta muestra el aviso y el botón de reenviar.

### 3. Recuperación (RF-9, RF-10)
- `/forgot-password` y `/reset-password?token=`.
- Al cambiarla: guardar, limpiar bloqueo, cerrar sesiones y anular enlaces, todo en una transacción.

### 4. Google (RF-7, RF-8)
- Recuperar `src/app/api/auth/google/route.ts` y `callback/route.ts`. Corregir que la versión anterior sobrescribe el nombre y no valida el estado de la cuenta.
- Buscar primero por `googleId` y luego por correo.
- El botón es un `<a>` simple: la CSP de `next.config.ts` tiene `form-action 'self'`, que bloquearía un formulario que redirige a Google.
- `/complete-profile` para RF-7.

### 5. Tabla de usuarios (RF-14 a RF-17)
- `/users` y enlace en `src/components/Sidebar.tsx`. La lista se ordena y se filtra en memoria, como Gastos, porque estado y método se calculan.
- Editar en modal. Cada acción llama a `requireAdmin()`.
- Cambio de correo: una cuenta Confirmada usa `email_change`; una Pendiente lo reemplaza directo.
- Eliminar con transacción `Serializable`: contar administradores y borrar. Si dos chocan (`P2034`), se rechaza. Se reutiliza `DeleteButton` con una función que guarda el error en un estado y lo muestra bajo la tabla.

## Riesgos y límites conocidos
- **RNF-1 y el tiempo de respuesta:** enviar un correo tarda, y recuperar contraseña no envía nada si la cuenta no existe. Registro, reenvío y recuperación tendrán un tiempo mínimo de respuesta de 1.5 s, y de ahí sale el tiempo que tarda el envío. Si Brevo tarda más, el tiempo podría delatar la cuenta.
- **RNF-2 y los registros del hosting:** los enlaces van en la URL, así que el hosting podría registrarlos. Duran poco y son de un solo uso. La app no los registra.
- **Eliminar con `Serializable`:** depende de que funcione a través del pooler de Supabase. Se prueba antes de darlo por bueno.

## Orden de despliegue
Según `docs/migrations.md`, por ser un cambio que agrega:
1. Aplicar la migración, con tu confirmación explícita.
2. Configurar `BREVO_API_KEY`, `EMAIL_FROM` y `APP_URL` en el hosting.
3. Desplegar el código. **Desde ese momento el registro queda abierto y cualquiera con correo válido ve tus datos (RF-1).**

## Verificación
- Lint, tipos, checks y build en cada etapa.
- De punta a punta contra un PostgreSQL desechable, nunca contra Supabase, recorriendo cada RF y caso límite en el navegador. Requiere Docker Desktop abierto u otro proyecto de Supabase.
- Eliminación simultánea de dos administradores contra PostgreSQL real.
- Un no administrador llamando directamente a editar y eliminar es rechazado.
- Un correo real de cada tipo llega a la bandeja de entrada, y entrar con Google funciona con credenciales reales.
