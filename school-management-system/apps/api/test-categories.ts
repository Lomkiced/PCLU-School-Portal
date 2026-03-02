import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING EXISTING CATEGORIES ---');
    const categories = await prisma.gradeCategory.findMany();
    console.log(categories);
}

main().finally(() => prisma.$disconnect());
