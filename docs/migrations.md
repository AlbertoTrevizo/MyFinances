# Migraciones de base de datos

**Estado:** Aprobada el 2026-11-04. `migrate status` y `migrate diff` se probaron contra la base real el 2026-11-04: 2 migraciones aplicadas, sin pendientes ni diferencias. `migrate deploy` aún no se ha probado.

## Situación actual
- **Hay una sola base.** `.env` apunta a Supabase y el commit `9c739ca` indica que desarrollo usa la misma base que producción. Trátala como producción: `npm run dev` lee y escribe esos mismos datos.
- **Nada aplica migraciones solo.** `npm run build` no las ejecuta y el repo no tiene CI. Se aplican a mano.

## Comandos prohibidos
Mientras exista una sola base, no se usan:

| Comando | Riesgo |
|---|---|
| `prisma migrate dev` | Puede ofrecer borrar toda la base si detecta diferencias con el historial. |
| `prisma migrate reset` | Borra todos los datos. |
| `prisma db push` | Cambia el esquema sin dejar historial y puede perder datos. |

## Proceso
1. **Confirma el punto de partida.** Este comando solo lee y debe indicar que no hay migraciones pendientes:
   ```bash
   npx prisma migrate status
   ```
2. **Cambia `prisma/schema.prisma`.**
3. **Genera el SQL.** Este comando solo lee la base y no le aplica nada:
   ```bash
   name=$(date -u +%Y%m%d%H%M%S)_descripcion_corta
   mkdir prisma/migrations/$name
   npx prisma migrate diff \
     --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma \
     --script -o prisma/migrations/$name/migration.sql
   ```
4. **Revisa el SQL a mano.**
   - Cada tabla nueva lleva `ALTER TABLE "Tabla" ENABLE ROW LEVEL SECURITY;`. Prisma no lo genera.
   - Busca `DROP`, cambios de tipo y `NOT NULL` sin valor por defecto. Pueden perder datos o fallar.
5. **Respalda si borra o transforma datos.** Usa los respaldos de Supabase o `pg_dump`, y confirma que el respaldo existe antes de seguir.
6. **Aplica, con confirmación explícita del dueño del proyecto.** Este comando solo aplica migraciones pendientes y no borra la base por su cuenta:
   ```bash
   npx prisma migrate deploy
   ```
7. **Verifica y actualiza el cliente.**
   ```bash
   npx prisma migrate status
   npx prisma generate
   ```
8. **Haz commit** de la migración junto con el esquema, la spec y el código.

## Orden respecto al despliegue
Como la migración no se aplica al desplegar, el orden evita que la app en producción falle:
- **Cambios que agregan** (tabla o columna opcional): primero la migración y después el código.
- **Cambios que quitan o renombran:** se hacen en dos entregas. Primero se despliega código que ya no use lo viejo y después se migra para quitarlo. Un renombre se hace agregando el campo nuevo, copiando los datos y quitando el viejo al final.

## Si una migración falla
No vuelvas a ejecutar nada ni edites una migración que ya se aplicó. Prisma bloquea nuevas migraciones hasta resolver la fallida:
1. Revisa con `npx prisma migrate status` qué falló y qué cambios llegaron a aplicarse en la base.
2. Corrige la base; si hubo pérdida de datos, restaura el respaldo.
3. Registra el resultado con `npx prisma migrate resolve --rolled-back <nombre>` o `--applied <nombre>`.
