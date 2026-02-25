import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsDate, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementPriority, AnnouncementStatus, Role } from '@sms/database';

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsEnum(AnnouncementPriority)
    @IsOptional()
    priority?: AnnouncementPriority;

    @IsEnum(AnnouncementStatus)
    @IsOptional()
    status?: AnnouncementStatus;

    @IsArray()
    @IsEnum(Role, { each: true })
    @IsOptional()
    targetRoles?: Role[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    targetGradeLevels?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    targetSections?: string[];

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    publishedAt?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expiresAt?: Date;
}
