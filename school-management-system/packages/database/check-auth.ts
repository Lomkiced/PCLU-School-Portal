import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function check() {
    const user = await prisma.user.findUnique({ where: { email: 'admin@school.edu' } });
    if (!user) {
        console.log('User not found!');
        return;
    }
    console.log('User found:', user.email);
    console.log('Role:', user.role);
    const isValid = await bcrypt.compare('admin123', user.passwordHash);
    console.log('admin123 is valid?', isValid);
}

check().finally(() => prisma.$disconnect());
