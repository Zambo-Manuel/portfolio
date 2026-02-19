const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const models = ['project', 'certification', 'volunteering', 'award', 'language', 'auditLog'];
    console.log('--- DB INVESTIGATION ---');

    for (const model of models) {
        try {
            const all = await prisma[model].findMany({ take: 10 });
            console.log(`${model.toUpperCase()} (first 10):`, all.length);
            if (all.length > 0) {
                all.forEach(x => {
                    if (model === 'language') console.log(`  - ${x.name}: visible=${x.visible}`);
                    else if (model === 'auditLog') console.log(`  - ${x.action} ${x.entityType} ${x.entityId}`);
                    else console.log(`  - ${x.title || x.org}: status=${x.status}`);
                });
            }
        } catch (e) {
            console.error(`Error querying ${model}:`, e.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
