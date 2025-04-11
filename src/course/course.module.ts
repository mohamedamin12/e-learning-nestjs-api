import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Course } from './entities/course.entity';
import { UserService } from 'src/user/user.service';
import { Instructor } from 'src/instructor/entities/instructor.entity';
import { Review } from 'src/review/entities/review.entity';

@Module({
  imports:[
    CloudinaryModule,
    TypeOrmModule.forFeature([User, Instructor, Course, Review]),
  ],
  controllers: [CourseController],
  providers: [CourseService , UserService],
})
export class CourseModule {}
