import { BadGatewayException, BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { User } from 'src/user/entities/user.entity';
import slugify from 'slugify';
import { sanitizeCourse } from 'src/utils/sanitize/sanitizeResponse';
import { Review } from 'src/review/entities/review.entity';
import { Instructor } from 'src/instructor/entities/instructor.entity';

@Injectable()
export class CourseService {

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Review) private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Course) private readonly courseRepository: Repository<Course>,
    @InjectRepository(Instructor) private readonly instructorRepository: Repository<Instructor>,
  ) {}

  async create(
    req: any,
    createCourseDto: CreateCourseDto,
    file: Express.Multer.File,
  ){
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOneBy({ id });
    if (!instructor || !instructor.isInstructor) throw new NotFoundException("instructor not found");

    const title = ['title'];
    const missingTitle = title.filter((field) => !(field in createCourseDto));
    if (missingTitle.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missingTitle.join(', ')}`);
    }

    const existingCourse = await this.courseRepository.findOneBy({
      title: createCourseDto.title,
    });
    if (existingCourse)
      throw new BadRequestException('There is one course with the same title');

    const newCourse = new Course();
    const requiredFields = [
      'title',
      'courseDescription',
      'courseLink',
      'prerequisites',
      'category',
      'skillLevel',
    ];

    const missingFields = requiredFields.filter(
      (field) => !(field in createCourseDto),
    );

    if (missingFields.length > 0) {
      throw new BadRequestException(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // newCourse.courseCreator = instructor;
    newCourse.slug = slugify(createCourseDto.title, '-');
    Object.assign(newCourse, createCourseDto);
    newCourse.isCertified = createCourseDto.isCertified === 'true';
    // instructor.coursesCount++;
    // await this.instructorRepo.save(instructor);
    if (file) {
      newCourse.thumbnails = (
        await this.cloudinaryService.uploadFile(file)
      ).secure_url;
    }
    return sanitizeCourse(await this.courseRepository.save(newCourse));
  }

  async enrollCourse(req: any, slug: string) {
    const { id } = req.user;
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['courses'],
    });
    if (!user) throw new NotFoundException("user not found")
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['courseCreator', 'reviews.reviewCreator'],
    });
    if (!course) throw new NotFoundException("course not found");
    const courseCreator = course.courseCreator;
    const instructor = await this.instructorRepository.findOneBy({
      id: courseCreator.id,
    });
    if (!instructor) throw new NotFoundException("instructor not found");;
    const isCourseEnrolled = user.courses.some(
      (enrolledCourse) => enrolledCourse.id === course.id,
    );
    if (isCourseEnrolled) {
      throw new BadRequestException(`You're already enrolled`);
    }
    user.courses.push(course);
    instructor.studentsCount++;
    course.numberOfStudents++;
    await this.userRepository.save(user);
    await this.instructorRepository.save(instructor);
    await this.courseRepository.save(course);
    return sanitizeCourse(course);
  }

  async unEnrollCourse(req: any, slug: string) {
    const { id } = req.user;
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['courses'],
    });
    if (!user) throw new NotFoundException("user not found");
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['courseCreator', 'reviews.reviewCreator'],
    });
    if (!course) throw new NotFoundException("course not found");
    const courseCreator = course.courseCreator.id;
    const instructor = await this.instructorRepository.findOneBy({
      id: courseCreator,
    });
    if (!instructor) throw new NotFoundException("instructor not found");;
    const isCourseEnrolled = user.courses.some(
      (enrolledCourse) => enrolledCourse.id === course.id,
    );
    if (!isCourseEnrolled) {
      throw new BadRequestException(`You're not enrolled`);
    }

    user.courses = user.courses.filter((course) => course.id !== course.id);
    if (instructor.studentsCount > 0) instructor.studentsCount--;
    if (course.numberOfStudents > 0) course.numberOfStudents--;
    await this.courseRepository.save(course);
    await this.instructorRepository.save(instructor);
    await this.userRepository.save(user);
    return sanitizeCourse(course);
  }

  async findInstructorCourses(req: any) {
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOne({
      where: { id },
      relations: ['courses.reviews.reviewCreator'],
    });
    if (!instructor) throw new NotFoundException("instructor not found");
    return instructor.courses;
  }

  async allCourseReviews(slug: string) {
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['reviews.reviewCreator'],
    });
    if (!course) throw new NotFoundException("course not found");

    return course.reviews;
  }

  async findAll(type: string){
    if (type == 'frontend' || type == 'backend' || type == 'fullStack') {
      return await this.courseRepository.find({
        where: { category: type },
        select: [
          'id',
          'language',
          'courseLink',
          'title',
          'thumbnails',
          'courseCreator',
        ],
      });
    } else if (!type) {
      return await this.courseRepository.find({
        select: [
          'id',
          'language',
          'courseLink',
          'title',
          'thumbnails',
          'courseCreator',
        ],
      });
    }
    throw new NotFoundException('Invalid category type');
  }

  async findOne(slug: string){
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['reviews', 'courseCreator'],
    });
    if (!course) throw new NotFoundException("course not found");
    const ratingReviews = course.reviews;
    return course;
  }

  async update(
    req: any,
    slug: string,
    updateCourseDto: UpdateCourseDto,
    file: Express.Multer.File,
  ){
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOneBy({ id });
    if (!instructor) throw new NotFoundException("instructor not found");;
    const course = await this.courseRepository.findOneBy({ slug });
    if (!course) throw new NotFoundException("user not found");
    Object.assign(course, updateCourseDto);
    if (file) {
      course.thumbnails = (
        await this.cloudinaryService.uploadFile(file)
      ).secure_url;
    }
    return await this.courseRepository.save(course);
  }

  async remove(req: any, slug: string) {
    const { id } = req.user;
    const course = await this.courseRepository.findOne({
      where: { slug },
      relations: ['reviews'],
    });
    if (!course) throw new NotFoundException("user not found");
    const instructor = await this.instructorRepository.findOne({
      where: { id },
      relations: ['courses.reviews'],
    });
    if (!instructor) throw new NotFoundException("instructor not found");;
    await this.reviewRepository.remove(course.reviews);
    await this.courseRepository.remove(course);
    return 'Course Removed';
  }

  async removeThumbnail(req: any, slug: string) {
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOneBy({ id });
    if (!instructor) throw new NotFoundException("instructor not found");;
    const course = await this.courseRepository.findOneBy({ slug });
    if (!course) throw new NotFoundException("course not found");
    course.thumbnails = null;
    return await this.courseRepository.save(course);
  }

}
