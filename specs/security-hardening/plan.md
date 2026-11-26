# Plan: Endurecimiento de seguridad (auditoría del 2026-11-25)

**Estado:** Aprobado el 2026-11-25. Implementa S1–S12, aprobadas en `specs/users/spec.md`, `specs/roles/spec.md` (S8) y `specs/expenses/spec.md` (S10).

Sin SQL crudo (constitución, punto 5): las carreras se cierran con escrituras condicionales de Prisma (`updateMany` con la condición en el `where` y revisión de `count`) o con transacciones `Serializable` y reintento, como ya hace `src/app/users/actions.ts`.

## Cambios por regla
| Regla | Archivo | Cambio |
|---|---|---|
| S1 | `src/app/register/actions.ts` | El reemplazo de una cuenta Pendiente usa `updateMany({ where: { id, emailVerifiedAt: null } })`. Si `count` es 0, no crea enlace y sigue el camino de cuenta Confirmada (aviso de cuenta existente). |
| S7 | `prisma/schema.prisma`, migración, `register/actions.ts`, `confirm-email/{page,ConfirmForm,actions}.tsx` | Columna nueva `User.passwordReplaced Boolean @default(false)`. El reemplazo de S1 la pone en `true`. La confirmación muestra campos de contraseña nueva si está en `true`, valida con `validateNewPassword` y guarda la contraseña y `passwordReplaced: false` en la misma transacción que confirma. Restablecer la contraseña y el Pendiente confirmado por Google también la ponen en `false`. |
| S2 | `src/app/login/actions.ts`, `src/lib/session.ts` | Después de verificar, el login abre una transacción: `updateMany({ where: { id, passwordHash: <hash verificado> } })` (pone a 0 los intentos fallidos). Si `count` es 0, la contraseña cambió y responde credenciales inválidas. Si no, crea la sesión en esa misma transacción. `createSession` acepta un cliente de transacción opcional. Ese `updateMany` bloquea la fila del usuario, así que un restablecimiento simultáneo espera y después borra la sesión nueva, o el login ve el hash nuevo. |
| S3 | `src/app/login/actions.ts`, `src/lib/login-attempts.ts` | Antes de verificar, el login reserva el intento con una comparación atómica: `updateMany({ where: { id, failedLoginAttempts: n, OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }] }, data: { failedLoginAttempts: n + 1, lockedUntil: n + 1 >= 5 ? now + 15 min : undefined } })`. Si `count` es 0, relee y reintenta pocas veces; si queda bloqueada, sigue el camino de bloqueada (verificación señuelo). La contraseña solo se verifica si hubo reserva. Si es correcta, S2 deja los intentos en 0 y quita el bloqueo. La decisión pura se queda en `login-attempts.ts`, con su check. |
| S4, S11 | `src/lib/email.ts`, `src/lib/account-flows.ts`, `src/lib/account-emails.ts`, `forgot-password`, `register`, `confirm-email` | Se separa en dos pasos: `reserveEmailSlot(recipient)` inserta el registro y revisa los dos límites (3 por dirección y 50 en total por hora). Si alguno se pasa, borra su registro y devuelve `limited`. Después se envía con lo ya reservado. Los que llaman reservan **antes** de `createToken`; si sale `limited`, no rotan el enlace y responden igual que hoy. Si el envío falla, liberan el registro como hoy. Al superar el límite total se registra un evento (`email_global_limit`). |
| S5 | `src/app/reset-password/actions.ts`, `src/app/confirm-email/actions.ts` | El restablecimiento borra todos los enlaces del usuario, no solo los de recuperación. Al confirmar un cambio de correo se borran sus enlaces de recuperación y de confirmación. |
| S6 | `src/app/api/auth/google/callback/route.ts`, diccionarios | Se lee `hd` del perfil. Google es la autoridad si el dominio del correo es `gmail.com` o `googlemail.com`, o si `hd` coincide con el dominio. Si no, se redirige a `/login` con el error nuevo `google_not_authoritative`, sin crear, unir ni confirmar nada. La decisión es una función pura en `src/lib` con su check. |
| S8 | `scripts/create-admin.ts` | Agrega `userToken.deleteMany({ where: { userId } })` junto al borrado de sesiones. |
| S9 | `src/lib/user-tokens.ts` y los que lo llaman | `createToken` corre dentro de una transacción `Serializable` y reintenta ante `P2034`. Así dos pedidos simultáneos no dejan dos enlaces del mismo tipo. |
| S10 | `src/app/expenses/actions.ts` | `applyExpenseChanges` hace sus lecturas (original, cuenta y número de mensualidades) y la regeneración dentro de una transacción `Serializable`. Ante un conflicto (`P2034`) devuelve un error claro de "se editó a la vez, intenta de nuevo", con un texto nuevo en los diccionarios. |
| S12 | `src/app/reset-password/actions.ts` | Revisa el enlace con `findToken` antes de calcular el hash de la contraseña. Lo consume dentro de la transacción como hoy. La regla de Vercel Firewall la configura el dueño y no es código. |

## Migración
Solo una columna nueva, sin riesgo para los datos:

```sql
ALTER TABLE "User" ADD COLUMN "passwordReplaced" BOOLEAN NOT NULL DEFAULT false;
```

Codex escribe el archivo de migración a mano y no corre ningún comando de Prisma contra la base. El dueño la aplica con `npx prisma migrate deploy`, con su confirmación explícita, **antes** de desplegar el código: el código nuevo lee esa columna.

## Verificación
- Lint, tipos y `npm test`.
- Checks nuevos, con prueba de mutación en cada uno:
  - La decisión de autoridad de Google (S6).
  - La reserva de intentos de login (S3).
  - El orden de reservar el envío antes de rotar el enlace (S4).
- Las carreras (S1, S2, S3, S9 y S10) no se pueden probar sin una base desechable. Se revisan en el diff y quedan anotadas para probarlas cuando exista una base de pruebas.
- El check de `access.check.ts` debe seguir pasando.
- En el navegador: registro, confirmación (con y sin contraseña reemplazada), login, olvidé mi contraseña y entrar con Google con un correo que no es de Gmail. Se prueba sin escribir en la base, interceptando las acciones.
