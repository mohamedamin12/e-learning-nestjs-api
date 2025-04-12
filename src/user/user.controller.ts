import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}



  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('courses')
  @UseGuards(AuthGuard) 
  findOne(@Request() req) {
    return this.userService.findUserCorses(req);
  }

  @Patch()
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.update(req, updateUserDto, file);
  }

  @Delete()
  @UseGuards(AuthGuard)
  remove(@Request() req) {
    return this.userService.remove(req);
  }

  @Delete('/avatar')
  @UseGuards(AuthGuard)
  removeAvatar(@Request() req) {
    return this.userService.removeAvatar(req);
  }
}
