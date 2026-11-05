# Spec: Presupuesto

**Estado:** Aprobada el 2026-11-04.
**Rutas:** `/budget` y los dos paneles de presupuesto en `/`

## Propósito
Definir cuánto se quiere gastar al mes, por tipo de gasto o por categoría, y comparar lo gastado contra ese límite.

## Datos

| Modelo | Campo | Regla |
|---|---|---|
| `Budget` | `type` | `needs`, `wants` o `savings`. Máximo un registro por tipo. |
| `Budget` | `amountCents` | Entero de 0 o más, en centavos. |
| `CategoryBudget` | `categoryId` | Máximo un registro por categoría. Se borra si se borra la categoría. |
| `CategoryBudget` | `amountCents` | Entero de 0 o más, en centavos. |

## Reglas

### Acceso
- **PRE-1.** La página y todas las acciones requieren una sesión de administrador. Sin ella, se redirige a `/login`.

### Montos
- **PRE-2.** Se aplican las reglas de formato de GAS-2 a GAS-4, con dos diferencias: `0` es válido y un campo vacío se guarda como 0.

### Presupuesto por tipo
- **PRE-3.** El formulario tiene un campo por cada tipo. Un tipo sin registro aparece vacío; uno guardado con 0 aparece como `0.00`.
- **PRE-4.** Guardar escribe los tres tipos en una sola transacción. Si un monto es inválido, no se guarda ninguno y se muestra un error.

### Presupuesto por categoría
- **PRE-5.** Es opcional: solo las categorías agregadas tienen presupuesto. La lista se ordena alfabéticamente.
- **PRE-6.** Agregar requiere elegir una categoría sin presupuesto. Si ya todas tienen, en lugar del formulario se muestra un aviso.
- **PRE-7.** Cada fila permite cambiar el monto y guardar, o quitar el presupuesto con confirmación. Quitarlo no afecta a la categoría ni a sus gastos.

### Paneles del inicio
- **PRE-8.** Un panel compara por tipo y otro por categoría, siempre contra el mes elegido en el inicio. Los dos son independientes: no se suman ni se validan entre sí.
- **PRE-9.** Lo gastado solo incluye gastos que cuentan en totales (GAS-15). Los registros originales de MSI quedan fuera y las mensualidades cuentan en el mes de su fecha.
- **PRE-10.** Un gasto sin tipo no cuenta en el panel por tipo, y uno sin categoría no cuenta en el panel por categoría. El tipo "Ahorro" se trata como cualquier otro gasto.
- **PRE-11.** Solo se muestran presupuestos mayores que 0. Si no queda ninguno, el panel muestra un aviso.
- **PRE-12.** Cada fila muestra el porcentaje redondeado, una barra limitada al 100 %, "gastado de presupuesto" y la cantidad restante o excedida.
- **PRE-13.** Solo se marca como excedido si lo gastado es mayor que el presupuesto. Si son iguales, se muestra $0.00 restante.

### Vigencia
- **PRE-14.** El presupuesto es un único monto vigente, sin historial: cualquier mes se compara contra el valor actual.

## Por decidir
Así funciona hoy, pero podría no ser lo que quieres. Cada punto queda igual hasta que decidas; al cambiarlo, se actualiza la regla y el código.

- **D-1. Los meses pasados cambian al editar el presupuesto (media).** Por PRE-14, subir un presupuesto hoy también cambia cómo se ve cualquier mes anterior. Recomiendo dejarlo así hasta que necesites historial, porque agregarlo complica el modelo.
- **D-2. Se puede agregar una categoría con $0 sin querer (baja).** El monto no es obligatorio al agregar. La categoría sale de la lista de disponibles y no aparece en el inicio (PRE-11). Recomiendo exigir un monto mayor que 0.
- **D-3. El orden en el inicio no está definido (baja).** El panel por categoría no pide un orden a la base, así que las filas y sus colores podrían cambiar de lugar. Recomiendo ordenarlas alfabéticamente, igual que en `/budget`.
