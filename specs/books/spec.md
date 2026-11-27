# Spec: Libros

**Estado:** Aprobada el 2026-11-26.
**Rutas:** `/books`, `/books/[id]`, `/invitations/[token]` y la selección del libro activo en la barra lateral.

## Contexto y objetivo
Hoy existe un solo conjunto de gastos, cuentas, categorías y presupuesto, y cualquier usuario confirmado lo ve y lo modifica. Como el registro está abierto, cualquiera que cree una cuenta ve las finanzas del hogar.

El objetivo es que las finanzas vivan en **libros**. Cada libro tiene sus propios gastos, cuentas, categorías y presupuesto, y solo lo ven sus miembros. Una persona puede tener varios libros e invitar a otras, con permiso de lectura o de escritura, para llevar juntas las finanzas de un hogar.

## Roles dentro de un libro
Son independientes de los roles de la app (`user` y `admin`, `specs/roles/spec.md`).

| Rol | Ver finanzas | Modificar finanzas | Administrar el libro |
|---|---|---|---|
| **Dueño** | Sí | Sí | Sí: renombrar, eliminar, invitar, cambiar permisos y quitar miembros |
| **Escritura** | Sí | Sí | No |
| **Lectura** | Sí | No | No |

"Modificar finanzas" es crear, editar o eliminar gastos, cuentas, categorías y presupuesto. Cada libro tiene exactamente un dueño: quien lo creó.

## Historias de usuario
- **HU-1.** Como usuario, quiero que solo yo y las personas que invite veamos mis finanzas.
- **HU-2.** Como usuario, quiero tener varios libros, por ejemplo uno del hogar y uno personal, y cambiar entre ellos.
- **HU-3.** Como dueño, quiero invitar a mi pareja a mi libro, por correo o con un enlace, para llevar juntos los gastos del hogar.
- **HU-4.** Como dueño, quiero elegir si un invitado solo consulta o también modifica, y cambiarlo después.
- **HU-5.** Como dueño, quiero quitar a un miembro para que deje de ver el libro.
- **HU-6.** Como miembro, quiero salir de un libro que ya no uso.

## Requisitos funcionales

### Aislamiento
**LIB-1. Cada dato pertenece a un libro.**
- Todo gasto, cuenta, categoría y presupuesto DEBERÁ pertenecer a exactamente un libro.
- El sistema DEBERÁ mostrar, contar, buscar y modificar solo los datos del libro activo: listas, totales, gráficas, filtros, el selector de meses y las listas de cuentas y categorías al capturar un gasto.
- SI una petición nombra un gasto, cuenta o categoría de otro libro, incluso cambiando la URL o llamando directamente a la acción, ENTONCES el sistema DEBERÁ tratarlo como inexistente: la página 404 o el error de "no existe", sin cambiar nada ni revelar que existe.
- SI un gasto se guarda con una cuenta o categoría de otro libro, ENTONCES el sistema DEBERÁ rechazarlo como cuenta o categoría inválida.

**LIB-2. Unicidad por libro.** El nombre único de las cuentas (CUE-7) y de las categorías (CAT-5) y el registro único por tipo de presupuesto DEBERÁN ser únicos dentro de cada libro. Dos libros pueden tener una cuenta "BBVA".

**LIB-3. Acceso.** Reemplaza GAS-1, CUE-1, CAT-1 y PRE-1, y el primer punto de RF-1 de `specs/users/spec.md`.
- MIENTRAS un usuario confirmado sea miembro del libro activo, el sistema DEBERÁ permitirle ver sus finanzas.
- MIENTRAS su rol en el libro activo sea Dueño o Escritura, el sistema DEBERÁ permitirle modificarlas.
- SI un miembro con rol Lectura intenta modificar, incluso llamando directamente a la acción, ENTONCES el sistema DEBERÁ rechazarlo sin cambiar nada.
- MIENTRAS el rol sea Lectura, el sistema NO DEBERÁ mostrar los botones ni las acciones de crear, editar, eliminar ni editar con doble clic. Ocultarlos no cuenta como protección.
- El sistema DEBERÁ leer la membresía y el rol en cada petición. Un cambio de permiso, una salida o una eliminación aplica desde la siguiente acción de esa persona, sin cerrar su sesión.
- El rol `admin` de la app NO DEBERÁ dar acceso a libros de los que no se es miembro.

### Libro activo
**LIB-4. Elegir el libro.**
- La barra lateral DEBERÁ mostrar el nombre del libro activo y permitir cambiar a cualquier otro libro del que la persona sea miembro.
- CUANDO la persona cambie de libro, el sistema DEBERÁ mostrar los datos del libro nuevo en la página actual.
- El sistema DEBERÁ recordar el último libro elegido por cada persona, también entre sesiones y dispositivos.
- SI el libro recordado ya no existe o la persona ya no es miembro, ENTONCES el sistema DEBERÁ usar otro libro del que sí sea miembro: primero uno propio y, si no tiene, el más antiguo al que se unió.

**LIB-5. Siempre hay un libro.**
- CUANDO se cree una cuenta, con el formulario o con Google, el sistema DEBERÁ crearle un libro vacío llamado "Mi libro" ("My book" en inglés, según el idioma de la interfaz) del que es dueña.
- MIENTRAS una persona no sea miembro de ningún libro, por ejemplo porque eliminó o dejó todos, el sistema DEBERÁ crearle uno vacío igual la siguiente vez que abra una página de finanzas.

### Administrar libros
**LIB-6. Mis libros.** `/books` DEBERÁ listar los libros de la persona con su nombre, su rol y el número de miembros, ordenados por nombre, y marcar el activo.

**LIB-7. Crear.** Cualquier usuario confirmado DEBERÁ poder crear libros sin límite. El nombre es obligatorio, se guarda sin espacios al inicio ni al final y tiene como máximo 100 caracteres. Puede repetirse. El libro nuevo empieza vacío y pasa a ser el activo.

**LIB-8. Renombrar.** MIENTRAS la persona sea dueña, el sistema DEBERÁ permitirle cambiar el nombre, con las reglas de LIB-7.

**LIB-9. Eliminar.**
- MIENTRAS la persona sea dueña, el sistema DEBERÁ permitirle eliminar el libro tras una confirmación que avise que se borrarán todos sus gastos, cuentas, categorías y presupuesto, y que sus miembros perderán el acceso.
- CUANDO se elimine, el sistema DEBERÁ borrar en una sola transacción el libro, todos sus datos, sus membresías y sus invitaciones pendientes.

### Miembros
**LIB-10. Ver miembros.** `/books/[id]` DEBERÁ mostrar a cualquier miembro el nombre del libro y sus miembros, con nombre, correo y rol. Al dueño le muestra además las invitaciones pendientes y las acciones de administración.

**LIB-11. Cambiar permiso.**
- MIENTRAS la persona sea dueña, el sistema DEBERÁ permitirle cambiar a un miembro entre Lectura y Escritura.
- El rol de Dueño NO DEBERÁ poder asignarse ni quitarse desde aquí.

**LIB-12. Quitar a un miembro.** MIENTRAS la persona sea dueña, el sistema DEBERÁ permitirle quitar a cualquier otro miembro tras pedir confirmación. Los datos que ese miembro capturó se quedan en el libro.

**LIB-13. Salir.**
- MIENTRAS la persona sea miembro y no dueña, el sistema DEBERÁ permitirle salir del libro tras pedir confirmación.
- El dueño NO DEBERÁ poder salir de su libro: solo puede eliminarlo (LIB-9).
- CUANDO alguien salga de su libro activo, el sistema DEBERÁ aplicar LIB-4 y, si no le queda ninguno, LIB-5.

### Invitaciones
**LIB-14. Reglas comunes.**
- Solo el dueño DEBERÁ poder crear y anular invitaciones de su libro.
- Cada invitación DEBERÁ indicar el permiso con el que entra el invitado: Lectura o Escritura.
- Una invitación DEBERÁ servir una sola vez, vencer a los 7 días y poder anularse mientras siga pendiente.
- El sistema DEBERÁ guardar las invitaciones de forma que el enlace no pueda leerse desde la base, como los enlaces de `specs/users/spec.md` (RNF-2).
- CUANDO alguien abra un enlace vigente, el sistema DEBERÁ mostrar el nombre del libro, quién invita y el permiso, con un botón "Unirme al libro", sin unirlo todavía.
- CUANDO pulse ese botón, el sistema DEBERÁ hacerlo miembro con el permiso de la invitación, gastar la invitación, dejar ese libro como activo y llevarlo al inicio.
- SI la persona ya es miembro del libro, ENTONCES el sistema DEBERÁ indicarlo, llevarla al libro sin cambiar su permiso y NO DEBERÁ gastar la invitación.
- SI el enlace venció, ya se usó, fue anulado o su libro ya no existe, ENTONCES el sistema DEBERÁ indicar que no es válido, sin revelar el libro.
- SI quien abre el enlace no tiene sesión, ENTONCES el sistema DEBERÁ pedirle que inicie sesión o se registre y, cuando inicie sesión en ese mismo navegador, llevarlo de vuelta a la invitación.

**LIB-15. Invitación por correo.**
- MIENTRAS la persona sea dueña, el sistema DEBERÁ permitirle escribir un correo, elegir el permiso y enviar un enlace a ese correo, en el idioma de la interfaz de quien invita.
- El sistema DEBERÁ validar el correo como RF-3 de `specs/users/spec.md` y mostrar el mismo mensaje de éxito exista o no una cuenta con ese correo.
- SI el correo ya es de un miembro del libro, ENTONCES el sistema DEBERÁ rechazarlo e indicarlo.
- Solo DEBERÁ poder aceptarla una cuenta confirmada cuyo correo sea ese, sin distinguir mayúsculas. SI la abre otra cuenta, ENTONCES el sistema DEBERÁ indicar que la invitación es para otra cuenta, sin mostrar el correo ni gastarla.
- El envío DEBERÁ contar para los límites de RF-12 de `specs/users/spec.md`. SI se supera el límite, ENTONCES el sistema DEBERÁ indicarlo al dueño y no crear la invitación.
- SI el correo no sale, ENTONCES el sistema DEBERÁ indicarlo al dueño, no dejar la invitación pendiente y registrar el fallo.
- Invitar otra vez al mismo correo en el mismo libro DEBERÁ anular la invitación anterior a ese correo.

**LIB-16. Invitación por enlace.**
- MIENTRAS la persona sea dueña, el sistema DEBERÁ permitirle generar un enlace con un permiso y mostrarlo una sola vez con un botón para copiarlo. No se envía ningún correo.
- Cualquier cuenta confirmada que lo abra DEBERÁ poder aceptarlo.
- La lista de invitaciones pendientes DEBERÁ distinguir las de correo, con su destinatario, de las de enlace, y mostrar su permiso y su vencimiento.

### Cuentas eliminadas
**LIB-17. Eliminar una cuenta de usuario.** Reemplaza el tercer punto de RF-17 de `specs/users/spec.md`.
- CUANDO un administrador elimine una cuenta, el sistema DEBERÁ quitar sus membresías y, por cada libro del que era dueña:
  - SI tiene miembros con permiso de Escritura, ENTONCES DEBERÁ pasarlo al que se unió primero, como nuevo dueño.
  - SI no tiene, ENTONCES DEBERÁ eliminar el libro como en LIB-9, aunque tenga miembros con Lectura.
- Todo esto DEBERÁ ocurrir en la misma transacción que la eliminación de la cuenta.
- La confirmación de eliminar DEBERÁ avisar que sus libros pasan a otro miembro con Escritura o, si no hay ninguno, se borran.
- Las invitaciones pendientes de un libro que cambia de dueño DEBERÁN anularse.

### Datos existentes
**LIB-18.** CUANDO esta funcionalidad entre en uso:
- El sistema DEBERÁ crear un libro "Mi libro" del dueño del proyecto con todos los gastos, cuentas, categorías y presupuesto actuales, sin cambiar ningún dato, y dejarlo como su libro activo.
- Toda otra cuenta existente DEBERÁ recibir su propio libro vacío y NO DEBERÁ conservar acceso a los datos actuales.
- Nadie DEBERÁ perder su contraseña, sus sesiones ni su rol.

**LIB-19. Datos iniciales.** Reemplaza CUE-15 y CAT-13. `prisma/seed.ts` se elimina: los libros nuevos empiezan vacíos (LIB-5, LIB-7) y los datos actuales ya existen.

## Requisitos no funcionales
- **RNF-1. Autorización en el servidor.** Toda página y Server Action de finanzas y de libros verifica en el servidor la membresía y el rol en el libro que toca. Ninguna confía en un identificador de libro enviado por el navegador sin verificarlo.
- **RNF-2. Atomicidad.** Unirse, cambiar un permiso, quitar a un miembro, eliminar un libro y eliminar una cuenta escriben en una sola transacción. Una invitación no sirve dos veces aunque se acepte a la vez desde dos pestañas o por dos personas.
- **RNF-3. Base de datos.** Las tablas nuevas activan RLS en su migración. Los datos de finanzas quedan ligados a su libro en la base, que también impide que un gasto apunte a una cuenta o categoría de otro libro.
- **RNF-4. Privacidad.** Invitar por correo no revela si ese correo tiene cuenta (LIB-15). Un enlace inválido no revela el libro (LIB-14).
- **RNF-5. Trazabilidad.** Se registran creación y eliminación de libros, invitaciones creadas, aceptadas y anuladas, cambios de permiso, miembros quitados o que salen y libros que cambian de dueño, con quién lo hizo y sin enlaces.
- **RNF-6. Idiomas.** Todo texto nuevo, los nombres de los roles y el correo de invitación existen en español e inglés.
- **RNF-7. Pruebas automatizables.** Tienen checks, sin base de datos ni `.env`:
  - las reglas de permisos por rol;
  - la decisión sobre una invitación: vigente, vencida, usada, anulada, para otro correo, ya miembro;
  - la elección del libro activo de LIB-4;
  - la elección del nuevo dueño de LIB-17;
  - la validación del nombre del libro;
  - una revisión del código que falla si una página o acción de finanzas no verifica el libro, si una acción que modifica no exige Escritura, o si una consulta de finanzas no filtra por libro.

## Dependencias externas
Ninguna nueva. El correo de invitación usa el servicio de correo de `specs/users/spec.md`.

## Casos límite
| Caso | Comportamiento |
|---|---|
| Alguien escribe en la URL el id de un gasto de otro libro | 404, sin revelar que existe (LIB-1). |
| Un miembro con Lectura llama directamente a la acción de borrar un gasto | Se rechaza sin cambiar nada (LIB-3). |
| El dueño cambia a Lectura a un miembro que tiene un formulario abierto | Al guardar, se rechaza (LIB-3). |
| El dueño quita a un miembro que tiene el libro abierto | Su siguiente acción usa otro de sus libros (LIB-4). |
| El dueño elimina el libro que otro miembro tiene activo | Igual que el caso anterior (LIB-4, LIB-5). |
| Dos personas aceptan el mismo enlace a la vez | Solo una se une. La otra ve que el enlace no es válido (RNF-2). |
| El dueño anula una invitación mientras la aceptan | Gana una de las dos: o se une y la invitación queda gastada, o se anula y no se une (RNF-2). |
| El dueño abre su propio enlace | Se indica que ya es miembro y no se gasta (LIB-14). |
| La pareja abre la invitación por correo con otra cuenta suya | Se indica que es para otra cuenta y no se gasta (LIB-15). |
| La invitación llega a un correo sin cuenta | Se registra con ese correo, lo confirma, inicia sesión y vuelve a la invitación (LIB-14). |
| Alguien reenvía a un tercero un enlace de invitación | El tercero puede unirse. Es el riesgo de LIB-16, y el dueño lo ve en Miembros y puede quitarlo. Las invitaciones por correo no tienen este riesgo. |
| Se cambia el correo de la cuenta invitada antes de aceptar | La invitación es para el correo anterior y ya no sirve para esa cuenta (LIB-15). |
| Se elimina la cuenta del dueño de un libro con un miembro con Escritura | El libro pasa a ese miembro con todos sus datos (LIB-17). |
| Se elimina la cuenta del dueño de un libro con miembros que solo tienen Lectura | El libro se borra con sus datos (LIB-17). |
| Una persona elimina o deja todos sus libros | Al abrir una página de finanzas recibe un "Mi libro" vacío (LIB-5). |
| Un administrador abre `/books/[id]` de un libro ajeno | 404: ser `admin` no da acceso (LIB-3). |
| Dos libros tienen una cuenta "BBVA" | Se permite (LIB-2). |
| Se cambia de libro con un filtro de mes en la URL | Se aplica el mismo filtro al libro nuevo. Si ese mes no tiene gastos, se muestra el aviso de mes vacío. |

## Fuera de alcance
- Límite de libros por persona y cobro por libros adicionales. El modelo no lo impide, pero no se implementa ahora.
- Transferir un libro a otro miembro por decisión del dueño (solo ocurre en LIB-17).
- Más permisos que Lectura y Escritura, o permisos por sección.
- Mover o copiar datos entre libros.
- Ver las invitaciones pendientes dentro de la app de quien es invitado: le llegan solo por correo o por enlace.
- Avisar por correo a un miembro de que lo quitaron o de que cambió su permiso.
- Que un administrador consulte libros ajenos.

## Criterios de finalización
- Todos los LIB se cumplen con sus criterios, y cada caso límite se probó o se justificó.
- Se recorrió de punta a punta en un entorno que no toca datos reales: dos cuentas, invitación por correo y por enlace con cada permiso, cambio de permiso, quitar, salir, eliminar libro y eliminar la cuenta del dueño.
- Después de la migración, la cuenta del dueño del proyecto ve exactamente los mismos gastos, cuentas, categorías y presupuesto que antes, y cualquier otra cuenta ve su libro vacío.
- GAS-1, CUE-1, CUE-7, CUE-15, CAT-1, CAT-5, CAT-13 y PRE-1; RF-1 y RF-17 de `specs/users/spec.md`; el "Fuera de alcance" de usuarios y de roles; y las reglas de acceso de `AGENTS.md` se actualizaron en el mismo commit que el código.
- `npm test` corre los checks nuevos y pasa sin base de datos ni `.env`.
- Lint, tipos y checks pasan.
