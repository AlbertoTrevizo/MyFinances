# Our Finances

An app to organize personal expenses, with amounts in Mexican pesos (MXN). Available in Spanish and English (switch in the top nav bar).

Each expense is recorded with: account, category, date, description, and amount.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + SQLite (`prisma/dev.db`, not committed to the repo)

## Getting started

```bash
npm install
npx prisma migrate dev   # creates/updates the local database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `/accounts` — accounts (cash, debit, credit, etc.)
- `/categories` — expense categories
- `/expenses` — expenses, each linked to an account and a category

The UI language (Spanish/English) is stored in a cookie and can be changed from the nav bar; strings live in `src/i18n/dictionaries`.

When you change the schema in `prisma/schema.prisma`, run `npx prisma migrate dev --name <description>`.
