import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                studentProfile: true,
                teacherProfile: true,
                parentProfile: true,
                adminProfile: true,
            },
        });
        if (!user) throw new NotFoundException('User not found');
        const { passwordHash, ...result } = user;
        return result;
    }

    async changePassword(userId: string, currentPass: string, newPass: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const isValid = await bcrypt.compare(currentPass, user.passwordHash);
        if (!isValid) throw new BadRequestException('Invalid current password');

        const hashedPassword = await bcrypt.hash(newPass, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword, isFirstLogin: false },
        });

        return { success: true };
    }

    async updateFcmToken(userId: string, token: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { fcmToken: token },
        });
        return { success: true };
    }
}
