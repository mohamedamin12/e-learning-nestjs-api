import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

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
  findOne(@Request() req) {
    return this.userService.findUserCorses(req);
  }

  @Patch()
  update(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.update(req, updateUserDto, file);
  }

  @Delete()
  remove(@Request() req) {
    return this.userService.remove(req);
  }

  @Delete('/avatar')
  removeAvatar(@Request() req) {
    return this.userService.removeAvatar(req);
  }
}
