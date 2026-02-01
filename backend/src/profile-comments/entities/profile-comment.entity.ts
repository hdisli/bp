import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../entities/user.entity';

@Entity('profile_comments')
@Check(`"author_id" <> "profile_user_id"`)
@Index('idx_profile_comments_profile_created', ['profileUserId', 'createdAt'])
export class ProfileComment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'profile_user_id' })
  profileUserId: number;

  @Column({ name: 'author_id' })
  authorId: number;

  @Column({ type: 'text' })
  comment: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_user_id' })
  profileUser: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;
}
