import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ProfileCommentsService } from './profile-comments.service';
import { CreateProfileCommentDto } from './dto/create-profile-comment.dto';
import { ReactToCommentDto } from './dto/react-to-comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../users/optional-jwt-auth.guard';
import {
  PROFILE_COMMENTS_DEFAULT_LIMIT,
  PROFILE_COMMENTS_MAX_LIMIT,
} from '../common/constants/pagination.constants';

interface AuthUser {
  id: number;
  email: string;
  username: string;
}

// CSRF-Schutz durch CsrfMiddleware (app.module.ts:76) für alle POST/DELETE Endpoints
@Controller('api/users')
@UseGuards(ThrottlerGuard)
export class ProfileCommentsController {
  private readonly logger = new Logger(ProfileCommentsController.name);

  constructor(private readonly profileCommentsService: ProfileCommentsService) {}

  @Get(':id/profile-comments')
  @UseGuards(OptionalJwtAuthGuard)
  async getProfileComments(
    @Param('id', ParseIntPipe) profileUserId: number,
    @Query('page') page?: string,
    @Query('limit') queryLimit?: string,
    @Request() req?: { user?: AuthUser },
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
      const limitNum = Math.min(
        PROFILE_COMMENTS_MAX_LIMIT,
        Math.max(1, parseInt(queryLimit || String(PROFILE_COMMENTS_DEFAULT_LIMIT), 10)),
      );
      const currentUserId = req?.user?.id ?? null;

      const result = await this.profileCommentsService.getProfileComments(
        profileUserId,
        currentUserId,
        pageNum,
        limitNum,
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
      if (error instanceof Error) {
        this.logger.error(
          `Error fetching profile comments for user ${profileUserId}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Unknown error fetching profile comments for user ${profileUserId}:`,
          error,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch profile comments',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/profile-comments')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async createProfileComment(
    @Param('id', ParseIntPipe) profileUserId: number,
    @Body() dto: CreateProfileCommentDto,
    @Request() req: { user: AuthUser },
  ) {
    try {
      const comment = await this.profileCommentsService.createProfileComment(
        profileUserId,
        req.user.id,
        dto,
      );

      return {
        success: true,
        data: comment,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error(`Error creating profile comment: ${error.message}`, error.stack);
      } else {
        this.logger.error('Unknown error creating profile comment:', error);
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create profile comment',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':userId/profile-comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfileComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req: { user: AuthUser },
  ) {
    try {
      await this.profileCommentsService.deleteProfileComment(commentId, req.user.id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error(
          `Error deleting profile comment ${commentId}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Unknown error deleting profile comment ${commentId}:`, error);
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete profile comment',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':userId/profile-comments/:commentId/reactions')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async reactToComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() dto: ReactToCommentDto,
    @Request() req: { user: AuthUser },
  ) {
    try {
      await this.profileCommentsService.reactToComment(commentId, req.user.id, dto);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error(`Error reacting to comment ${commentId}: ${error.message}`, error.stack);
      } else {
        this.logger.error(`Unknown error reacting to comment ${commentId}:`, error);
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to react to comment',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':userId/profile-comments/:commentId/reactions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReaction(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req: { user: AuthUser },
  ) {
    try {
      await this.profileCommentsService.removeReaction(commentId, req.user.id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error(
          `Error removing reaction from comment ${commentId}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Unknown error removing reaction from comment ${commentId}:`, error);
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to remove reaction',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':userId/profile-comments/:commentId/reactions')
  @UseGuards(OptionalJwtAuthGuard)
  async getReactionDetails(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req?: { user?: AuthUser },
  ) {
    try {
      const currentUserId = req?.user?.id ?? null;
      const reactions = await this.profileCommentsService.getReactionDetails(
        commentId,
        currentUserId,
      );

      return {
        success: true,
        data: reactions,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      if (error instanceof Error) {
        this.logger.error(
          `Error fetching reaction details for comment ${commentId}: ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `Unknown error fetching reaction details for comment ${commentId}:`,
          error,
        );
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch reaction details',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
