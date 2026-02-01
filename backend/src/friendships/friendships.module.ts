import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';
import { Friendship } from './entities/friendship.entity';
import { User } from '../entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditLogService } from '../common/services/audit-log.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship, User]), AuthModule, NotificationsModule],
  controllers: [FriendshipsController],
  providers: [FriendshipsService, AuditLogService],
  exports: [FriendshipsService],
})
export class FriendshipsModule {}
