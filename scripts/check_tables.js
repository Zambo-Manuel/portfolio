require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const res = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    console.log('Tables in public schema:');
    console.log(res);
  } catch (e) {
    console.error('Error querying tables:', e.message || e);
  } finally {
    await prisma.$disconnect();
  }
})();
