import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { UserModule } from "./user/user.module";
import { CourseModule } from "./course/course.module";
import { AuthModule } from "./auth/auth.module";
import { ReviewModule } from "./review/review.module";
import { InstructorModule } from "./instructor/instructor.module";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { AdminDashboardModule } from "./admin-dashboard/admin-dashboard.module";
import { AppController } from "./app.controller";

@Module({

  imports: [
    DatabaseModule,
    UserModule,
    CourseModule,
    AuthModule,
    ReviewModule,
    InstructorModule,
    CloudinaryModule,
    AdminDashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
