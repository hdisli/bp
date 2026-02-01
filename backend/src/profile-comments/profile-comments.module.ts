import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileCommentsController } from './profile-comments.controller';
import { ProfileCommentsService } from './profile-comments.service';
import { ProfileComment } from './entities/profile-comment.entity';
import { ProfileCommentReaction } from './entities/profile-comment-reaction.entity';
import { User } from '../entities/user.entity';
import { Friendship } from '../friendships/entities/friendship.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { getJwtSecret } from '../common/constants/jwt.constants';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfileComment, ProfileCommentReaction, User, Friendship]),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: getJwtSecret(configService),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ProfileCommentsController],
  providers: [ProfileCommentsService],
  exports: [ProfileCommentsService],
})
export class ProfileCommentsModule {}
