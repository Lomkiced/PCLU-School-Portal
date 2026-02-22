import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPasswords() {
    const passwords: Record<string, string> = {
        'admin@school.edu': 'admin123',
    };

    // Also fix all teacher and student passwords
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true, role: true } });

    for (const user of allUsers) {
        let plainPassword: string;
        if (user.role === 'ADMIN') plainPassword = 'admin123';
        else if (user.role === 'TEACHER') plainPassword = 'teacher123';
        else plainPassword = 'student123';

        const hash = bcrypt.hashSync(plainPassword, 10);

        // Verify immediately
        const verified = bcrypt.compareSync(plainPassword, hash);
        if (!verified) {
            console.error(`CRITICAL: bcrypt self-check failed for ${user.email}`);
            process.exit(1);
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hash },
        });

        console.log(`✅ ${user.email} (${user.role}) — password: ${plainPassword} — hash verified`);
    }

    console.log(`\nDone! Updated ${allUsers.length} users.`);
}

fixPasswords()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
