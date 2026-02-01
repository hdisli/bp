import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id' })
  @Index('idx_email_verifications_user_id')
  userId: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_email_verifications_token')
  token: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
