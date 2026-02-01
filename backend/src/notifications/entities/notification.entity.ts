import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../entities/user.entity';

export enum NotificationType {
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  NEW_RATING = 'new_rating',
  COMMENT_ON_PROFILE = 'comment_on_profile',
  COMMENT_REACTION = 'comment_reaction',
  RATING_VOTE = 'rating_vote',
}

@Entity('notifications')
@Index('idx_notifications_user_read_created', ['userId', 'isRead', 'createdAt'])
@Index('idx_notifications_user_created', ['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ name: 'sender_id', nullable: true })
  senderId: number | null;

  @Column({ name: 'reference_id', type: 'integer', nullable: true })
  referenceId: number | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
