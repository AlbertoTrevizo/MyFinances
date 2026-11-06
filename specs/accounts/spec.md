# Spec: Cuentas

**Estado:** Aprobada el 2026-11-04.
**Rutas:** `/accounts`, `/accounts/new`, `/accounts/[id]/edit`

## Propósito
Administrar los medios de pago a los que se asigna cada gasto: bancos, tarjetas o efectivo.

## Datos

| Campo | Regla |
|---|---|
| `name` | Obligatorio y único. Se guarda sin espacios al inicio ni al final. |
| `type` | Obligatorio. Texto libre, por ejemplo "Débito" o "Crédito". No afecta ningún cálculo. |
| `cutoffDay` | Opcional. Entero de 1 a 31. Vacío se guarda como `null`. |
| `paymentDay` | Opcional. Entero de 1 a 31. Vacío se guarda como `null`. Es informativo: ningún cálculo lo usa. |

## Reglas

### Acceso
- **CUE-1.** Las páginas y todas las acciones requieren una sesión de usuario confirmado. Sin ella, se redirige a `/login`.

### Listado
- **CUE-2.** La tabla muestra nombre, tipo, día de corte y día de pago. Un día vacío se muestra como `—`.
- **CUE-3.** El orden inicial es por nombre ascendente. Se puede ordenar por nombre o tipo; los días no se pueden ordenar.
- **CUE-4.** Sin cuentas, se muestra un mensaje en lugar de la tabla.

### Crear y editar
- **CUE-5.** Crear y editar usan páginas propias con el mismo formulario. Al guardar, se regresa a `/accounts`. Si hay error, el formulario sigue abierto con el mensaje.
- **CUE-6.** Si hay varios errores, se muestra uno solo, en este orden: nombre, tipo, día de corte, día de pago.
- **CUE-7.** Un nombre repetido se rechaza con un mensaje propio. La comparación es exacta: `BBVA` y `bbva` pueden coexistir.
- **CUE-8.** El formulario indica que los días solo aplican a tarjetas de crédito, pero no se valida: cualquier cuenta puede tenerlos.
- **CUE-9.** Editar una cuenta inexistente muestra la página 404.
- **CUE-10.** Doble clic edita cualquiera de los cuatro campos en la tabla. Guarda con Enter o al salir del campo; Escape cancela. Si hay error, se muestra debajo de la tabla y la celda sigue en edición. Dejar un día vacío lo borra.

### Relación con los gastos
- **CUE-11.** Tener día de corte es lo único que habilita las compras a MSI en una cuenta (GAS-10).
- **CUE-12.** Cambiar el día de corte no modifica las mensualidades ya creadas hasta que se edite su registro original (GAS-30).
- **CUE-13.** Las listas de cuentas al capturar un gasto muestran `Nombre (Tipo)`, ordenadas de la más antigua a la más nueva.

### Eliminar
- **CUE-14.** Eliminar pide confirmación. Si la cuenta tiene cualquier gasto, incluidos registros de MSI, no se borra y se muestra un error. La base de datos también lo impide.

### Datos iniciales
- **CUE-15.** `prisma/seed.ts` crea las cuentas iniciales solo si se ejecuta a mano. Al repetirlo, no duplica cuentas, pero restaura el tipo de las que ya existen con ese nombre y vuelve a crear las que se borraron o renombraron.

## Por decidir
Así funciona hoy, pero podría no ser lo que quieres. Cada punto queda igual hasta que decidas; al cambiarlo, se actualiza la regla y el código.

- **D-1. El error de eliminar no se quita solo (media).** El mensaje vive en la URL (`?error=hasExpenses`) y sigue visible aunque después borres otra cuenta con éxito. Además, se pierde el orden elegido. Recomiendo limpiarlo tras la siguiente acción.
- **D-2. Nombres casi iguales (baja).** `BBVA` y `bbva` cuentan como distintos, lo que permite duplicados por accidente. Recomiendo rechazarlos.
- **D-3. Días con texto fuera del navegador (baja).** El campo numérico no lo permite, pero el servidor acepta `12abc` como 12 en vez de rechazarlo.
- **D-4. Errores sin mensaje propio (baja).** Editar o borrar una cuenta que ya no existe, por ejemplo desde otra pestaña, muestra un error genérico.
