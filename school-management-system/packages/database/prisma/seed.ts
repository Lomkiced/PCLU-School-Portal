import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function getHash(password: string) {
    return bcrypt.hashSync(password, 10);
}

async function main() {
    console.log('Clearing old data...');
    // We'll let prisma db push --force-reset handle the schema drop,
    // so here we just seed the required minimum to login.

    const adminPass = getHash('admin123');

    console.log('Creating Admin...');
    await prisma.user.create({
        data: {
            email: 'admin@school.edu',
            passwordHash: adminPass,
            role: Role.ADMIN,
            isFirstLogin: false,
            adminProfile: {
                create: {
                    firstName: 'System',
                    lastName: 'Administrator',
                    position: 'Principal',
                }
            }
        }
    });

    console.log('Seeding complete! Only Admin user created so you can test manual input.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
