import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Migrating ENROLLED to ACTIVE...');
    const result = await prisma.studentProfile.updateMany({
        where: {
            enrollmentStatus: 'ENROLLED' as any
        },
        data: {
            enrollmentStatus: 'ACTIVE' as any
        }
    });

    // Also migrate pending if there are any
    const pResult = await prisma.studentProfile.updateMany({
        where: { enrollmentStatus: 'PENDING' as any },
        data: { enrollmentStatus: 'ACTIVE' as any }
    });

    console.log(`Updated ${result.count} ENROLLED records and ${pResult.count} PENDING to ACTIVE.`);
    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
