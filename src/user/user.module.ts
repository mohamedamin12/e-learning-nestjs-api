import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { Course } from 'src/course/entities/course.entity';
import { Instructor } from 'src/instructor/entities/instructor.entity';

@Module({
  imports: [
    CloudinaryModule,
    TypeOrmModule.forFeature([User , Course , Instructor]),
  ], 
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
