import { Module } from '@nestjs/common';
import { LmsService } from './lms.service';
import { LmsController } from './lms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ContentModule } from './content/content.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ActivitiesModule } from './activities/activities.module';

@Module({
    imports: [PrismaModule, ContentModule, QuizzesModule, ActivitiesModule],
    controllers: [LmsController],
    providers: [LmsService],
    exports: [LmsService],
})
export class LmsModule { }
