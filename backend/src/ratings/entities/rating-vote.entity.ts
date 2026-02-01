import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Rating } from './rating.entity';
import { User } from '../../entities/user.entity';

@Entity('rating_votes')
@Unique('uq_rating_votes_rating_user', ['ratingId', 'userId'])
export class RatingVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'rating_id' })
  @Index('idx_rating_votes_rating_id')
  ratingId: number;

  @Column({ name: 'user_id' })
  @Index('idx_rating_votes_user_id')
  userId: number;

  @Column({ type: 'varchar', length: 10 })
  type: 'like' | 'dislike';

  @ManyToOne(() => Rating, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rating_id' })
  rating: Rating;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
