import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('idx_users_email')
  email: string;

  @Column({ type: 'varchar', length: 30, unique: true })
  @Index('idx_users_username')
  username: string;

  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'integer', nullable: true })
  age: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: 'male' | 'female' | 'diverse' | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true })
  signature: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'public',
    name: 'profile_visibility',
  })
  profileVisibility: 'public' | 'friends_only' | 'private';

  @Column({
    type: 'varchar',
    length: 25,
    default: 'everyone',
    name: 'allow_friend_requests_from',
  })
  allowFriendRequestsFrom: 'everyone' | 'friends_of_friends' | 'none';

  @Column({ type: 'boolean', default: false, name: 'online_status' })
  onlineStatus: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_seen' })
  lastSeen: Date | null;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
