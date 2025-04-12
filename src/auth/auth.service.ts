import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { comparePasswords } from './bcrypt/bcrypt';
import * as crypto from 'crypto';
import { SignInDto } from './dto/signin.dto';
import { sendEmail } from 'src/utils/sendEmail';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Instructor } from 'src/instructor/entities/instructor.entity';
import { CreateInstructorDto } from 'src/instructor/dto/create-instructor.dto';

@Injectable()
export class AuthService {

  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Instructor) private readonly instructorRepo: Repository<Instructor>,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async userSignup(
    createUserDto: CreateUserDto,
    file: Express.Multer.File,
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser)
      throw new BadRequestException('User already exists, Try new one');

    const user = new User();
    Object.assign(user, createUserDto);
    if (file){
      user.avatar = (await this.cloudinaryService.uploadFile(file)).secure_url;
    }


    await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = user;

    const payload = {
      id: user.id,
      isAdmin: user.isAdmin,
    };

    return {
      user,
      token: await this.jwtService.signAsync(payload, {
        expiresIn: '3d',
      }),
    };
  }

  async userSignIn(
    signInDto: SignInDto,
    rememberMe: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { username: signInDto.username },
      select: [
        'password',
        'email',
        'username',
        'email',
        'isAdmin',
        'id',
        'avatar',
        'fullName',
        'createdAt',
      ],
    });

    if (!user) throw new NotFoundException("user not found");
    const matched = comparePasswords(signInDto.password, user.password);
    if (!matched) throw new UnauthorizedException();
    const { password, ...userWithoutPassword } = user;
    if (matched) {
      const payload = {
        id: user.id,
        isAdmin: user.isAdmin,
      };

      if (rememberMe === 'true') {
        return {
          user,
          token: await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
          }),
        };
      } else if (rememberMe === 'false' || rememberMe === null) {
        return {
          user,
          token: await this.jwtService.signAsync(payload, {
            expiresIn: '3d',
          }),
        };
      } else {
        throw new UnauthorizedException('Invalid query');
      }
    }
  }

  async instructorSignup(
    createInstructorDto: CreateInstructorDto,
    file: Express.Multer.File,
  ): Promise<{ instructor: Instructor; token: string }> {
    const existingInstructor = await this.instructorRepo.findOne({
      where: { email: createInstructorDto.email },
    });
    if (existingInstructor) throw new BadRequestException('instructor already exists');
    const instructor = new Instructor();
    Object.assign(instructor, createInstructorDto);
    if (file) {
      instructor.avatar = (
        await this.cloudinaryService.uploadFile(file)
      ).secure_url;
    }
    await this.instructorRepo.save(instructor);
    const payload = {
      id: instructor.id,
      isInstructor: instructor.isInstructor,
    };
    return {
      instructor,
      token: await this.jwtService.signAsync(payload, {
        expiresIn: '3d',
      }),
    };
  }

  async instructorSignIn(
    signInDto: SignInDto,
    rememberMe: string,
  ) {
    const instructor = await this.instructorRepo.findOne({
      where: { username: signInDto.username },
      select: [
        'id',
        'email',
        'username',
        'password',
        'isInstructor',
        'coursesCount',
        'fullName',
        'studentsCount',
        'avatar',
        'ratingsCount',
        'instructorDescription',
        'createdAt',
      ],
    });

    if (!instructor) throw new BadRequestException();
    const matched = comparePasswords(signInDto.password, instructor.password);
    if (!matched) throw new BadRequestException();
    if (matched) {
      const payload = {
        id: instructor.id,
        isInstructor: instructor.isInstructor,
      };
      if (rememberMe === 'true') {
        return {
          user: instructor,
          token: await this.jwtService.signAsync(payload, {
            expiresIn: '7d',
          }),
        };
      } else if (rememberMe === 'false') {
        return {
          user: instructor,
          token: await this.jwtService.signAsync(payload, {
            expiresIn: '3d',
          }),
        };
      } else {
        throw new BadRequestException('Invalid query');
      }
    }
  }

  async currentUser(req: any) {
    const { id, isInstructor, isAdmin } = req.user;
    if (isInstructor) {
      const instructor = await this.instructorRepo.findOneBy({ id });
      return {
        user: instructor,
      };
    } else if (isAdmin === false) {
      const user = await this.userRepository.findOneBy({ id });
      return { user: user };
    } else if (isAdmin === true) {
      const user = await this.userRepository.findOneBy({ id });
      return { user: user };
    }
    throw new NotFoundException('User not found');
  }

  async forgotPassword(req: any) {
    const { email } = req.body;
    const user = await this.userRepository.findOneBy({ email });
    if (!user) throw new UnauthorizedException();

    // 2 ) if user exists, Generate random 6 digits (using js)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');

    // 3 ) save hashed password reset code in db
    user.passwordResetCode = hashedResetCode;

    // 4 ) add expiration time to the password reset code (10 min)
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetVerified = false;

    // save do db
    await this.userRepository.save(user);

    const message = `Hi ${user.username},\n We received a request to reset the password on your E-learning Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-learning Team`;

    // 5 ) send the reset code via email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password rese code - [valid for 10 min]',
        message,
      });
      return { status: 'Success', message: 'Reset code sent to email' };
    } catch (err) {
      user.passwordResetCode = null;
      user.passwordResetExpires = null;
      user.passwordResetVerified = null;

      await this.userRepository.save(user);
      throw new BadRequestException(
        'There is an error in sending email');
    }
  }


  async verifyPasswordResetCode(req: any) {
    // 1 ) get user based on reset code, i need to hash if first
    const hashedResetCode = crypto
      .createHash('sha256')
      .update(req.body.resetCode)
      .digest('hex');

    const user = await this.userRepository.findOne({
      where: {
        passwordResetCode: hashedResetCode,
        passwordResetExpires: MoreThan(new Date()),
      },
    });
    if (!user) {
      throw new ForbiddenException('Reset code invalid or expired' );
    }

    // 2 ) check if the reset code is valid and make passwordResetVerified true
    user.passwordResetVerified = true;
    await this.userRepository.save(user);

    return { status: 'Success' };
  }

  async resetPassword(req: any){
    // 1) Get user based on email
    const user = await this.userRepository.findOne({
      where: { email: req.body.email },
      select: [
        'id',
        'email',
        'username',
        'password',
        'passwordResetCode',
        'passwordResetExpires',
        'passwordResetVerified',
      ],
    });
    if (!user) {
      throw new NotFoundException(`There is no user with this email ${req.body.email}`);
    }

    // 2) Check if reset code verified
    if (!user.passwordResetVerified) {
      throw new BadRequestException('Reset code not verified');
    }

    // 3) If all processes are valid, change the password
    user.password = req.body.newPassword;
    user.passwordResetCode = null;
    user.passwordChangedAt = new Date();
    user.passwordResetExpires = null;
    user.passwordResetVerified = false;

    await this.userRepository.save(user);

    // 4) After changing password, return new token
    const payload = { id: user.id };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '3d' });

    return { user, token };
  }

}
