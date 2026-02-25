import { IsString, IsNotEmpty, IsDateString, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsAfterDate } from '../../common/validators/is-after-date.validator';

export class CreateGradingPeriodDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsNumber()
    @Min(1)
    @Max(100)
    weight: number;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsNotEmpty()
    @IsAfterDate('startDate', { message: 'endDate must be after startDate' })
    endDate: string;

    @IsDateString()
    @IsNotEmpty()
    @IsAfterDate('endDate', { message: 'dueDate must be after endDate' })
    dueDate: string;
}

export class BulkCreateGradingPeriodsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateGradingPeriodDto)
    periods: CreateGradingPeriodDto[];
}
