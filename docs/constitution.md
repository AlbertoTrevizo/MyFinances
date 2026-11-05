# Constitución de MyFinances

1. **Stack mínimo.** Next.js, TypeScript, Tailwind y Prisma, con Server Actions y sin `route.ts`. Toda dependencia nueva de runtime se justifica en su spec.
2. **La spec es la fuente de verdad.** `docs/specs/<feature>/spec.md` define el comportamiento: todo cambio se aprueba primero en la spec, y spec y código cambian en el mismo commit; si difieren, manda la spec.
3. **Lógica separada de la UI.** Las reglas y los cálculos de negocio viven en `src/lib`, sin React; `src/components` y los archivos `"use client"` no importan Prisma.
4. **Tests sin framework.** Toda función pura con ramas en `src/lib` tiene al lado un `*.check.ts` que corre con `npx tsx`; todos pasan antes de cada commit.
5. **Persistencia.** PostgreSQL solo vía Prisma, sin SQL crudo en la app; el esquema cambia solo con migraciones versionadas; el dinero es `Int` en centavos; toda tabla nueva activa RLS en su migración.
6. **Idioma.** Código, comentarios, commits y nombres de archivos y carpetas en inglés; el contenido de `docs/` en español; todo texto visible al usuario sale de `src/i18n/dictionaries` (es y en), nunca literal.

El código existente se ajusta cuando se toca; una funcionalidad sin spec la recibe antes de su primer cambio.
