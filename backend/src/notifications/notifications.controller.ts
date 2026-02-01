import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthUser {
  id: number;
  email: string;
  username: string;
}

@Controller('api/notifications')
@UseGuards(ThrottlerGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getNotifications(
    @Request() req: { user: AuthUser },
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
  ) {
    try {
      const page = pageParam ? parseInt(pageParam, 10) : 1;
      let limit = limitParam ? parseInt(limitParam, 10) : 20;

      if (isNaN(page) || page < 1) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_PAGE',
            message: 'Seite muss eine Zahl >= 1 sein.',
            statusCode: 400,
          },
        });
      }

      if (isNaN(limit) || limit < 1) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'Limit muss eine Zahl >= 1 sein.',
            statusCode: 400,
          },
        });
      }

      if (limit > 100) {
        limit = 100;
      }

      const data = await this.notificationsService.getNotifications(req.user.id, page, limit);
      return {
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error fetching notifications: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Laden der Benachrichtigungen.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @Throttle({ medium: { ttl: 10000, limit: 30 } })
  async getUnreadCount(@Request() req: { user: AuthUser }) {
    try {
      const unreadCount = await this.notificationsService.getUnreadCount(req.user.id);
      return {
        success: true,
        data: { unreadCount },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error fetching unread count: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Laden der ungelesenen Benachrichtigungen.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('read-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: { user: AuthUser }) {
    try {
      await this.notificationsService.markAllAsRead(req.user.id);
      return {
        success: true,
        data: { message: 'Alle Benachrichtigungen als gelesen markiert.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error marking all as read: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Markieren aller Benachrichtigungen.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: { user: AuthUser }) {
    try {
      await this.notificationsService.markAsRead(req.user.id, id);
      return {
        success: true,
        data: { message: 'Benachrichtigung als gelesen markiert.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error marking notification as read: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Markieren der Benachrichtigung.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
