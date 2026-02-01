import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { AuthModule } from '../auth/auth.module';
import { FriendshipsModule } from '../friendships/friendships.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rating]), AuthModule, FriendshipsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
