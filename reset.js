const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin1234!", 10);

  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      passwordHash: password,
      role: "SUPER_ADMIN"
    },
    create: {
      username: "admin",
      email: "admin@admin.com",
      displayName: "Admin",
      passwordHash: password,
      role: "SUPER_ADMIN"
    }
  });

  console.log("Admin creato/aggiornato:", user.username);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());