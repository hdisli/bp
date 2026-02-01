import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { RatingVote } from './entities/rating-vote.entity';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { AuthModule } from '../auth/auth.module';
import { AuditLogService } from '../common/services/audit-log.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, RatingVote, User]), AuthModule, NotificationsModule],
  controllers: [RatingsController],
  providers: [RatingsService, AuditLogService],
  exports: [RatingsService],
})
export class RatingsModule {}
