import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../entities/user.entity';
import { ProfileComment } from './profile-comment.entity';

export enum ReactionType {
  // Positive
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  WOW = 'wow',
  FIRE = 'fire',
  IDEA = 'idea',
  PARTY = 'party',
  CLAP = 'clap',
  // Negative/Fun
  POOP = 'poop',
  CLOWN = 'clown',
  SLEEPY = 'sleepy',
  VOMIT = 'vomit',
}

@Entity('profile_comment_reactions')
@Unique(['commentId', 'userId'])
@Index('idx_comment_reactions_comment', ['commentId'])
@Index('idx_comment_reactions_user', ['userId'])
export class ProfileCommentReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'comment_id' })
  commentId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LIKE,
  })
  type: ReactionType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => ProfileComment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment: ProfileComment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
