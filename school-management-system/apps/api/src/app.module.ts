import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ParentsModule } from './parents/parents.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { DepartmentsModule } from './departments/departments.module';
import { GradeLevelsModule } from './grade-levels/grade-levels.module';
import { SectionsModule } from './sections/sections.module';
import { RoomsModule } from './rooms/rooms.module';
import { SubjectsModule } from './subjects/subjects.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { TimetableModule } from './timetable/timetable.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradesModule } from './grades/grades.module';
import { ContentModule } from './lms/content/content.module';
import { QuizzesModule } from './lms/quizzes/quizzes.module';
import { ActivitiesModule } from './lms/activities/activities.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { MessagesModule } from './messages/messages.module';
import { FinanceModule } from './finance/finance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { AiGradingModule } from './ai-grading/ai-grading.module';
import { IdGeneratorModule } from './id-generator/id-generator.module';
import { CredentialsModule } from './credentials/credentials.module';
import { WebsocketModule } from './websocket/websocket.module';

import { LmsModule } from './lms/lms.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, StudentsModule, TeachersModule, ParentsModule, AcademicYearsModule, DepartmentsModule, GradeLevelsModule, SectionsModule, RoomsModule, SubjectsModule, EnrollmentsModule, TimetableModule, AttendanceModule, GradesModule, AnnouncementsModule, MessagesModule, FinanceModule, NotificationsModule, FileUploadModule, AiGradingModule, IdGeneratorModule, CredentialsModule, WebsocketModule, LmsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
