import { randomBytes } from "crypto";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

function generatePassword(): string {
  return randomBytes(18).toString("base64url");
}

async function main() {
  const email = process.argv[2] ?? process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("Usage: tsx scripts/create-admin.ts <email>");
    process.exitCode = 1;
    return;
  }

  const password = generatePassword();
  const { hash, salt } = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, passwordSalt: salt, isAdmin: true },
    create: { email, passwordHash: hash, passwordSalt: salt, isAdmin: true },
  });

  console.log(`Admin user ready: ${user.email}`);
  console.log(`Password: ${password}`);
  console.log(
    "Save this password now — it will not be shown again. Re-run this script with the same email to reset it."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
