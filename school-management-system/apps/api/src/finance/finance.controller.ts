import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
    constructor(private readonly financeService: FinanceService) { }

    // --- FEE STRUCTURES ---

    @Roles('ADMIN')
    @Get('fee-structures')
    async getFeeStructures(@Query('academicYearId') academicYearId?: string) {
        return {
            success: true,
            data: await this.financeService.getFeeStructures(academicYearId)
        };
    }

    @Roles('ADMIN')
    @Post('fee-structures')
    async createFeeStructure(@Body() body: any) {
        return {
            success: true,
            data: await this.financeService.createFeeStructure(body)
        };
    }

    @Roles('ADMIN')
    @Put('fee-structures/:id')
    async updateFeeStructure(
        @Param('id') id: string,
        @Body() body: any
    ) {
        return {
            success: true,
            data: await this.financeService.updateFeeStructure(id, body),
            message: 'Fee structure updated successfully'
        };
    }

    @Roles('ADMIN')
    @Delete('fee-structures/:id')
    async deleteFeeStructure(@Param('id') id: string) {
        return {
            success: true,
            data: await this.financeService.deleteFeeStructure(id),
            message: 'Fee structure deleted successfully'
        };
    }

    // --- INVOICES ---

    @Roles('ADMIN', 'STUDENT', 'PARENT')
    @Get('invoices')
    async getInvoices(@Query('studentId') studentId?: string) {
        return {
            success: true,
            data: await this.financeService.getInvoices(studentId)
        };
    }

    @Roles('ADMIN')
    @Post('invoices/generate')
    async generateInvoice(@Body() body: { studentId: string, feeStructureId: string }) {
        return {
            success: true,
            data: await this.financeService.generateInvoice(body.studentId, body.feeStructureId),
            message: 'Invoice generated successfully'
        };
    }

    // --- PAYMENTS ---

    @Roles('ADMIN')
    @Get('payments')
    async getPayments() {
        return {
            success: true,
            data: await this.financeService.getPayments()
        };
    }

    @Roles('ADMIN')
    @Post('payments')
    async recordPayment(@Body() body: any) {
        return {
            success: true,
            data: await this.financeService.recordPayment(body),
            message: 'Payment recorded successfully'
        };
    }
}
