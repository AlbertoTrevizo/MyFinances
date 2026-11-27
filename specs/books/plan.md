# Plan: Libros

**Estado:** Aprobado el 2026-11-26. Implementa `specs/books/spec.md`.

## Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Dueño | Columna `Book.ownerId`, no un rol en la tabla de miembros | La base garantiza exactamente un dueño por libro sin índices parciales, que Prisma 6 no modela y `migrate diff` querría borrar. Con `onDelete: Restrict`, la base impide borrar a un dueño sin resolver antes sus libros (LIB-17). |
| Miembros | `BookMember` con `role BookRole` (`editor`, `viewer`) | El dueño nunca está en esta tabla. Así no hay un segundo dueño posible. |
| Pertenencia | `bookId` obligatorio en `Account`, `Category`, `Expense` y `Budget`. `CategoryBudget` lo hereda de su categoría. | Es el mínimo que permite filtrar todo por libro (LIB-1). |
| Integridad entre libros | `@@unique([id, bookId])` en `Account`, `Category` y `Expense`. `Expense` referencia `[accountId, bookId]` y `[categoryId, bookId]`. | La base rechaza un gasto con una cuenta o categoría de otro libro (RNF-3). Además, `where: { id_bookId: { id, bookId } }` sirve para `findUnique`, `update` y `delete` acotados al libro. |
| Unicidad | `@@unique([bookId, name])` en `Account` y `Category`, y `@@unique([bookId, type])` en `Budget`. Se quitan los `@unique` globales. | LIB-2. |
| Libro activo | `User.activeBookId`, opcional, con `onDelete: SetNull` | Se recuerda entre dispositivos (LIB-4). La membresía se verifica en cada petición y nunca se confía en esta columna sola. |
| Invitaciones | Tabla `BookInvitation` con `tokenHash`, `bookId`, `role`, `email?` y `expiresAt` | Es el patrón de `UserToken`, que no sirve aquí porque exige un `userId`. Con `email` nulo, la invitación es por enlace. Quien invita siempre es el dueño, así que no se guarda. |
| Enlace | `/invitations?token=<64 hex>` | Usa el mismo formato que los demás enlaces, así que `sendAccountEmail` solo gana un `kind`. |
| Volver a la invitación tras iniciar sesión | `src/proxy.ts` guarda la ruta de la invitación en la cookie httpOnly `invitation_return`, de 1 día. Al iniciar sesión, con contraseña, con Google o tras completar el perfil, se lee, se borra y se redirige ahí solo si cumple `^/invitations\?token=[0-9a-f]{64}$`. | Funciona aunque la persona se registre y confirme antes de entrar. La expresión estricta impide una redirección abierta. |
| Guardas | `requireBook()` y `requireBookWriter()` en `src/lib/session.ts`. La resolución del libro activo usa `cache` de React. | Así `access.check.ts` las reconoce como reconoce a `requireUser()`. |
| Rechazo de Lectura | `requireBookWriter()` hace `redirect("/")` | Un miembro con Lectura no ve los botones (LIB-3), así que solo llega aquí si llama a la acción directamente. Es el mismo trato que `requireAdmin()`. |
| Libro al registrarse | `user.create` anida `ownedBooks: { create: { name } }` en `register/actions.ts` y en el callback de Google | LIB-5. Además, el resolver crea uno si la persona no tiene ninguno, lo que cubre las cuentas creadas por el código viejo durante el despliegue. |
| Tests | `src/lib/book-rules.check.ts`, `access.check.ts` ampliado y un nuevo `src/app/book-scope.check.ts` | RNF-7. Sin framework ni dependencias. |
| Dependencias npm | Ninguna | Principio 1. |

## Datos

### Esquema (`prisma/schema.prisma`)
```prisma
enum BookRole {
  editor
  viewer
}

model Book {
  id          String           @id @default(cuid())
  name        String
  ownerId     String
  owner       User             @relation("OwnedBooks", fields: [ownerId], references: [id], onDelete: Restrict)
  createdAt   DateTime         @default(now())
  members     BookMember[]
  invitations BookInvitation[]
  accounts    Account[]
  categories  Category[]
  expenses    Expense[]
  budgets     Budget[]
  activeFor   User[]           @relation("ActiveBook")

  @@index([ownerId])
}

model BookMember {
  id        String   @id @default(cuid())
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      BookRole
  createdAt DateTime @default(now())

  @@unique([bookId, userId])
  @@index([userId])
}

model BookInvitation {
  id        String   @id @default(cuid())
  tokenHash String   @unique
  bookId    String
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  role      BookRole
  email     String?
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([bookId])
}
```
- **`User`:** `activeBookId String?` con `activeBook Book? @relation("ActiveBook", ..., onDelete: SetNull)`, `ownedBooks Book[] @relation("OwnedBooks")` y `memberships BookMember[]`.
- **`Account` y `Category`:** `bookId` con relación a `Book` (`onDelete: Cascade`), `@@unique([bookId, name])` y `@@unique([id, bookId])`. Se quita `@unique` de `name`.
- **`Budget`:** `bookId` con `onDelete: Cascade` y `@@unique([bookId, type])`. Se quita `@unique` de `type`.
- **`Expense`:** `bookId` con relación a `Book` (`onDelete: Cascade`) y `@@unique([id, bookId])`.
  - La cuenta: `account Account @relation(fields: [accountId, bookId], references: [id, bookId], onDelete: NoAction)`.
  - La categoría: `category Category? @relation(fields: [categoryId, bookId], references: [id, bookId], onDelete: NoAction)`.
  - `NoAction` se revisa al final de la sentencia. Así, borrar un `Book` en cascada no choca con el orden de borrado. Borrar una cuenta o categoría con gastos sigue rechazándose, como ya hace la app (CUE-14, CAT-11).
- **`CategoryBudget`:** sin cambios.

### Migración `<fecha>_add_books`
Se genera con `migrate diff` según `docs/migrations.md` y se edita a mano en este orden, dentro del mismo archivo:
1. Enum, las tres tablas nuevas, `User.activeBookId` y `ENABLE ROW LEVEL SECURITY` en `Book`, `BookMember` y `BookInvitation`.
2. Un libro "Mi libro" por cada usuario: `INSERT INTO "Book" (id, name, "ownerId") SELECT gen_random_uuid()::text, 'Mi libro', id FROM "User"`.
3. `bookId` se agrega como opcional en las cuatro tablas de finanzas. Un `UPDATE` asigna a todas las filas el libro del dueño del proyecto, que es el administrador más antiguo: `SELECT id FROM "User" WHERE role = 'admin' ORDER BY "createdAt" LIMIT 1`.
4. `SET NOT NULL`, llaves foráneas e índices nuevos. Se borran `Account_name_key`, `Category_name_key` y `Budget_type_key`.
5. `UPDATE "User" SET "activeBookId" = <su libro>` para todos.

Si hay datos de finanzas y ningún administrador, el paso 4 falla y la migración no se aplica a medias. Es el comportamiento deseado. Al terminar, `migrate diff` contra el esquema debe salir vacío.

## Código

### `src/lib/book-rules.ts` (puro, con check)
- `type BookAccess = "owner" | "editor" | "viewer"`.
- `canWrite(access)` y `canManage(access)`. Solo el dueño administra.
- `parseMemberRole(value: unknown): "editor" | "viewer" | null`. Rechaza `owner` y cualquier otro valor (LIB-11).
- `validateBookName(raw): { name } | { error: "required" | "tooLong" }`. Quita espacios y acepta hasta 100 caracteres (LIB-7).
- `pickActiveBook(rememberedId, books: { id, access, joinedAt }[]): string | null`. Aplica LIB-4: el recordado si sigue en la lista; si no, el propio más antiguo; si no, aquel en el que entró primero. Sin libros devuelve `null`.
- `pickNewOwner(members: { userId, role, createdAt }[]): string | null`. Elige al `editor` más antiguo y nunca a un `viewer` (LIB-17).
- `invitationDecision({ invitation, now, userEmail, access }): "invalid" | "wrongAccount" | "alreadyMember" | "accept"`. `invitation` puede ser nula o estar vencida. La comparación de correos no distingue mayúsculas (LIB-14, LIB-15).
- `invitationReturnPath(value: string | undefined): string | null`.

### `src/lib/session.ts`
- `resolveBook(user)`, con `cache`:
  - Lee los libros propios y las membresías, y aplica `pickActiveBook`.
  - Si no hay ninguno, crea "Mi libro" con el idioma de la interfaz (LIB-5).
  - Si el elegido difiere de `activeBookId`, lo guarda.
  - Devuelve `{ book: { id, name }, access, books }`, que también usa la barra lateral.
- `requireBook()` es `requireUser()` seguido de `resolveBook()`, y devuelve `{ user, book, access }`.
- `requireBookWriter()` es `requireBook()` y, si `!canWrite(access)`, hace `redirect("/")`.
- `takeInvitationReturn()` lee y borra la cookie `invitation_return` y devuelve `invitationReturnPath(...) ?? "/"`. La usan el inicio de sesión, el callback de Google y `complete-profile` en lugar de `"/"`.

### `src/lib/book-data.ts` (Prisma, sin React)
- `deleteBook(tx, bookId)`. Borra el libro, y la cascada borra el resto. Sirve para LIB-9 y LIB-17.
- `resolveOwnedBooks(tx, userId)`. Recorre cada libro del usuario: con `pickNewOwner`, lo transfiere al elegido, borra su fila de `BookMember` y anula las invitaciones del libro; sin elegido, llama a `deleteBook`. Registra `book_transferred` o `book_deleted`.

### Finanzas: cada consulta lleva `bookId`
- **Páginas** (`/`, `/expenses`, `/accounts`, `/categories`, `/budget`) llaman a `requireBook()` y filtran todo por `book.id`. Eso incluye conteos, agregados, el selector de meses y las listas de cuentas y categorías.
- **`/accounts/new`, `/categories/new` y las páginas `[id]/edit`** llaman a `requireBookWriter()`. Las de edición buscan con `id_bookId`, y si no encuentran, `notFound()`.
- **Acciones de `accounts`, `categories`, `expenses` y `budget`:** todas llaman a `requireBookWriter()`.
  - `create` agrega `bookId`.
  - `update` y `delete` usan `where: { id_bookId: { id, bookId } }`. P2025 se trata como no existe.
  - `deleteMany` y `count` incluyen `bookId`, también el borrado del grupo MSI por `msiGroupId` en `deleteExpense` y en `applyExpenseChanges`.
  - `Budget.upsert` usa `bookId_type`.
  - `CategoryBudget` primero verifica la categoría con `category.findUnique({ where: { id_bookId } })` y filtra con `where: { categoryId, category: { bookId } }`.
- **Gastos con una cuenta o categoría de otro libro:** `createExpense` y `applyExpenseChanges` atrapan P2003 y responden con el nuevo `t.expenses.errors.invalidReference` (LIB-1). La validación de MSI ya busca la cuenta, y ahora la busca con `id_bookId`.
- **Lectura:** cada página calcula `canEdit = canWrite(access)` y lo pasa a `ExpensesTable`, `AccountsTable`, la tabla de categorías, `NewExpenseButton`, el formulario de presupuesto y `CategoryBudgetManager`. Sin `canEdit` no se muestran crear, editar, eliminar ni el doble clic (LIB-3).

### Libros e invitaciones (nuevo)
- **`src/app/books/page.tsx`:** lista ordenada por nombre con rol, número de miembros y el activo marcado, más el formulario para crear (LIB-6, LIB-7).
- **`src/app/books/[id]/page.tsx`:** `requireUser()`. Si la persona no es miembro, `notFound()`, aunque sea `admin`.
  - Para cualquier miembro: miembros con nombre, correo y rol, y "Salir" si no es dueño.
  - Para el dueño, además: renombrar, eliminar con su confirmación, cambiar el rol de cada miembro, quitarlo, el formulario de invitar por correo, el botón "Generar enlace" y las invitaciones pendientes con su tipo, rol, vencimiento y "Anular" (LIB-8 a LIB-16).
- **`src/app/books/actions.ts`:** `createBook`, `renameBook`, `deleteBook`, `setActiveBook`, `setMemberRole`, `removeMember`, `leaveBook`, `inviteByEmail`, `createInviteLink` y `revokeInvitation`.
  - Todas llaman a `requireUser()` y vuelven a leer en el servidor que la persona sea dueña o miembro, según la acción.
  - Las que cambian membresía o borran usan una transacción `Serializable`, con P2034 respondido como `conflict` (RNF-2).
  - Las que cambian lo que se ve hacen `revalidatePath("/", "layout")`. Antes, consulta en `node_modules/next/dist/docs/` la firma vigente de `revalidatePath`.
  - `inviteByEmail` sigue este orden:
    1. Valida con `normalizeEmail` y el validador de RF-3, y rechaza un correo que ya sea de un miembro.
    2. Con `withEmailSlot`, crea la invitación nueva y envía `sendAccountEmail("invitation", ...)`.
    3. Si sale, borra las invitaciones anteriores de ese correo en el libro. Si no sale, borra la nueva y responde `limited` o `failed` (LIB-15).
  - `createInviteLink` devuelve la URL completa una sola vez, armada con `appUrl()`.
- **`src/app/invitations/page.tsx`:** `requireUser()`, después `invitationDecision`.
  - Muestra no válido, para otra cuenta, ya eres miembro (con el botón "Ir al libro", que usa `setActiveBook`) o los detalles: libro, nombre del dueño, permiso y el botón "Unirme al libro".
  - Con `invalid` no muestra nada del libro.
- **`src/app/invitations/actions.ts`, `acceptInvitation(token)`:** `requireUser()` y una transacción.
  1. Busca la invitación y repite `invitationDecision`.
  2. Hace `deleteMany` de la invitación. Un conteo de 0 significa que otra persona la gastó, y se responde `invalid`.
  3. Crea el `BookMember`, fija `activeBookId`, borra la cookie `invitation_return` y redirige a `/`.
  - Un P2002 por `@@unique([bookId, userId])` se trata como `alreadyMember`.
- **`src/proxy.ts`:** para `pathname === "/invitations"` con un `token` que cumpla el patrón, guarda la cookie `invitation_return` en la respuesta, tanto en la redirección a `/login` como en `next()`.
- **`src/lib/account-emails.ts`:** `kind` `"invitation"` con la ruta `/invitations`. El correo lleva solo textos del diccionario y el enlace, sin el nombre del libro ni de quien invita, por la regla que ya tiene el archivo.
- **`src/components/Sidebar.tsx` y `src/app/layout.tsx`:**
  - El layout, con usuario válido, llama a `resolveBook(user)` y pasa a la barra el libro activo y la lista.
  - La barra muestra un `<select>` con el estilo de selects de la marca, que llama a `setActiveBook` y después a `router.refresh()`.
  - Se agrega el enlace "Libros" a `/books`.

### Cuentas de usuario
- **`register/actions.ts` y `api/auth/google/callback/route.ts`:** `user.create` anida `ownedBooks: { create: { name: t.books.defaultName } }`.
- **`users/actions.ts`, `deleteUser`:** dentro de su transacción `Serializable` existente, antes de `tx.user.delete`, llama a `resolveOwnedBooks(tx, id)`.
- **`UsersTable`:** el texto de confirmación de eliminar avisa lo de LIB-17.

### Textos (`es.ts`, `en.ts`, `types.ts`)
- `nav.books`.
- `books.*`: títulos, formularios, roles `owner`, `editor` y `viewer`, confirmaciones, errores (`required`, `tooLong`, `alreadyMember`, `conflict`, `limited`, `failed`, `notFound`), `defaultName` ("Mi libro" y "My book") y los estados de la invitación.
- `emails.invitation`.
- `expenses.errors.invalidReference`.
- El aviso de LIB-17 en `users`.

### Se elimina
`prisma/seed.ts` (LIB-19).

### Documentos, en el mismo commit
- **`specs/expenses/spec.md` (GAS-1), `specs/accounts/spec.md` (CUE-1, CUE-7, CUE-15), `specs/categories/spec.md` (CAT-1, CAT-5, CAT-13) y `specs/budget/spec.md` (PRE-1):** apuntan a LIB-1 a LIB-3 y LIB-19.
- **`specs/users/spec.md`:** RF-1 y RF-17 apuntan a LIB-3 y LIB-17. Se quitan "Datos por usuario" e "invitaciones" de "Fuera de alcance".
- **`specs/roles/spec.md`:** se quita "tener datos por usuario" de "Fuera de alcance".
- **`AGENTS.md`:** en Acceso, las páginas de finanzas llaman a `requireBook()` y sus acciones a `requireBookWriter()`. En Base de datos, se quita la mención a `prisma/seed.ts`. Se agrega la regla de dominio "Libros: toda consulta de finanzas filtra por `bookId`".

## Tests

| Check | Qué cubre |
|---|---|
| `src/lib/book-rules.check.ts` | Cada rama de cada función, con estos casos mínimos: permisos de los tres roles; `parseMemberRole("owner")` da `null`; nombre vacío, solo espacios, 100 y 101 caracteres; libro recordado válido, recordado ajeno, sin propios y sin ninguno; nuevo dueño con dos editores (gana el más antiguo), solo lectores y sin miembros; invitación nula, vencida, para otro correo, mismo correo con otras mayúsculas, por enlace, ya miembro y dueño que abre su enlace; ruta de regreso válida, token corto, mayúsculas, `//evil.com`, parámetros extra y `undefined`. |
| `src/app/access.check.ts` (ampliado) | En `page.tsx`, `expenses/`, `accounts/`, `categories/` y `budget/`, las páginas llaman con `await` a `requireBook()` o `requireBookWriter()`, y `new` y `[id]/edit` a `requireBookWriter()`. Todas las acciones `"use server"` de esas carpetas llaman a `requireBookWriter()`. Lo demás sigue igual. |
| `src/app/book-scope.check.ts` (nuevo) | Recorre `src/app` y `src/lib` con el compilador de TypeScript. Toda llamada `<x>.<modelo>.<método>(...)` con modelo `expense`, `account`, `category`, `budget` o `categoryBudget` debe mencionar `bookId` en sus argumentos. Se exime una llamada con el comentario `// book-scope: <motivo>` en la línea anterior. Al fallar, imprime archivo y línea. |

**Pruebas de mutación** (Codex las hace y las revierte):
- En una acción de gastos, cambiar `requireBookWriter()` por `requireBook()` hace fallar `access.check.ts`.
- Quitar `bookId` de un `findMany` de `/expenses` hace fallar `book-scope.check.ts`.
- Cambiar `pickNewOwner` para que acepte un `viewer` hace fallar `book-rules.check.ts`.
- Quitar la comparación sin mayúsculas de `invitationDecision` hace fallar `book-rules.check.ts`.
- Aflojar el patrón de `invitationReturnPath` hace fallar `book-rules.check.ts`.

## Etapas
1. **Datos.** Esquema, migración sin aplicar, `book-rules.ts` con su check y `prisma generate`.
2. **Aislamiento.** Guardas en `session.ts`, todas las páginas y acciones de finanzas con `bookId`, `canEdit` en la UI, `access.check.ts` y `book-scope.check.ts`.
3. **Libros.** `/books`, `/books/[id]`, sus acciones, el selector en la barra y el libro al registrarse.
4. **Invitaciones.** Correo, enlace, `/invitations`, la cookie de regreso y el proxy.
5. **Cuentas eliminadas y limpieza.** `resolveOwnedBooks` en `deleteUser`, el aviso, borrar `seed.ts`, textos y documentos.

Lint, tipos y `npm test` pasan al cerrar cada etapa.

## Verificación
- **Codex:** lint, tipos, `npm test` y las pruebas de mutación. `npm test` usa `node --import tsx` por la limitación de su sandbox.
- **Claude:**
  - Revisa el diff contra la spec, en especial que ninguna consulta escape del libro.
  - Corre lint, tipos y `npm test`.
- **Migración en una base desechable, nunca en Supabase:**
  1. Restaurar el respaldo más reciente de `~/Backups/MyFinances/` en `docker run postgres:17`.
  2. Correr `migrate deploy` ahí.
  3. Comparar conteos: tu libro tiene los mismos gastos, cuentas, categorías y presupuestos que había, y las demás cuentas tienen libros vacíos.
  4. `migrate diff` sale vacío.
- **De punta a punta contra esa base, con `npm run dev` apuntando a ella:**
  - Dos cuentas.
  - Invitación por correo y por enlace, con cada permiso.
  - Un miembro con Lectura llama directamente a una acción.
  - Un id de otro libro en la URL.
  - Cambiar el permiso, quitar a un miembro, salir y eliminar un libro.
  - Eliminar la cuenta del dueño con un editor y con solo lectores.
  - Dos aceptaciones simultáneas del mismo enlace.

## Orden de despliegue
1. **Respaldo nuevo** con `pg_dump` en `~/Backups/MyFinances/`, porque la migración transforma datos.
2. **Consulta de solo lectura:** el administrador más antiguo es tu cuenta. Si no lo es, se detiene todo y se ajusta el paso 3 de la migración.
3. **`npx prisma migrate deploy`**, con tu confirmación explícita.
4. **`migrate status` y `migrate diff`** sin pendientes ni diferencias.
5. **Desplegar** `dev`, comprobar la vista previa y después `main`. La vista previa usa la misma base, así que ya debe correr el código nuevo.

**Ventana entre los pasos 3 y 5:** el código viejo puede leer, pero no crear gastos, cuentas ni categorías, porque falta `bookId`. Evita capturar durante esos minutos. Las cuentas creadas en la ventana reciben su libro al entrar por primera vez (LIB-5).

## Riesgos y límites conocidos
- **Dos peticiones simultáneas de alguien sin libros** pueden crearle dos "Mi libro" vacíos. Es inofensivo: puede borrar uno.
- **`book-scope.check.ts` es estático:** confirma que `bookId` aparece en la consulta, no que venga del libro verificado. La revisión de código cubre el origen.
- **La barra lateral puede mostrar el nombre anterior** hasta la siguiente navegación completa, si a alguien lo quitan del libro activo mientras lo tiene abierto. Su siguiente acción ya usa otro libro (LIB-4).
- **Los despliegues viejos de vista previa** fallan al escribir después de la migración. Solo se abren detrás del SSO de Vercel.
