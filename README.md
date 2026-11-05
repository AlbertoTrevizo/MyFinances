# Our Finances

An app to organize personal expenses, with amounts in Mexican pesos (MXN). Available in Spanish and English (switch in the top nav bar).

Each expense is recorded with: account, category, date, description, and amount.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL on Supabase

## Getting started

`.env` needs `DATABASE_URL` and `DIRECT_URL`. Development shares its database with production, so anything you do locally changes real data.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `/accounts` — accounts (cash, debit, credit, etc.)
- `/categories` — expense categories
- `/expenses` — expenses, each linked to an account and a category

The UI language (Spanish/English) is stored in a cookie and can be changed from the nav bar; strings live in `src/i18n/dictionaries`.

To change the schema, follow `docs/migrations.md`. Do not run `prisma migrate dev`, `prisma migrate reset`, or `prisma db push`.

Expected behavior is defined in `docs/specs/<feature>/spec.md`, under the rules in `docs/constitution.md`.
