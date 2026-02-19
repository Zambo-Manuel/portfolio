const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = ['project', 'certification', 'volunteering', 'award', 'language'];
    console.log('--- DATABASE REPORT ---');

    for (const table of tables) {
        try {
            const records = await prisma[table].findMany();
            const stats = {};
            records.forEach(r => {
                const s = r.status || (r.visible ? 'VISIBLE' : 'HIDDEN');
                stats[s] = (stats[s] || 0) + 1;
            });
            console.log(`${table.toUpperCase()}: total=${records.length}`, stats);
        } catch (e) {
            console.log(`${table.toUpperCase()}: Error ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
