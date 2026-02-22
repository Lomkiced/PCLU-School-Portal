import { z } from 'zod';

export const RoleEnum = z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']);
export type Role = z.infer<typeof RoleEnum>;

// We'll expand these schemas closely matching Prisma later
export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    role: RoleEnum,
    fcmToken: z.string().nullable().optional(),
    profilePicture: z.string().nullable().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
