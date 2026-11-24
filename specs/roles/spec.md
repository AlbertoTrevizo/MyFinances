# Spec: Roles

**Estado:** Aprobada el 2026-11-24.

## Contexto y objetivo
Hoy cualquier usuario confirmado consulta la tabla de usuarios, con nombre, correo, método y estado de todas las cuentas. Como el registro está abierto, cualquiera con un correo válido puede ver esos datos. Además, la marca de administrador solo se otorga desde la terminal.

El objetivo es que solo los administradores vean la información de usuarios y roles, y que asignen roles desde la app. Por ahora hay dos roles: `user` y `admin`.

Las finanzas (gastos, cuentas, categorías y presupuesto) no cambian: siguen compartidas y abiertas a todo usuario confirmado.

## Roles
- **Usuario (`user`):** es el rol de toda cuenta nueva. Usa gastos, cuentas, categorías y presupuesto. No ve usuarios ni roles.
- **Administrador (`admin`):** puede hacer todo lo de Usuario. Además consulta la tabla de usuarios, edita y elimina cuentas y cambia roles.

## Historias de usuario
- **HU-1.** Como administrador, quiero ser el único que ve los datos de las cuentas, para que quien se registre no vea los correos de los demás.
- **HU-2.** Como administrador, quiero ver el rol de cada cuenta en la tabla de usuarios.
- **HU-3.** Como administrador, quiero cambiar el rol de una cuenta para dar o quitar la administración sin usar la terminal.
- **HU-4.** Como usuario, quiero que la app no me muestre opciones que no puedo usar.

## Requisitos funcionales

**ROL-1. Rol de cada cuenta.**
- Toda cuenta DEBERÁ tener exactamente un rol: `user` o `admin`.
- CUANDO se cree una cuenta con el formulario de registro o con Google, el sistema DEBERÁ asignarle el rol `user`.
- `scripts/create-admin.ts` DEBERÁ dejar la cuenta con el rol `admin`.

**ROL-2. Acceso a usuarios y roles.** Reemplaza el primer y el último punto de RF-14 de `specs/users/spec.md`.
- MIENTRAS un usuario confirmado tenga el rol `admin`, el sistema DEBERÁ permitirle ver la tabla de usuarios, editar, eliminar y cambiar roles.
- SI un usuario sin el rol `admin` abre la tabla de usuarios, ENTONCES el sistema DEBERÁ llevarlo al inicio sin enviarle ningún dato de otras cuentas.
- SI un usuario sin el rol `admin` intenta editar, eliminar o cambiar un rol, incluso llamando directamente a la acción, ENTONCES el sistema DEBERÁ rechazarlo sin cambiar nada.
- MIENTRAS el usuario no tenga el rol `admin`, el sistema NO DEBERÁ mostrarle el enlace a Usuarios.
- El sistema DEBERÁ leer el rol en cada petición: un cambio aplica desde la siguiente acción de esa persona, sin cerrar su sesión.

**ROL-3. Ver el rol.** La tabla de usuarios DEBERÁ mostrar una columna Rol, ordenable como las demás.

**ROL-4. Cambiar el rol.**
- MIENTRAS el usuario sea administrador, el sistema DEBERÁ permitirle cambiar el rol de cualquier cuenta, incluida la suya, tras pedir confirmación.
- SI el cambio dejaría la app sin administradores, ENTONCES el sistema DEBERÁ rechazarlo e indicar el motivo, también si se intenta a la vez que otro cambio de rol o una eliminación.
- SI la cuenta está Pendiente, ENTONCES el sistema DEBERÁ rechazar hacerla administradora e indicar que primero debe confirmar su correo.
- SI la cuenta ya no existe, ENTONCES el sistema DEBERÁ indicarlo.
- CUANDO un administrador se quite a sí mismo el rol `admin`, el sistema DEBERÁ llevarlo al inicio.

**ROL-5. Último administrador al eliminar.** La regla de RF-17 de `specs/users/spec.md` se mantiene y cuenta como administradores a las cuentas con el rol `admin`.

**ROL-6. Cuentas existentes.** CUANDO esta funcionalidad entre en uso, el sistema DEBERÁ dar el rol `admin` a las cuentas que hoy tienen la marca de administrador y el rol `user` a las demás, sin cambiar contraseñas ni cerrar sesiones. La cuenta del dueño del proyecto DEBERÁ quedar como `admin`.

## Requisitos no funcionales
- **RNF-1. Autorización en el servidor.** Toda página y Server Action de usuarios y roles verifica el rol en el servidor. Ocultar un enlace o un botón no cuenta como protección.
- **RNF-2. Trazabilidad.** Cada cambio de rol queda registrado con quién lo hizo, a qué cuenta, el rol anterior y el nuevo.
- **RNF-3. Atomicidad.** Cambiar un rol y eliminar una cuenta verifican la regla del último administrador y escriben en una sola transacción.
- **RNF-4. Idiomas.** Los nombres de los roles y todo texto nuevo existen en español e inglés.
- **RNF-5. Pruebas automatizables.** Las reglas de roles y la protección de páginas y acciones tienen checks. Los checks corren con un solo comando, sin base de datos ni `.env`, para que un CI los ejecute.

## Dependencias externas
Ninguna.

## Casos límite
| Caso | Comportamiento |
|---|---|
| Los dos únicos administradores se quitan el rol mutuamente a la vez | Siempre queda uno (ROL-4). |
| Un administrador se quita el rol mientras otro elimina al otro administrador | Siempre queda uno (ROL-4, ROL-5). |
| Un administrador pierde el rol con la tabla abierta en otra pestaña | Su siguiente acción lo lleva al inicio sin cambiar nada (ROL-2). |
| Se intenta hacer administradora una cuenta Pendiente | Se rechaza. Si alguien registró ese correo sin ser su dueño y el dueño confirma, quien lo registró conocería la contraseña de un administrador (ROL-4). |
| Se vuelve a registrar el correo de una cuenta Pendiente (RF-4 de usuarios) | Conserva el rol `user`. |
| Un administrador cambia de correo (RF-16 de usuarios) o entra con Google | Conserva su rol: el rol no depende del correo ni del método. |
| Un usuario escribe `/users` en la barra de direcciones | Va al inicio (ROL-2). |
| Se cambia el rol de una cuenta que otro administrador acaba de eliminar | Se indica que la cuenta ya no existe (ROL-4). |
| Se elige el rol que la cuenta ya tiene | No cambia nada y no se registra un cambio. |

## Fuera de alcance
- Más roles, permisos configurables o una pantalla para crear roles.
- Restringir las finanzas por rol y tener datos por usuario.
- Borrar la columna `isAdmin`: va en una segunda entrega (ver el plan).
- Avisar por correo de un cambio de rol.
- Configurar el pipeline de CI: esta spec solo deja los checks listos para él.

## Criterios de finalización
- Todos los ROL se cumplen con sus criterios, y cada caso límite se probó o se justificó.
- Un `user` no puede ver ni modificar usuarios ni roles, ni siquiera llamando directamente a las acciones.
- La cuenta del dueño entra con su contraseña actual y tiene el rol `admin`.
- RF-14 y RF-17 de `specs/users/spec.md` y la regla de acceso de `AGENTS.md` se actualizaron en el mismo commit que el código.
- `npm test` corre todos los checks y pasa sin base de datos ni `.env`.
- Lint, tipos y checks pasan.
