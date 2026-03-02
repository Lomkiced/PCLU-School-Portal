import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- ACADEMIC YEARS ---');
    const years = await prisma.academicYear.findMany({
        orderBy: { startDate: 'desc' }
    });
    console.log(JSON.stringify(years, null, 2));
}

main().finally(() => prisma.$disconnect());
