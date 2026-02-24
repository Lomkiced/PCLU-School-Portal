import { Module } from '@nestjs/common';
import { TimetableService } from './timetable.service';
import { TimetableController } from './timetable.controller';
import { TimetableSolver } from './timetable.solver';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
    imports: [WebsocketModule],
    providers: [TimetableService, TimetableSolver],
    controllers: [TimetableController],
    exports: [TimetableService],
})
export class TimetableModule { }
