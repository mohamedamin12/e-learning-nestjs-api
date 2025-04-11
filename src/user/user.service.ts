import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { sanitizeUser } from 'src/utils/sanitize/sanitizeResponse';

@Injectable()
export class UserService {

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  
  async findAll() {
    return this.userRepository.find({
      where: { active: true },
      select: ['username', 'active', 'fullName'],
    }); 
  }

  async findUserCorses(req: any) {
    const { id } = req.user;
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['courses.reviews.reviewCreator'],
    });

    if (!user) throw new NotFoundException('user not found');
    const coursesWithReviews = user.courses.map((course) => {
      let hasReviewed = false;
      for (const review of course.reviews) {
        const reviewCreatorId = review.reviewCreator.id;
        if (user.id === reviewCreatorId) {
          hasReviewed = true;
          break;
        }
      }
      return {
        ...course,
        hasReviewed,
      };
    });
    return coursesWithReviews;
  }

  async update(
    req: any,
    updateUserDto: UpdateUserDto,
    file: Express.Multer.File,
  ): Promise<Partial<User>> {
    const { id } = req.user;
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('user not found');
    Object.assign(user, updateUserDto); //  target , source
    // if (file) {
    //   user.avatar = (await this.cloudinarySrv.uploadFile(file)).secure_url;
    // }
    return sanitizeUser(await this.userRepository.save(user));
  }

  async remove(req: any) {
    const { id } = req.user;
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('user not found');
    user.active = false;
    return this.userRepository.save(user);
  }

  async removeAvatar(req: any) {
    const { id } = req.user;
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('user not found');
    user.avatar = null;
    return await this.userRepository.save(user);
  }
}

