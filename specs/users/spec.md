# Spec: Usuarios

**Estado:** Aprobada el 2026-11-04.

## Contexto y objetivo
Hoy solo entra quien ya es administrador, y su cuenta se crea a mano fuera de la app. Eso impide que otra persona use la app por su cuenta y obliga a intervenir manualmente para recuperar una contraseña.

El objetivo es que cualquier persona pueda crear su cuenta con un formulario o con Google, demostrar que el correo es suyo y recuperar su acceso sin ayuda, y que los administradores puedan consultar y corregir las cuentas desde una tabla.

Los roles y permisos detallados quedan para la siguiente spec.

## Usuarios
- **Visitante:** no tiene sesión. Puede registrarse, confirmar su correo, iniciar sesión y recuperar su contraseña.
- **Usuario confirmado:** tiene una cuenta con correo confirmado. Usa toda la app y consulta la tabla de usuarios.
- **Administrador:** usuario confirmado que además edita y elimina usuarios. Es quien hoy ya tiene esa marca; esta spec no permite otorgarla.

**Estados de una cuenta:** "Pendiente" hasta que confirma su correo y "Confirmada" después.

## Historias de usuario
- **HU-1.** Como visitante, quiero registrarme con mis datos para usar la app.
- **HU-2.** Como visitante, quiero registrarme con Google para no crear otra contraseña.
- **HU-3.** Como visitante, quiero confirmar mi correo para activar mi cuenta y demostrar que es mío.
- **HU-4.** Como usuario, quiero recuperar mi contraseña por correo para no perder el acceso si la olvido.
- **HU-5.** Como usuario confirmado, quiero ver a los usuarios registrados para saber quién tiene cuenta.
- **HU-6.** Como administrador, quiero corregir los datos de un usuario para mantenerlos al día.
- **HU-7.** Como administrador, quiero eliminar usuarios para quitar cuentas que ya no deben existir.

## Requisitos funcionales

### Acceso
**RF-1. Acceso a la app.** Reemplaza las reglas GAS-1, CUE-1, CAT-1 y PRE-1, que hoy exigen sesión de administrador.
- MIENTRAS un usuario tenga sesión y su cuenta esté confirmada, el sistema DEBERÁ permitirle ver y modificar gastos, cuentas, categorías y presupuesto.
- MIENTRAS no haya sesión de un usuario confirmado, el sistema DEBERÁ permitir solo las pantallas de iniciar sesión, registro, confirmación de correo y recuperación de contraseña, y DEBERÁ redirigir cualquier otra a iniciar sesión.
- CUANDO alguien con sesión abra registro o iniciar sesión, el sistema DEBERÁ llevarlo al inicio.

### Registro con formulario
**RF-2. Formulario de registro.**
- El sistema DEBERÁ pedir nombre, apellido, correo, contraseña y confirmación de contraseña; todos son obligatorios.
- CUANDO el visitante envíe datos válidos con un correo no registrado, el sistema DEBERÁ crear la cuenta como Pendiente, enviar el correo de confirmación y mostrar el mensaje "revisa tu correo".
- SI un dato es inválido, ENTONCES el sistema DEBERÁ indicar el error junto a su campo, no crear ni cambiar ninguna cuenta y conservar lo escrito, salvo las contraseñas.
- SI la contraseña y su confirmación no coinciden, ENTONCES el sistema DEBERÁ rechazar el registro e indicarlo.

**RF-3. Validación de datos.**
- El sistema DEBERÁ quitar los espacios al inicio y al final de nombre, apellido y correo, y exigir que nombre y apellido no queden vacíos y tengan como máximo 100 caracteres.
- El sistema DEBERÁ exigir un correo con formato válido y tratarlo sin distinguir mayúsculas: `Ana@x.com` y `ana@x.com` son la misma cuenta.
- El sistema DEBERÁ exigir contraseñas de 12 a 128 caracteres, sin requisitos de mayúsculas, números ni símbolos.

**RF-4. Correo ya registrado.**
- SI el correo ya pertenece a una cuenta Confirmada, ENTONCES el sistema DEBERÁ mostrar el mismo mensaje que en un registro normal, no cambiar la cuenta y enviar al correo un aviso de que ya tiene cuenta, con un enlace para recuperar la contraseña.
- SI el correo pertenece a una cuenta Pendiente, ENTONCES el sistema DEBERÁ mostrar el mismo mensaje, reemplazar nombre, apellido y contraseña por los nuevos, anular los enlaces anteriores y enviar un nuevo enlace de confirmación.

### Confirmación de correo
**RF-5. Confirmar la cuenta.**
- El enlace de confirmación DEBERÁ servir una sola vez y vencer a las 24 horas.
- CUANDO alguien abra un enlace vigente, el sistema DEBERÁ mostrar una pantalla con el botón "Confirmar mi correo", sin confirmar todavía.
- CUANDO pulse ese botón, el sistema DEBERÁ marcar la cuenta como Confirmada y llevarlo a iniciar sesión con un aviso de éxito, sin abrir sesión.
- SI el enlace venció, ya se usó o fue anulado, ENTONCES el sistema DEBERÁ indicar que no es válido y ofrecer pedir otro.

**RF-6. Inicio de sesión con cuenta Pendiente.**
- SI alguien intenta entrar a una cuenta Pendiente con la contraseña correcta, ENTONCES el sistema DEBERÁ negar el acceso, indicar que falta confirmar el correo y ofrecer reenviar el enlace.
- SI la contraseña es incorrecta, ENTONCES el sistema DEBERÁ mostrar el mismo error que en cualquier credencial incorrecta.

### Registro e inicio de sesión con Google
**RF-7. Cuenta nueva con Google.**
- El sistema DEBERÁ ofrecer entrar con Google en las pantallas de registro e iniciar sesión.
- CUANDO Google entregue un correo verificado que no tenga cuenta, el sistema DEBERÁ crear la cuenta como Confirmada, sin correo de confirmación, tomar nombre y apellido de Google y abrir sesión.
- SI Google no entrega nombre o apellido, ENTONCES el sistema DEBERÁ pedirlos antes de dejarlo continuar.
- SI Google no marca el correo como verificado, ENTONCES el sistema DEBERÁ rechazar la entrada sin crear ninguna cuenta.
- SI la persona cancela en Google o Google falla, ENTONCES el sistema DEBERÁ volver a iniciar sesión con un aviso y sin crear ni cambiar ninguna cuenta.

**RF-8. Correo que ya tiene cuenta.**
- CUANDO Google entregue un correo verificado de una cuenta Confirmada, el sistema DEBERÁ unir Google a esa cuenta y abrir sesión; desde entonces funcionan ambos métodos.
- CUANDO Google entregue un correo verificado de una cuenta Pendiente, el sistema DEBERÁ marcarla como Confirmada, invalidar su contraseña, anular sus enlaces pendientes, unir Google y abrir sesión.

### Recuperación de contraseña
**RF-9. Pedir la recuperación.**
- CUANDO alguien pida recuperar su contraseña, el sistema DEBERÁ mostrar el mismo mensaje exista o no el correo, salvo el caso de RF-13.
- CUANDO el correo sea de una cuenta Confirmada, con o sin contraseña, el sistema DEBERÁ enviar un enlace de recuperación.
- CUANDO el correo sea de una cuenta Pendiente, el sistema DEBERÁ enviar un nuevo enlace de confirmación en lugar del de recuperación.
- CUANDO el correo no tenga cuenta, el sistema NO DEBERÁ enviar nada.

**RF-10. Usar el enlace.**
- El enlace DEBERÁ servir una sola vez y vencer a la hora; pedir otro DEBERÁ anular el anterior.
- CUANDO alguien envíe una contraseña nueva válida desde un enlace vigente, el sistema DEBERÁ guardarla, quitar cualquier bloqueo por intentos fallidos, cerrar todas las sesiones del usuario y llevarlo a iniciar sesión.
- CUANDO la cuenta solo use Google, el sistema DEBERÁ crear la contraseña y mantener también la entrada con Google.
- SI el enlace venció, ya se usó o fue anulado, ENTONCES el sistema DEBERÁ indicar que no es válido y ofrecer pedir otro.

### Límite y fallos de envío
**RF-11. Mensajes en el idioma de la interfaz.** El sistema DEBERÁ enviar cada correo en el idioma que la persona usaba al pedirlo.

**RF-12. Límite de envíos.** El sistema DEBERÁ enviar como máximo 3 correos por hora a cada dirección, sumando confirmación, recuperación y aviso de cuenta existente. SI se supera, ENTONCES el sistema NO DEBERÁ enviar más y DEBERÁ mostrar el mismo mensaje que si se hubiera enviado.

**RF-13. Fallo de envío.**
- SI falla el correo de confirmación de un registro nuevo o de un reenvío, ENTONCES el sistema DEBERÁ conservar la cuenta como Pendiente, avisar que el correo no salió y ofrecer pedir otro enlace.
- SI falla el correo de recuperación, ENTONCES el sistema DEBERÁ mostrar un error general para intentar más tarde.
- SI falla el aviso de cuenta existente de RF-4, ENTONCES el sistema DEBERÁ mantener el mismo mensaje de un registro normal.
- SI falla cualquier envío, ENTONCES el sistema DEBERÁ registrar el fallo y NO DEBERÁ reintentar por su cuenta.

### Tabla de usuarios
**RF-14. Consultar.**
- MIENTRAS un usuario esté confirmado, el sistema DEBERÁ permitirle ver la tabla con nombre, apellido, correo, método de registro (Correo, Google o ambos), estado y fecha de registro, sin mostrar nunca contraseñas.
- El sistema DEBERÁ incluir a todas las cuentas, también las Pendientes, y mostrar un guion en los datos vacíos.
- El sistema DEBERÁ ordenar inicialmente de la más reciente a la más antigua y permitir ordenar por cualquier columna.
- CUANDO alguien busque, el sistema DEBERÁ filtrar por nombre, apellido o correo sin distinguir mayúsculas ni acentos.
- MIENTRAS el usuario no sea administrador, el sistema NO DEBERÁ ofrecerle editar ni eliminar, y DEBERÁ rechazar esos intentos.

**RF-15. Editar.**
- MIENTRAS el usuario sea administrador, el sistema DEBERÁ permitirle cambiar nombre, apellido y correo de cualquier cuenta, con las validaciones de RF-3.
- SI el correo nuevo ya pertenece a otra cuenta, ENTONCES el sistema DEBERÁ rechazar el cambio e indicarlo.

**RF-16. Cambio de correo.**
- CUANDO un administrador cambie el correo de una cuenta Confirmada, el sistema DEBERÁ conservar el correo anterior como vigente, enviar un enlace de confirmación al nuevo y un aviso al anterior.
- CUANDO se confirme el enlace, con las condiciones de RF-5, el sistema DEBERÁ reemplazar el correo.
- SI el enlace vence, ENTONCES el sistema DEBERÁ conservar el correo anterior sin cambios.
- CUANDO un administrador cambie el correo de una cuenta Pendiente, el sistema DEBERÁ reemplazarlo, anular los enlaces anteriores y enviar uno nuevo al correo corregido.
- CUANDO una cuenta unida a Google cambie de correo, el sistema DEBERÁ seguir aceptando la misma cuenta de Google.

**RF-17. Eliminar.**
- MIENTRAS el usuario sea administrador, el sistema DEBERÁ permitirle eliminar cualquier cuenta, incluso la suya, tras pedir confirmación.
- SI la cuenta es del último administrador, ENTONCES el sistema DEBERÁ rechazar la eliminación e indicar el motivo, también si se intenta a la vez que otra eliminación.
- CUANDO se elimine una cuenta, el sistema DEBERÁ cerrar sus sesiones al instante, anular sus enlaces y conservar intactos gastos, cuentas, categorías y presupuesto.
- CUANDO un administrador se elimine a sí mismo, el sistema DEBERÁ llevarlo a iniciar sesión.

### Cuentas existentes
**RF-18.** CUANDO esta funcionalidad entre en uso, el sistema DEBERÁ tratar las cuentas existentes como Confirmadas y conservar su contraseña, sus sesiones y su marca de administrador. Su apellido queda vacío hasta que un administrador lo complete.

## Requisitos no funcionales
- **RNF-1. Privacidad de cuentas.** Un visitante no debe poder averiguar si un correo está registrado por los mensajes ni por el tiempo de respuesta de registro, inicio de sesión o recuperación, salvo el caso de RF-13.
- **RNF-2. Credenciales.** Las contraseñas y los enlaces vigentes no se guardan de forma legible, y nunca aparecen en pantallas, registros ni correos, salvo el enlace en su propio correo.
- **RNF-3. Bloqueo actual.** Se conserva el bloqueo por intentos fallidos de contraseña, sin afectar la entrada con Google.
- **RNF-4. Atomicidad.** Una operación que falla a medias no deja datos a medias: no hay cuenta con su correo cambiado sin confirmar ni enlaces vigentes de una cuenta eliminada.
- **RNF-5. Trazabilidad.** Se registran registro, confirmación, recuperación, edición, eliminación y fallos de envío, indicando quién lo hizo cuando aplique, sin contraseñas ni enlaces.
- **RNF-6. Idiomas.** Todo texto visible y todo correo existe en español e inglés.
- **RNF-7. Uso.** Los formularios se pueden usar con teclado y desde un teléfono, y cada error se asocia a su campo.

## Dependencias externas
La constitución pide justificar aquí lo nuevo que la app necesita para funcionar:

- **Servicio de envío de correo (Brevo).** Los enlaces de confirmación y recuperación de RF-5 y RF-10 requieren enviar correo, y enviarlo por cuenta propia suele terminar en spam. Se usa a través de su API, sin instalar ningún paquete. Si se cae, aplica RF-13.
- **Cuenta de Google.** La pide RF-7 y es opcional para cada usuario: sin ella, siempre queda el formulario.

## Casos límite
| Caso | Comportamiento |
|---|---|
| Dos registros simultáneos con el mismo correo | Solo existe una cuenta, y ambos ven el mismo mensaje (RF-4). |
| Un revisor automático del correo abre el enlace | No confirma ni gasta el enlace, porque hace falta pulsar el botón (RF-5). |
| Se abre un enlace de confirmación ya usado | Se indica que no es válido, aunque la cuenta ya esté confirmada (RF-5). |
| Enlace de una cuenta eliminada, o de una cuenta eliminada y vuelta a registrar | No es válido (RF-17). |
| Otra persona registró tu correo y sigue Pendiente | Al registrarte tú, sus datos se reemplazan y su enlace se anula (RF-4). |
| Otra persona registró tu correo y tú abres su enlace | Tu cuenta queda con su contraseña. El correo debe decir que lo ignores si no fuiste tú. Riesgo aceptado: el registro abierto ya da acceso a los mismos datos. |
| Dos personas registran en secuencia un correo Pendiente | El último registro reemplaza al anterior, y solo funciona el enlace más reciente (RF-4). |
| Se pide reenviar o recuperar más de 3 veces en una hora | No sale más correo y el mensaje no cambia (RF-12). |
| El servicio de correo cae durante una recuperación | El error aparece solo si la cuenta existe y revela eso mientras dure la caída. Riesgo aceptado (RF-13). |
| Otra cuenta toma el correo nuevo antes de que se confirme el cambio | La confirmación se rechaza y se conserva el correo anterior (RF-16). |
| Un administrador edita una cuenta recién eliminada por otro | Se indica que la cuenta ya no existe (RF-15). |
| Dos administradores se eliminan a la vez | Siempre queda al menos uno (RF-17). |
| Usuario sin permiso abierto en otra pestaña tras perder la sesión | Va a iniciar sesión en su siguiente acción (RF-1). |

## Fuera de alcance
- Roles y permisos: crear administradores, asignar roles y limitar lo que ve un usuario. Van en la siguiente spec.
- Datos por usuario: gastos, cuentas y presupuesto siguen siendo únicos y compartidos.
- Perfil propio: que un usuario cambie su propio nombre, correo o contraseña estando dentro de la app.
- Desactivar cuentas sin eliminarlas, y restaurar cuentas eliminadas.
- Otros proveedores de identidad, verificación en dos pasos e invitaciones.
- Reintentos automáticos de correos y borrado automático de cuentas Pendientes.
- Límite de intentos por conexión o IP.

## Criterios de finalización
- Todos los RF se cumplen con sus criterios, y cada caso límite se probó o se justificó.
- Se recorrió de punta a punta, en un entorno que no toca datos reales: registro, confirmación, inicio de sesión, recuperación, entrada con Google, unión de cuentas, edición y eliminación.
- Tus cuentas de administrador existentes siguen entrando con su contraseña actual.
- GAS-1, CUE-1, CAT-1 y PRE-1 se actualizaron en el mismo commit que el código.
- Un no administrador no puede editar ni eliminar, ni siquiera llamando directamente a esas acciones.
- Todo texto y correo existe en español e inglés.
- Lint, tipos y checks pasan.
