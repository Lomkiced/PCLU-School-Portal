import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { TimetableSolver } from './timetable.solver';

@Module({
    providers: [TimetableService, TimetableSolver],
    controllers: [TimetableController],
    exports: [TimetableService],
})
export class TimetableModule { }
