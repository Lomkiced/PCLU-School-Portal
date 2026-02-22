import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentType } from '@sms/database';

@Injectable()
export class ContentService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        title: string;
        body: string;
        attachments?: string[];
        type: ContentType;
        subjectId: string;
        sectionId: string;
        publishedAt?: string;
    }) {
        return this.prisma.lMSContent.create({
            data: {
                title: data.title,
                body: data.body,
                attachments: data.attachments || [],
                type: data.type,
                subjectId: data.subjectId,
                sectionId: data.sectionId,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
            }
        });
    }

    async findAll(sectionId: string, subjectId: string) {
        return this.prisma.lMSContent.findMany({
            where: { sectionId, subjectId },
            orderBy: { id: 'desc' }
        });
    }

    async findOne(id: string) {
        return this.prisma.lMSContent.findUnique({ where: { id } });
    }

    async delete(id: string) {
        return this.prisma.lMSContent.delete({ where: { id } });
    }
}
