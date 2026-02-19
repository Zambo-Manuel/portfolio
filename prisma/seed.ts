// Seed script to create initial SUPER_ADMIN user
// Run with: npm run db:seed

import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });
}

async function main() {
    console.log("🌱 Starting database seed...");

    const username = process.env.INITIAL_ADMIN_USERNAME || "admin";
    const email = process.env.INITIAL_ADMIN_EMAIL || "admin@example.com";
    const password = process.env.INITIAL_ADMIN_PASSWORD || "ChangeMeNow123!";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
        where: {
            role: "SUPER_ADMIN",
        },
    });

    if (existingAdmin) {
        console.log("✅ SUPER_ADMIN already exists:", existingAdmin.username);
        return;
    }

    // Check if username is taken
    const existingUser = await prisma.user.findUnique({
        where: { username },
    });

    if (existingUser) {
        console.log("⚠️ Username already exists, skipping seed");
        return;
    }

    // Create SUPER_ADMIN
    const passwordHash = await hashPassword(password);

    const admin = await prisma.user.create({
        data: {
            username,
            email,
            displayName: "Super Admin",
            passwordHash,
            role: "SUPER_ADMIN",
            mustResetPassword: true,
        },
    });

    console.log("✅ SUPER_ADMIN created successfully!");
    console.log("   Username:", admin.username);
    console.log("   Email:", admin.email);
    console.log("   Password:", password);
    console.log("");
    console.log("⚠️  IMPORTANT: Change the password after first login!");

    // Create initial global notice (optional)
    const existingNotice = await prisma.globalNotice.findFirst();

    if (!existingNotice) {
        await prisma.globalNotice.create({
            data: {
                title: "Benvenuto nella Dashboard",
                message: "Questo è un avviso di esempio. Puoi configurarlo nelle impostazioni.",
                type: "INFO",
                active: false,
                displayMode: "BANNER",
                requiresAck: false,
                ackExpiryDays: 7,
            },
        });
        console.log("✅ Initial GlobalNotice created (inactive)");
    }

    console.log("");
    console.log("🎉 Seed completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
