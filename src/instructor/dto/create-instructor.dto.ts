import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  @IsOptional()
  instructorDescription: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  avatar: string;
}