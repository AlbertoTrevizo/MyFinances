# MyFinances

App privada para registrar los gastos de un hogar, en pesos mexicanos. Usa Next.js 16, Prisma 6 y PostgreSQL en Supabase.

Lee `docs/constitution.md` antes de cambiar código. Si una petición la contradice, avisa antes de continuar.

## Flujo de trabajo
- Para cambiar comportamiento, primero propón el cambio en `docs/specs/<feature>/spec.md` y espera aprobación. Después implementa; spec y código van en el mismo commit.
- Si la funcionalidad no tiene spec, propón una antes de tocarla. Una spec en estado "Propuesta" todavía no manda sobre el código.
- Si encuentras una diferencia entre spec y código, avisa en vez de resolverla por tu cuenta.
- Antes de usar una API de Next.js, consulta `node_modules/next/dist/docs/`: esta versión difiere de lo que puedes recordar. Por ejemplo, `src/proxy.ts` reemplaza a `middleware`.
- Haz commit solo cuando te lo pidan.

## Comandos
- Desarrollo: `npm run dev`
- Lint: `npm run lint`
- Tipos: `npx tsc --noEmit`
- Checks: `find src -name '*.check.ts' -print0 | xargs -0 -n1 npx tsx`

Antes de dar un cambio por terminado, corre lint, tipos y checks.

## Base de datos
`.env` apunta a Supabase y desarrollo comparte la base con producción: trata sus datos como reales.
- Para cambiar el esquema, sigue `docs/migrations.md`.
- Nunca corras `prisma migrate dev`, `prisma migrate reset` ni `prisma db push`.
- Pide confirmación antes de correr cualquier otro `prisma migrate`, `prisma/seed.ts` o `scripts/create-admin.ts`.
- No muestres el contenido de `.env`.
- No subas a Prisma 7: exige driver adapters, una complejidad que esta app no necesita.

## Reglas del dominio
- **Acceso:** toda página y Server Action, salvo login, llama a `requireUser()` de `src/lib/session.ts`. `src/proxy.ts` es solo una primera capa.
- **Dinero:** convierte montos con `src/lib/currency.ts`.
- **Fechas:** se guardan a medianoche UTC y se muestran en UTC; el mes actual se calcula en hora de México. Usa `src/lib/date.ts`.
- **MSI (meses sin intereses):** una compra se guarda como un gasto original con `excludeFromTotals: true` más sus mensualidades, unidos por `msiGroupId`. Solo las mensualidades cuentan en los totales. Las mensualidades no se editan ni se borran: editar el original las regenera y borrarlo borra todo el grupo.
