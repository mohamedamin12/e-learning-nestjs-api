import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from 'src/course/entities/course.entity';
import { User } from 'src/user/entities/user.entity';

@Entity({ name: 'reviews' })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: [1, 2, 3, 4, 5] })
  rating: number;

  @Column({ length: 50 })
  reviewBody: string;

  @ManyToOne(() => User, (user) => user.reviews)
  reviewCreator: User;

  @ManyToOne(() => Course, (course) => course.reviews)
  course: Course;
}
