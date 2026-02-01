import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'user_id' })
  @Index('idx_refresh_tokens_user_id')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'token_hash' })
  @Index('idx_refresh_tokens_token_hash')
  tokenHash: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  @Index('idx_refresh_tokens_expires_at')
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
