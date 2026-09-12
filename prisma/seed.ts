import { prisma } from "../src/lib/prisma";

const accounts = [
  { name: "NU - Beto", type: "Débito" },
  { name: "INVEX - Beto", type: "Débito" },
  { name: "Debito - Beto", type: "Débito" },
  { name: "BBVA - Beto", type: "Débito" },
];

const categories = [
  "Mandado",
  "Gasolina",
  "Almacenamiento",
  "Farmacias",
  "Uñas",
  "Festival",
  "Restaurante",
  "Alcohol",
  "Servicios",
  "Viaje",
  "Gustitos",
  "Inversión",
  "Suscripciones",
  "Impuestos",
];

async function main() {
  for (const account of accounts) {
    await prisma.account.upsert({
      where: { name: account.name },
      update: { type: account.type },
      create: account,
    });
  }

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`Seeded ${accounts.length} accounts and ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
