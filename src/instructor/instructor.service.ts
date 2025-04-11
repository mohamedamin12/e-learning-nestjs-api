import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { Instructor } from './entities/instructor.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Course } from 'src/course/entities/course.entity';
import { Repository } from 'typeorm';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { sanitizeInstructor } from 'src/utils/sanitize/sanitizeResponse';

@Injectable()
export class InstructorService {

  constructor(
    @InjectRepository(Instructor)
    private readonly instructorRepository: Repository<Instructor>,
    @InjectRepository(Course) readonly courseRepository: Repository<Course>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll() {
    return await this.instructorRepository.find({
      select: ['username', 'fullName', 'id'],
    });
  }

  async findOne(username: string) {
    const instructor = await this.instructorRepository.findOne({
      where: { username },
      relations: ['courses.reviews.reviewCreator'],
    });
    if (!instructor) throw new NotFoundException("instructor not found");
    return sanitizeInstructor(instructor);
  }

  async update(
    req: any,
    updateInstructorDto: UpdateInstructorDto,
    file: Express.Multer.File,
  ): Promise<Partial<Instructor>> {
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOneBy({ id });
    if (!instructor) throw new NotFoundException("instructor not found");
    Object.assign(instructor, updateInstructorDto);
    if (file) {
      instructor.avatar = (
        await this.cloudinaryService.uploadFile(file)
      ).secure_url;
    }
    return sanitizeInstructor(await this.instructorRepository.save(instructor));
  }


  async remove(req: any) {
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOne({
      where: { id },
      relations: ['courses.reviews.reviewCreator'],
      withDeleted: true,
    });
    if (!instructor) throw new NotFoundException("instructor not found");
    const course = await this.courseRepository.find({
      where: { courseCreator: instructor },
      relations: ['courseCreator'],
    });
    if (!course) throw new NotFoundException("course not found");

    await this.courseRepository.remove(instructor.courses);
    return await this.instructorRepository.remove(instructor);
  }


  async removeAvatar(req: any) {
    const { id } = req.user;
    const instructor = await this.instructorRepository.findOneBy({ id });
    if (!instructor) throw new NotFoundException("instructor not found");
    instructor.avatar = null;
    return await this.instructorRepository.save(instructor);
  }
}
