const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tables = ['project', 'certification', 'volunteering', 'award', 'language'];
    console.log('--- DB DETAILS ---');

    for (const table of tables) {
        try {
            const records = await prisma[table].findMany();
            console.log(`${table.toUpperCase()}:`);
            records.forEach(r => {
                if (table === 'project') console.log(`  - TITLE: ${r.title}, SLUG: ${r.slug}, STATUS: ${r.status}`);
                else if (table === 'language') console.log(`  - NAME: ${r.name}, VISIBLE: ${r.visible}`);
                else console.log(`  - TITLE: ${r.title || r.org}, STATUS: ${r.status}`);
            });
        } catch (e) {
            console.log(`${table.toUpperCase()}: Error ${e.message}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
