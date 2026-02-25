import { IsString, IsNotEmpty, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { IsAfterDate } from '../../common/validators/is-after-date.validator';

export class CreateAcademicYearDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    @IsAfterDate('startDate', { message: 'endDate must be after startDate' })
    endDate: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
