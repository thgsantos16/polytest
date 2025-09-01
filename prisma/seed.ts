import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // This file ensures Prisma Client is generated
  // You can add actual seed data here later if needed

  console.log("✅ Database seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Database seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
