require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, username: true, email: true, role: true } });
    console.log('Users:', users);
  } catch (e) {
    console.error('Error listing users:', e.message || e);
  } finally {
    await prisma.$disconnect();
  }
})();
