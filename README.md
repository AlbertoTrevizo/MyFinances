# Nuestras Finanzas

App para organizar los gastos personales, con montos en pesos mexicanos (MXN).

Cada gasto se registra con: cuenta, categoría, fecha, descripción y monto.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite (`prisma/dev.db`, no se sube al repo)

## Empezar

```bash
npm install
npx prisma migrate dev   # crea/actualiza la base de datos local
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

- `/accounts` — cuentas (efectivo, débito, crédito, etc.)
- `/categories` — categorías de gasto
- `/expenses` — gastos, cada uno ligado a una cuenta y una categoría

Al cambiar el esquema en `prisma/schema.prisma`, corre `npx prisma migrate dev --name <descripcion>`.
