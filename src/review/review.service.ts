import { BadGatewayException, BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Course } from 'src/course/entities/course.entity';
import { Review } from './entities/review.entity';
import { Instructor } from 'src/instructor/entities/instructor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ReviewService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Course) private readonly courseRepository: Repository<Course>,
    @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Instructor) private readonly instructorRepository: Repository<Instructor>,
  ) { }

  async create(
    req: any,
    slug: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    const { id } = req.user;
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) throw new NotFoundException("user not found")
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['courseCreator'],
    });
    if (!course) throw new NotFoundException("course not found");
    const courseCreator = course.courseCreator.id;
    const instructor = await this.instructorRepository.findOneBy({
      id: courseCreator,
    });
    if (!instructor) throw new NotFoundException("instructor not found");
    const reviews = new Review();
    reviews.reviewCreator = user;
    reviews.course = course;
    instructor.ratingsCount++;
    course.numberOfRatings++;
    Object.assign(reviews, createReviewDto);
    await this.courseRepository.save(course);
    await this.instructorRepository.save(instructor);
    return await this.reviewRepository.save(reviews);
  }

  async update(req: any, reviewId: number, updateReviewDto: UpdateReviewDto) {
    const { id } = req.user;
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException("user not found");
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['reviewCreator'],
    });
    if (!review) throw new NotFoundException("review not found");
    if (user.id != review.reviewCreator.id) throw new BadRequestException();
    Object.assign(review, updateReviewDto);
    return await this.reviewRepository.save(review);
  }

  async remove(req: any, slug: string, reviewId: number): Promise<Review> {
    const { id } = req.user;
    const course = await this.courseRepository.findOneBy({ slug });
    if (!course) throw new NotFoundException("course not found");

    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException("user not found")

    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['reviewCreator'],
    });
    if (!review) throw new NotFoundException("review not found")

    if (review.reviewCreator.id !== user.id) {
      throw new UnauthorizedException();
    }

    course.numberOfRatings--;
    await this.courseRepository.save(course);
    return await this.reviewRepository.remove(review);
  }

  async findInstructorCoursesReviews(username: string): Promise<any> {
    const instructor = await this.instructorRepository.findOne({
      where: { username },
      relations: ['courses', 'courses.reviews.reviewCreator'],
    });
    if (!instructor || !instructor.isInstructor) throw new NotFoundException("instructor not found");
    return instructor;
  }

}
