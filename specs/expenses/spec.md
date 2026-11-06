# Spec: Gastos

**Estado:** Aprobada el 2026-11-04.
**Ruta:** `/expenses`

## Propósito
Registrar, consultar y corregir los gastos del hogar en pesos mexicanos, incluidas las compras a meses sin intereses (MSI).

## Datos

| Campo | Regla |
|---|---|
| `description` | Obligatoria. Se guarda sin espacios al inicio ni al final. |
| `notes` | Opcional. Vacía se guarda como `null`. |
| `amountCents` | Entero mayor que 0, en centavos. |
| `date` | Día sin hora, guardado a medianoche UTC. |
| `accountId` | Obligatoria. |
| `categoryId` | Opcional. `null` se muestra como "Sin categoría". |
| `type` | `needs` (Necesidades), `wants` (Deseo) o `savings` (Ahorro). Todo gasto nuevo o guardado desde el modal lo requiere. `null` solo existe en registros antiguos y se muestra como "Sin tipo". |
| `excludeFromTotals` | `true` solo en el registro original de una compra a MSI. |
| `msiGroupId` | Une el registro original con sus mensualidades. `null` en gastos normales. |

## Reglas

### Acceso
- **GAS-1.** La página y todas las acciones requieren una sesión de usuario confirmado. Sin ella, se redirige a `/login`.

### Montos
- **GAS-2.** Un monto válido tiene dígitos y hasta 2 decimales, y es mayor que 0.
- **GAS-3.** Las comas se ignoran sin validar su posición: `1,234.56` es $1,234.56 y `1,2,3` es $123.00.
- **GAS-4.** Se rechazan `0`, negativos, `.5`, `1.`, más de 2 decimales, texto y cualquier valor mayor que $21,474,836.47.

### Crear
- **GAS-5.** "Nuevo gasto" abre un modal. Si no hay cuentas, muestra un aviso y un enlace para crear una.
- **GAS-6.** Son obligatorios descripción, monto, fecha, cuenta y tipo. Notas y categoría son opcionales. La fecha no tiene valor inicial.
- **GAS-7.** Si hay varios errores, se muestra uno solo, en este orden: descripción, cuenta, monto, fecha, tipo, meses de MSI.
- **GAS-8.** Al guardar, el modal se cierra y la lista se actualiza. Si hay error, sigue abierto y muestra el mensaje.
- **GAS-9.** Escape o un clic fuera del modal lo cierran y descartan lo escrito, sin confirmar.

### Compras a MSI
- **GAS-10.** La opción solo aparece al crear y si la cuenta elegida tiene día de corte, sea cual sea su tipo. El servidor también rechaza MSI en una cuenta sin día de corte.
- **GAS-11.** El número de meses es un entero de 2 a 36. El valor inicial es 3.
- **GAS-12.** Se crean en una sola transacción un registro original y N mensualidades con el mismo `msiGroupId`. Todos copian notas, cuenta, categoría y tipo.
  - **Original:** lleva el total, la fecha de compra y la descripción escrita. Tiene `excludeFromTotals: true`, se ve atenuado y con la etiqueta "MSI".
  - **Mensualidades:** su descripción es `<descripción> i/N`. Tienen `excludeFromTotals: false` y no llevan etiqueta.
- **GAS-13.** Cada mensualidad vale `floor(total / N)`. Los centavos sobrantes se reparten de uno en uno desde la primera, así que la suma siempre es igual al total.
- **GAS-14.** Cada mensualidad se fecha en el día de corte de su mes. Empieza en el mes de la compra, o en el siguiente si el día de compra es posterior al corte. Si el mes no tiene ese día, se usa su último día.

| Compra | Corte | Total | Mensualidades |
|---|---|---|---|
| 2026-03-10 | 15 | $1,000.00 a 3 meses | $333.34 el 15 mar, $333.33 el 15 abr, $333.33 el 15 may |
| 2026-03-15 | 15 | $1,000.00 a 3 meses | Igual: el día de corte todavía entra en ese mes |
| 2026-03-16 | 15 | $1,000.00 a 3 meses | $333.34 el 15 abr, $333.33 el 15 may, $333.33 el 15 jun |
| 2026-01-20 | 31 | $1,000.00 a 3 meses | $333.34 el 31 ene, $333.33 el 28 feb, $333.33 el 31 mar |
| 2026-12-20 | 15 | $1,000.00 a 3 meses | $333.34 el 15 ene 2027, $333.33 el 15 feb, $333.33 el 15 mar |

### Qué cuenta en los totales
- **GAS-15.** Los totales ignoran los gastos con `excludeFromTotals: true`. Las mensualidades cuentan en el mes de su fecha, aunque sea futuro.

### Listado
- **GAS-16.** La tabla muestra fecha, descripción, cuenta, categoría, tipo y monto. Muestra todos los resultados, sin paginación.
- **GAS-17.** Un gasto con notas muestra un icono; al pasar el cursor aparece el texto.
- **GAS-18.** El orden inicial es por fecha descendente. Se puede ordenar por cualquier columna: la primera vez ascendente y, al repetir el clic, se invierte. Un orden inválido en la URL usa el inicial. Ordenar conserva la búsqueda y el rango de fechas, incluido "todas las fechas".

### Filtros
- **GAS-19.** Sin `from` ni `to` en la URL, se muestra el mes actual según la hora de México (`America/Mexico_City`). El inicio usa el mismo mes actual.
- **GAS-20.** El rango incluye ambos extremos. Un extremo vacío no limita y una fecha inválida se ignora.
- **GAS-21.** La búsqueda encuentra texto dentro de la descripción, la categoría o la cuenta, sin distinguir mayúsculas ni acentos: `cafe` encuentra `Café`. La `ñ` cuenta como `n`. Se aplica sola a los 300 ms de dejar de escribir.
- **GAS-22.** Las fechas se aplican con "Filtrar" o cuando la búsqueda se actualiza.
- **GAS-23.** "Limpiar filtros" muestra todas las fechas, sin búsqueda y con el orden inicial.
- **GAS-24.** La barra de filtros se oculta si no existe ningún gasto.

### Editar
- **GAS-25.** El lápiz abre un modal con las validaciones de GAS-6 y GAS-7. No ofrece convertir un gasto a MSI. Si el registro no tiene tipo, hay que elegir uno para guardar.
- **GAS-26.** Doble clic edita fecha, descripción, cuenta, categoría, tipo o monto en la tabla. Las notas solo se editan en el modal.
  - **Texto, fecha y monto:** guardan con Enter o al salir del campo. Escape cancela.
  - **Listas:** guardan al elegir una opción. Salir del campo o Escape cancela.
  - **Error:** se muestra debajo de la tabla y la celda sigue en edición.
- **GAS-27.** Editar un gasto normal solo cambia ese registro.

### Cambios en compras a MSI
- **GAS-29.** Las mensualidades no se editan ni se eliminan. Su fila no ofrece lápiz, doble clic ni botón de eliminar, y al pasar el cursor indica que se cambian desde la compra original. El servidor también rechaza esos cambios.
- **GAS-30.** Editar el registro original, desde el modal o en la tabla, regenera todas sus mensualidades en la misma transacción, también las de meses pasados:
  - **Copian del original:** descripción, notas, cuenta, categoría y tipo (GAS-12).
  - **Se recalculan:** montos (GAS-13) y fechas (GAS-14), con el día de corte vigente de la cuenta.
- **GAS-31.** El número de meses es la cantidad de mensualidades que tenga el grupo y no se puede cambiar. Para cambiarlo, se elimina la compra y se crea de nuevo.
- **GAS-32.** Si la cuenta del original no tiene día de corte, la edición se rechaza con el mismo error de GAS-10 y no se guarda nada.

### Eliminar
- **GAS-28.** Eliminar pide confirmación. Un gasto normal borra solo ese registro. El registro original de MSI borra todo su grupo. Una mensualidad no se puede eliminar (GAS-29).

## Por decidir
Así funciona hoy, pero podría no ser lo que quieres. Cada punto queda igual hasta que decidas; al cambiarlo, se actualiza la regla y el código.

- **D-5. Mensaje inicial confuso (baja).** Sin ningún gasto, se muestra "No hay gastos que coincidan con tu búsqueda" en vez de "Aún no tienes gastos registrados". "Limpiar filtros" también aparece sin que hayas filtrado, porque el rango inicial cuenta como filtro.
- **D-6. Conteo de registros (baja).** El contador del inicio suma filas: una compra a 3 meses cuenta como 4 registros.
- **D-7. Fechas imposibles fuera del navegador (baja).** El selector de fecha no las permite, pero el servidor convierte `2026-02-31` en 3 de marzo en vez de rechazarla.
- **D-8. Errores sin mensaje propio (baja).** Editar o borrar un registro que ya no existe, o usar una cuenta borrada desde otra pestaña, muestra un error genérico.
- **D-9. Mensualidades de $0.00 (baja).** Si el total tiene menos centavos que meses, como $0.02 a 3 meses, alguna mensualidad vale $0.00 aunque GAS-2 pide montos mayores que 0. Recomiendo rechazar esa compra.
- **D-10. El original puede quedar fuera del mes que ves (baja).** Si una mensualidad cae en un mes distinto al de la compra, el original no aparece en ese mes y hay que ampliar el rango para editarlo. Recomiendo un enlace de la mensualidad a su original.
