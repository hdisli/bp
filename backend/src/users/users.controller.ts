import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService, FriendshipData } from './users.service';
import { FriendshipsService } from '../friendships/friendships.service';
import { FriendshipStatus } from '../friendships/entities/friendship.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

interface AuthUser {
  id: number;
  email: string;
  username: string;
}

@Controller('api/users')
@UseGuards(ThrottlerGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly friendshipsService: FriendshipsService,
  ) {}

  private async buildFriendshipData(
    currentUserId: number | null,
    targetUserId: number,
  ): Promise<FriendshipData> {
    const empty: FriendshipData = {
      isFriend: false,
      friendRequestStatus: null,
      friendshipId: null,
      friendRequestDirection: null,
      friendsCount: 0,
    };

    if (currentUserId === null || currentUserId === targetUserId) {
      const friendsCount = await this.friendshipsService.getFriendsCount(targetUserId);
      return { ...empty, friendsCount };
    }

    const [fStatus, friendsCount] = await Promise.all([
      this.friendshipsService.getFriendRequestStatus(currentUserId, targetUserId),
      this.friendshipsService.getFriendsCount(targetUserId),
    ]);

    const data: FriendshipData = { ...empty, friendsCount };

    if (fStatus.status === FriendshipStatus.ACCEPTED) {
      data.isFriend = true;
      data.friendRequestStatus = 'accepted';
      data.friendshipId = fStatus.friendshipId;
    } else if (fStatus.status === FriendshipStatus.PENDING) {
      data.friendRequestStatus = 'pending';
      data.friendshipId = fStatus.friendshipId;
      data.friendRequestDirection = fStatus.requestedBy === currentUserId ? 'sent' : 'received';
    }

    return data;
  }

  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  async getProfile(@Param('id', ParseIntPipe) id: number, @Request() req: { user?: AuthUser }) {
    try {
      const currentUserId = req.user?.id ?? null;
      const friendshipData = await this.buildFriendshipData(currentUserId, id);
      const profile = await this.usersService.getProfile(id, currentUserId, friendshipData);

      return {
        success: true,
        data: profile,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error fetching profile for user ${id}`, (error as Error).stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch profile',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/activity')
  @UseGuards(OptionalJwtAuthGuard)
  async getActivity(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') queryLimit?: string,
    @Query('type') type?: string,
    @Request() req?: { user?: AuthUser },
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(queryLimit || '20', 10) || 20));
      const activityType = ['all', 'ratings', 'comments'].includes(type || '')
        ? (type as string)
        : 'all';
      const currentUserId = req?.user?.id ?? null;

      const isFriend =
        currentUserId !== null ? await this.friendshipsService.isFriend(currentUserId, id) : false;

      const result = await this.usersService.getActivity(
        id,
        currentUserId,
        pageNum,
        limitNum,
        activityType,
        isFriend,
      );

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error fetching activity for user ${id}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch activity',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Body() dto: UpdateProfileDto, @Request() req: { user: AuthUser }) {
    try {
      await this.usersService.updateProfile(req.user.id, dto);
      const friendshipData = await this.buildFriendshipData(req.user.id, req.user.id);
      const profile = await this.usersService.getProfile(req.user.id, req.user.id, friendshipData);

      return {
        success: true,
        data: profile,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error updating profile for user ${req.user.id}`, (error as Error).stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update profile',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @UseInterceptors(
    FileInterceptor('avatar', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() req: { user: AuthUser },
  ) {
    if (!file) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file uploaded',
          statusCode: 400,
        },
      });
    }

    try {
      const result = await this.usersService.uploadAvatar(req.user.id, file);

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error uploading avatar for user ${req.user.id}`, (error as Error).stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload avatar',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('account')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateAccount(@Body() dto: UpdateAccountDto, @Request() req: { user: AuthUser }) {
    try {
      const result = await this.usersService.updateAccount(req.user.id, dto);

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error updating account for user ${req.user.id}`, (error as Error).stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update account',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
