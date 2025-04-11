import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, OneToMany, ManyToMany, JoinTable, BeforeUpdate } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Course } from 'src/course/entities/course.entity';
import { Review } from 'src/review/entities/review.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 30 })
  fullName: string;

  @Column({ unique: true, length: 15 })
  username: string;

  @Column({ unique: true, length: 30 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: true })
  active: boolean;

  @Column( 'varchar' , { nullable: true })
  avatar: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordChangedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetCode: string | null;

  @Column({ type: 'timestamp', nullable: true, select: false })
  passwordResetExpires: Date | null;

  @Column({ type: 'boolean' ,default: false, select: false, nullable: true })
  passwordResetVerified: Boolean | null;

  @OneToMany(() => Review, (reviews) => reviews.reviewCreator)
  reviews: Review[];

  @ManyToMany(() => Course, { cascade: ['insert'] })
  @JoinTable()
  courses: Course[];

  @BeforeInsert()
  @BeforeUpdate()
  async correctInputs(): Promise<any> {
    try {
      this.email = this.email.toLowerCase().trim();
      this.username = this.username.toLowerCase().trim();
      this.password = this.password.trim();
      this.fullName = this.fullName.trim();
      this.password = await bcrypt.hash(this.password, 10);
    } catch (e) {
      console.log(e);
    }
  }
}
