import slugify from 'slugify';
import { Instructor } from 'src/instructor/entities/instructor.entity';
import { Review } from 'src/review/entities/review.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, BeforeInsert } from 'typeorm';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  title: string;

  @Column()
  slug: string;

  @Column()
  courseDescription: string; 

  @Column()
  courseLink: string;

  @Column({ default: 0 })
  numberOfStudents: number;

  @Column({ default: 0 })
  numberOfRatings: number;

  @Column({ default: false })
  isBestSelling: boolean;

  @Column({ nullable: true })
  whatYouWillLearn: string;

  @Column({ default: '85%', length: 6 })
  passPercentage: string;

  @Column({ nullable: true })
  prerequisites: string;

  @Column({ type: 'enum', enum: ['arabic', 'english'], default: 'english' })
  language: string;

  @Column({ type: 'enum', enum: ['frontend', 'backend', 'fullStack'] })
  category: string;

  @Column({ default: false })
  isCertified: boolean;

  @Column({ type: 'enum', enum: ['intermediate', 'beginner', 'advanced'] })
  skillLevel: string;

  @Column('varchar', { nullable: true })
  thumbnails: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => Instructor, (instructor) => instructor.courses)
  courseCreator: Instructor;

  @OneToMany(() => Review, (review) => review.course)
  reviews: Review[];

  @BeforeInsert()
  async getSlug(): Promise<any> {
    try {
      this.slug = slugify(this.title, '-');
    } catch (e) {
      console.log('Error in slugify:', e);
    }
  }
}
