const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = ['project', 'certification', 'volunteering', 'award', 'language'];
    const results = {};

    for (const table of tables) {
        const total = await prisma[table].count();
        const published = table === 'language'
            ? await prisma[table].count({ where: { visible: true } })
            : await prisma[table].count({ where: { status: 'PUBLISHED' } });
        results[table] = { total, published };
    }

    console.log('--- DB STATS ---');
    console.log(JSON.stringify(results, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
