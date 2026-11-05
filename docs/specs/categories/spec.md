# Spec: Categorías

**Estado:** Aprobada el 2026-11-04.
**Rutas:** `/categories`, `/categories/new`, `/categories/[id]/edit`

## Propósito
Administrar las etiquetas opcionales que agrupan los gastos y que pueden tener presupuesto propio.

## Datos

| Campo | Regla |
|---|---|
| `name` | Obligatorio y único. Se guarda sin espacios al inicio ni al final. |

## Reglas

### Acceso
- **CAT-1.** Las páginas y todas las acciones requieren una sesión de administrador. Sin ella, se redirige a `/login`.

### Listado
- **CAT-2.** La tabla muestra el nombre, con orden inicial ascendente. Es la única columna ordenable.
- **CAT-3.** Sin categorías, se muestra un mensaje en lugar de la tabla.

### Crear y editar
- **CAT-4.** Crear y editar usan páginas propias con el mismo formulario. Al guardar, se regresa a `/categories`. Si hay error, el formulario sigue abierto con el mensaje.
- **CAT-5.** Un nombre vacío o repetido se rechaza con un mensaje propio. La comparación es exacta: `Viaje` y `viaje` pueden coexistir.
- **CAT-6.** Editar una categoría inexistente muestra la página 404.
- **CAT-7.** La tabla no permite editar con doble clic, a diferencia de Cuentas.
- **CAT-8.** Cambiar el nombre se refleja en todos sus gastos y en su presupuesto.

### Relación con los gastos
- **CAT-9.** Un gasto puede no tener categoría. Se muestra como "Sin categoría" y, en el inicio, sus montos se agrupan bajo ese nombre.
- **CAT-10.** Las listas de categorías al capturar un gasto o agregar un presupuesto se ordenan de la más antigua a la más nueva.

### Eliminar
- **CAT-11.** Eliminar pide confirmación. Si la categoría tiene cualquier gasto, incluidos registros de MSI, no se borra y se muestra un error.
- **CAT-12.** Si no tiene gastos pero sí presupuesto, se borran ambos. La confirmación no lo avisa.

### Datos iniciales
- **CAT-13.** `prisma/seed.ts` crea las categorías iniciales solo si se ejecuta a mano. Al repetirlo, no duplica las existentes, pero vuelve a crear las que se borraron o renombraron.

## Por decidir
Así funciona hoy, pero podría no ser lo que quieres. Cada punto queda igual hasta que decidas; al cambiarlo, se actualiza la regla y el código.

- **D-1. Se borra un presupuesto sin avisar (media).** Ver CAT-12. Recomiendo mencionarlo en la confirmación.
- **D-2. El error de eliminar no se quita solo (media).** El mensaje vive en la URL (`?error=hasExpenses`) y sigue visible aunque después borres otra categoría con éxito. Recomiendo limpiarlo tras la siguiente acción.
- **D-3. Nombres casi iguales (baja).** `Viaje` y `viaje` cuentan como distintas, lo que permite duplicados por accidente. Recomiendo rechazarlas.
- **D-4. La regla de la base no coincide con la de la app (baja).** La base pondría `categoryId` en `null` al borrar una categoría, pero la app lo bloquea antes (CAT-11), así que ese caso nunca ocurre desde la app. Recomiendo decidir si quieres permitir borrar y dejar los gastos sin categoría.
- **D-5. Errores sin mensaje propio (baja).** Editar o borrar una categoría que ya no existe, por ejemplo desde otra pestaña, muestra un error genérico.
