import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@sms/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    @Roles('ADMIN')
    @Post('fee-structures')
    async createFeeStructure(@Body() body: any) {
        return {
            success: true,
            data: await this.financeService.createFeeStructure(body)
        };
    }

    @Roles('ADMIN')
    @Post('bulk-assign')
    async bulkAssignFees(@Body() body: any) {
        return {
            success: true,
            data: await this.financeService.bulkAssignFees(body),
            message: 'Fees assigned successfully'
        };
    }

    @Roles('ADMIN', 'STUDENT', 'PARENT')
    @Get('students/:id')
    async getStudentLedger(@Param('id') studentId: string) {
        return {
            success: true,
            data: await this.financeService.getStudentLedger(studentId)
        };
    }

    @Roles('ADMIN')
    @Post('fees/:feeId/payments')
    async recordPayment(
        @Param('feeId') feeId: string,
        @Body() body: any
    ) {
        return {
            success: true,
            data: await this.financeService.recordPayment(feeId, body),
            message: 'Payment recorded successfully'
        };
    }

    @Roles('ADMIN')
    @Get('reports/collection')
    async getCollectionSummary(
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string
    ) {
        return {
            success: true,
            data: await this.financeService.getCollectionSummary(startDate, endDate)
        };
    }
}
