import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Course } from 'src/course/entities/course.entity';
import { Instructor } from 'src/instructor/entities/instructor.entity';
import { Review } from 'src/review/entities/review.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Course) private readonly courseRepo: Repository<Course>,
    @InjectRepository(Instructor)
    private readonly instructorRepo: Repository<Instructor>,
  ) {}

  async findAllActiveUsers(): Promise<{
    data: User[];
    activeUserCount: number;
  }> {
    const users = await this.userRepo.find({
      where: { active: true },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const userCount = users.length;
    return { activeUserCount: userCount, data: users };
  }

  async findAllInactiveUsers(): Promise<{
    data: User[];
    inactiveUserCount: number;
  }> {
    const users = await this.userRepo.find({
      where: { active: false },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const userCount = users.length;
    return { inactiveUserCount: userCount, data: users };
  }

  async findAllInactiveInstructors(): Promise<{
    data: Instructor[];
    inactiveInstructorsCount: number;
  }> {
    const instructors = await this.instructorRepo.find({
      where: { active: false },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const inactiveInstructorsCount = instructors.length;
    return {
      inactiveInstructorsCount,
      data: instructors,
    };
  }

  async findAllactiveInstructors(): Promise<{
    data: Instructor[];
    activeInstructorsCount: number;
  }> {
    const instructors = await this.instructorRepo.find({
      where: { active: true },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const activeInstructorsCount = instructors.length;
    return {
      activeInstructorsCount,
      data: instructors,
    };
  }

  async deactiveUser(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException("user not found");
    user.active = false;
    await this.userRepo.save(user);
    return `user ${user.fullName} deactivated successfully ✔`;
  }

  async activeUser(id: number) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException("user not found");
    user.active = true;
    await this.userRepo.save(user);
    return `user ${user.fullName} activated successfully ✔`;
  }

  async deactiveInstructor(id: number) {
    const instructor = await this.instructorRepo.findOneBy({
      id,
    });
    if (!instructor) throw new NotFoundException("instructor not found");;

    instructor.active = false;
    await this.instructorRepo.save(instructor);
    return `Instructor ${instructor.fullName} deactivated successfully ✔`;
  }

  async activeInstructor(id: number) {
    const instructor = await this.instructorRepo.findOneBy({
      id,
    });
    if (!instructor) throw new NotFoundException("instructor not found");;
    instructor.active = true;
    await this.instructorRepo.save(instructor);
    return `Instructor ${instructor.fullName} activated successfully ✔`;
  }

  async removeCourse(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['reviews'],
    });
    if (!course) throw new NotFoundException("course not found");;
    await this.reviewRepo.remove(course.reviews);
    return await this.courseRepo.remove(course);
  }

  async removeReview(id: number) {
    const review = await this.reviewRepo.findOne({where: { id }, relations: ['course'] });
    if (!review) {
      throw new NotFoundException("review not found");
    }
    const course = review.course;
    course.numberOfRatings--;
    await this.courseRepo.save(course);
    return await this.reviewRepo.delete(id);
  }
}