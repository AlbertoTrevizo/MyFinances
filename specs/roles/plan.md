# Plan: Roles

**Estado:** Aprobado el 2026-11-24. Implementa `specs/roles/spec.md`.

## Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Rol en la base | Enum de Prisma `Role { user admin }` y columna `User.role Role @default(user)` | La base rechaza cualquier otro valor, y agregar un rol después es un `ALTER TYPE`. Una tabla de roles sobra mientras los permisos no se configuren. |
| `isAdmin` | Solo `scripts/create-admin.ts` sigue escribiéndolo hasta la segunda entrega, que borra la columna; ningún otro código lo lee ni lo escribe | Un administrador creado entre migración y despliegue también funciona con el código viejo. `docs/migrations.md` pide hacer en dos entregas los cambios que quitan columnas. |
| Autorización | `requireAdmin()` decide con `role` y redirige a `/` | Hoy redirige a `/users`, que ahora sería un ciclo. |
| Cambiar rol | Server Action nueva `setUserRole` con una transacción `Serializable`, igual que `deleteUser` | Da la misma garantía del último administrador ante cambios simultáneos (RNF-3). |
| Proxy | Sin cambios | Es solo una primera capa; la protección real es `requireAdmin()` (RNF-1). |
| Tests | `*.check.ts` y un script `npm test` | El principio 4 de la constitución. Sin framework ni dependencias nuevas. |
| Check de acceso | `src/app/access.check.ts` analiza `src/app` con el compilador de TypeScript, que ya está instalado | Evita que una página o acción nueva olvide la verificación (RNF-1, RNF-5). Una expresión regular sería frágil. |
| Dependencias npm | Ninguna | El principio 1 queda cumplido sin agregar runtime. |

## Datos
Una migración que solo agrega. Se genera según `docs/migrations.md` y se le añade el `UPDATE` a mano:

```sql
CREATE TYPE "Role" AS ENUM ('user', 'admin');
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user';
-- ROL-6
UPDATE "User" SET "role" = 'admin' WHERE "isAdmin" = true;
```

No crea tablas, así que no necesita RLS nueva. Tampoco borra ni transforma datos existentes, así que no necesita respaldo.

## Código

**Nuevo en `src/lib`, sin React y con check (principio 4):**
- `roles.ts`:
  - `ROLES = ["user", "admin"] as const` y `type Role`. Debe coincidir con el enum de Prisma; `tsc` lo verifica al pasarlo a Prisma.
  - `parseRole(value: unknown): Role | null`.
  - `isAdmin(user: { role: Role }): boolean`.
  - `removesLastAdmin(targetRole: Role, adminCount: number): boolean`, que usan eliminar y cambiar rol.
  - `roleChangeError({ targetConfirmed, from, to, adminCount }): "lastAdmin" | "pendingAdmin" | null`.
- `roles.check.ts`: cubre cada rama, incluidos los valores inválidos de `parseRole`, quitar el rol al único administrador, quitarlo cuando hay dos y promover una cuenta Pendiente.

**Nuevo check de acceso, sin base de datos:** `src/app/access.check.ts`
- Cada `page.tsx`, cada función exportada de un archivo `"use server"` y cada función con una directiva `"use server"` propia dentro de cualquier archivo de `src/app` debe llamar con `await` a `requireUser()` o `requireAdmin()`. Bajo `src/app/users/` debe ser `requireAdmin()`.
- Exentas: las rutas públicas de `AGENTS.md` (`login`, `register`, `confirm-email`, `forgot-password`, `reset-password`, `api/auth/google`) y `complete-profile`, que verifica la sesión a mano porque `requireUser()` la redirigiría a sí misma.
- Cualquier `route.ts`, `route.tsx`, `route.js` o `route.jsx` fuera de `api/auth/google` hace fallar el check, para obligar a decidir su acceso.
- Al fallar, imprime archivo y función y sale con código distinto de 0.

**Cambios:**
- `prisma/schema.prisma`: enum `Role` y `User.role`.
- `src/lib/session.ts`: `requireAdmin()` usa `isAdmin(user)` y redirige a `/`.
- `src/app/users/page.tsx`: llama a `requireAdmin()` en lugar de `requireUser()`; selecciona `role`; agrega `"role"` a `SORT_FIELDS`; quita `canManage`.
- `src/app/users/actions.ts`:
  - `deleteUser` cuenta con `role: "admin"` y usa `removesLastAdmin`.
  - Nueva `setUserRole(id, _prev, formData)`. Hace `requireAdmin()` y `parseRole`, y luego una transacción `Serializable`: busca la cuenta, cuenta administradores, aplica `roleChangeError` y actualiza. Responde a `P2034` con `conflict` y a `P2025` con `notFound`. Registra `logEvent("user_role_changed", { userId, by, from, to })` solo si hubo cambio. Si el administrador se quitó el rol a sí mismo, hace `redirect("/")`; si no, `revalidatePath("/users")`.
- `src/components/UsersTable.tsx`: columna Rol ordenable. Acción por fila "Cambiar rol": abre un `Modal` con un `<select>` de roles y un botón de confirmar, y muestra el error del servidor. Sin `canManage`, porque la página ya es solo para administradores.
- `src/components/Sidebar.tsx` y `src/app/layout.tsx`: una prop `isAdmin`; el enlace a Usuarios solo aparece si es verdadera.
- `scripts/create-admin.ts`: escribe `role: "admin"` e `isAdmin: true` al crear y actualizar hasta la segunda entrega; ningún otro código lee ni escribe la columna antigua.
- `src/i18n/dictionaries/es.ts`, `en.ts` y `src/i18n/types.ts`: `users.tableRole`, `users.roles.{user,admin}`, `users.changeRole`, `users.changeRoleTitle`, `users.roleLabel` y `users.errors.{lastAdminRole,pendingAdmin}`.
- `package.json`: `"test": "find src -name '*.check.ts' -print0 | xargs -0 -n1 tsx"`.
- `AGENTS.md`: los checks se corren con `npm test`. La regla de acceso dice que ver y administrar usuarios y roles llama a `requireAdmin()`.
- `specs/users/spec.md`: en "Usuarios", el usuario confirmado ya no consulta la tabla. RF-14 y RF-17 apuntan a ROL-2 y ROL-5. HU-5 pasa a ser del administrador. Se quita "roles" de "Fuera de alcance".

**Reutilizado:** `Modal`, `SortableHeader`, `sortUsers`, `resolveSort`, `logEvent`, `prismaCode` y el patrón de errores de `DeleteButton`.

## Etapas
1. **Base.** Esquema, migración (sin aplicarla), `roles.ts` con su check, `requireAdmin()`, `create-admin.ts` y `npm test`.
2. **Acceso.** `/users` solo para administradores, Sidebar y `access.check.ts`.
3. **Cambiar rol.** `setUserRole`, columna y modal, textos y `deleteUser` con `role`.
4. **Documentos.** `specs/users/spec.md` y `AGENTS.md`.

Lint, tipos y `npm test` pasan al cerrar cada etapa.

## Orden de despliegue
Según `docs/migrations.md`, por ser un cambio que agrega:
1. Verificar con una consulta de solo lectura qué cuentas tienen hoy `isAdmin`, y que la tuya está entre ellas (ROL-6).
2. Aplicar la migración, con tu confirmación explícita.
3. Desplegar el código.
4. **Segunda entrega, más adelante:** cuando el código desplegado ya no use `isAdmin`, otra migración la borra.

## Segunda entrega: borrar `isAdmin`
**Estado:** Aprobada el 2026-11-24.

Es un cambio que quita una columna, así que va en dos pasos según `docs/migrations.md`: primero el código que ya no la conoce y después la migración.

**Código, un solo commit:**
- `prisma/schema.prisma`: se quita `isAdmin`. El cliente de Prisma deja de leerla; la columna sigue en la base con su `DEFAULT false`, así que crear cuentas sigue funcionando.
- `scripts/create-admin.ts`: deja de escribir `isAdmin` y se quita el comentario.
- `prisma/migrations/<fecha>_drop_user_is_admin/migration.sql`, escrita a mano:
  ```sql
  ALTER TABLE "User" DROP COLUMN "isAdmin";
  ```
- `specs/roles/spec.md`: se quita "Borrar la columna `isAdmin`" de "Fuera de alcance".

**Orden en producción:**
1. Consulta de solo lectura: `SELECT count(*) FROM "User" WHERE "isAdmin" AND "role" <> 'admin'` debe dar 0. Si no, hay un administrador que perdería el acceso y se detiene todo.
2. Desplegar el código (`dev` → `main`) y comprobar que producción funciona.
3. Respaldo con `pg_dump` en `~/Backups/MyFinances/`, porque la migración borra datos.
4. `npx prisma migrate deploy`, con tu confirmación explícita.
5. `migrate status` sin pendientes y `migrate diff` sin diferencias.

**Riesgo:** los despliegues viejos de Vercel, de producción o de vista previa, sí leen `isAdmin` y fallarán al entrar después del paso 4. Solo se abren con su URL propia, detrás del SSO de Vercel.

**Verificación:** lint, tipos, `npm test` y que `git grep isAdmin` solo encuentre migraciones aplicadas, specs y la función `isAdmin()` de `roles.ts`, que lee `role`.

## Riesgos y límites conocidos
- **Ventana entre migración y despliegue:** el código viejo todavía decide con `isAdmin`. Hasta la segunda entrega, `scripts/create-admin.ts` sigue escribiendo `isAdmin: true` además de `role: "admin"`, tanto al crear como al actualizar, para que un administrador creado en esa ventana también funcione con el código viejo. Ningún otro código de esta entrega lee ni escribe la columna antigua.
- **`Serializable` a través del pooler de Supabase:** ya se usa en `deleteUser`. Se vuelve a probar con dos cambios de rol simultáneos.
- **El check de acceso es estático:** confirma que la llamada existe, no que esté antes de leer datos. La revisión de código cubre el orden.

## Verificación
- Lint, tipos y `npm test` en cada etapa.
- Romper a propósito una llamada a `requireAdmin()` hace fallar `access.check.ts`. Se restaura después.
- De punta a punta contra un PostgreSQL desechable, nunca contra Supabase:
  - Un `user` abre `/users` y llama directamente a `updateUser`, `deleteUser` y `setUserRole`, y es rechazado.
  - Un administrador cambia roles.
  - Se intenta quitar el rol al último administrador y promover una cuenta Pendiente.
  - Dos cambios de rol simultáneos dejan siempre al menos un administrador.
- Revisión de código y de tests por el líder del proyecto antes de dar la entrega por buena.
