import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
  HttpException,
  Ip,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { VoteRatingDto } from './dto/vote-rating.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService, AuditAction } from '../common/services/audit-log.service';

@Controller('api/products/:productId/ratings')
export class RatingsController {
  private readonly logger = new Logger(RatingsController.name);

  constructor(
    private readonly ratingsService: RatingsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async getRatings(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('userId') userId?: string,
  ) {
    try {
      this.logger.log(`GET /api/products/${productId}/ratings`);

      const currentUserId = userId ? parseInt(userId, 10) : undefined;
      const result = await this.ratingsService.findByProductId(productId, currentUserId);

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error fetching ratings for product ${productId}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch ratings',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user-status')
  @UseGuards(JwtAuthGuard)
  async getUserStatus(
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req: { user: { id: number } },
  ) {
    try {
      const result = await this.ratingsService.hasUserRated(productId, req.user.id);

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to check user status',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createRating(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() createRatingDto: CreateRatingDto,
    @Request() req: { user: { id: number; email: string; username: string } },
    @Ip() ip: string,
  ) {
    try {
      this.logger.log(`POST /api/products/${productId}/ratings by user ${req.user.id}`);

      const rating = await this.ratingsService.create(productId, req.user.id, createRatingDto);

      this.auditLogService.log({
        userId: req.user.id,
        action: AuditAction.RATING_CREATED,
        ip,
        details: `Rating ${rating.id} created for product ${productId}`,
      });

      return {
        success: true,
        data: {
          id: rating.id,
          productId: rating.productId,
          pricePerformance: Number(rating.pricePerformance),
          quality: Number(rating.quality),
          ingredients: Number(rating.ingredients),
          packaging: Number(rating.packaging),
          productRating: Number(rating.productRating),
          title: rating.title,
          comment: rating.comment,
          createdAt: rating.createdAt,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error creating rating for product ${productId}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create rating',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':ratingId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateRating(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Body() updateRatingDto: UpdateRatingDto,
    @Request() req: { user: { id: number } },
  ) {
    try {
      this.logger.log(`PUT /api/products/${productId}/ratings/${ratingId} by user ${req.user.id}`);

      const rating = await this.ratingsService.update(ratingId, req.user.id, updateRatingDto);

      return {
        success: true,
        data: {
          id: rating.id,
          pricePerformance: Number(rating.pricePerformance),
          quality: Number(rating.quality),
          ingredients: Number(rating.ingredients),
          packaging: Number(rating.packaging),
          productRating: Number(rating.productRating),
          title: rating.title,
          comment: rating.comment,
          updatedAt: rating.updatedAt,
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error updating rating ${ratingId}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update rating',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':ratingId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteRating(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Request() req: { user: { id: number } },
    @Ip() ip: string,
  ) {
    try {
      this.logger.log(
        `DELETE /api/products/${productId}/ratings/${ratingId} by user ${req.user.id}`,
      );

      await this.ratingsService.delete(ratingId, req.user.id);

      this.auditLogService.log({
        userId: req.user.id,
        action: AuditAction.RATING_DELETED,
        ip,
        details: `Rating ${ratingId} deleted for product ${productId}`,
      });

      return {
        success: true,
        data: { message: 'Rating deleted successfully' },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error deleting rating ${ratingId}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete rating',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':ratingId/vote')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async voteRating(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('ratingId', ParseIntPipe) ratingId: number,
    @Body() voteDto: VoteRatingDto,
    @Request() req: { user: { id: number } },
  ) {
    try {
      this.logger.log(
        `POST /api/products/${productId}/ratings/${ratingId}/vote by user ${req.user.id}`,
      );

      const result = await this.ratingsService.vote(ratingId, req.user.id, voteDto.type);

      return {
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error voting on rating ${ratingId}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to vote on rating',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
