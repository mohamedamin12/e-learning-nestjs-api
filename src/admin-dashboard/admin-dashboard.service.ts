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
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Course) private readonly courseRepository: Repository<Course>,
    @InjectRepository(Instructor)
    private readonly instructorRepository: Repository<Instructor>,
  ) {}

  async findAllActiveUsers() {
    const users = await this.userRepository.find({
      where: { active: true },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const userCount = users.length;
    return { activeUserCount: userCount, data: users };
  }

  async findAllInactiveUsers() {
    const users = await this.userRepository.find({
      where: { active: false },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const userCount = users.length;
    return { inactiveUserCount: userCount, data: users };
  }

  async findAllInactiveInstructors() {
    const instructors = await this.instructorRepository.find({
      where: { active: false },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const inactiveInstructorsCount = instructors.length;
    return {
      inactiveInstructorsCount,
      data: instructors,
    };
  }

  async findAllactiveInstructors() {
    const instructors = await this.instructorRepository.find({
      where: { active: true },
      select: ['id', 'fullName', 'username', 'active'],
    });
    const activeInstructorsCount = instructors.length;
    return {
      activeInstructorsCount,
      data: instructors,
    };
  }

  async deactiveUser(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException("user not found");
    user.active = false;
    await this.userRepository.save(user);
    return `user ${user.fullName} deactivated successfully ✔`;
  }

  async activeUser(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException("user not found");
    user.active = true;
    await this.userRepository.save(user);
    return `user ${user.fullName} activated successfully ✔`;
  }

  async deactiveInstructor(id: string) {
    const instructor = await this.instructorRepository.findOneBy({
      id,
    });
    if (!instructor) throw new NotFoundException("instructor not found");;

    instructor.active = false;
    await this.instructorRepository.save(instructor);
    return `Instructor ${instructor.fullName} deactivated successfully ✔`;
  }

  async activeInstructor(id: string) {
    const instructor = await this.instructorRepository.findOneBy({
      id,
    });
    if (!instructor) throw new NotFoundException("instructor not found");;
    instructor.active = true;
    await this.instructorRepository.save(instructor);
    return `Instructor ${instructor.fullName} activated successfully ✔`;
  }

  async removeCourse(id: string) {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: ['reviews'],
    });
    if (!course) throw new NotFoundException("course not found");;
    await this.reviewRepository.remove(course.reviews);
    return await this.courseRepository.remove(course);
  }

  async removeReview(id: string) {
    const review = await this.reviewRepository.findOne({where: { id }, relations: ['course'] });
    if (!review) {
      throw new NotFoundException("review not found");
    }
    const course = review.course;
    course.numberOfRatings--;
    await this.courseRepository.save(course);
    return await this.reviewRepository.delete(id);
  }
}