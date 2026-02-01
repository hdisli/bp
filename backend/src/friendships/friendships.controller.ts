import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { FriendshipsService } from './friendships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLogService, AuditAction } from '../common/services/audit-log.service';

interface AuthUser {
  id: number;
  email: string;
  username: string;
}

@Controller('api/friendships')
@UseGuards(ThrottlerGuard)
export class FriendshipsController {
  private readonly logger = new Logger(FriendshipsController.name);

  constructor(
    private readonly friendshipsService: FriendshipsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getFriendships(@Request() req: { user: AuthUser }) {
    try {
      const data = await this.friendshipsService.getFriendships(req.user.id);
      return {
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error fetching friendships: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Laden der Freundschaften.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':userId/request')
  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.CREATED)
  async sendRequest(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: { user: AuthUser; ip: string },
  ) {
    try {
      const friendship = await this.friendshipsService.sendRequest(req.user.id, targetUserId);
      this.auditLogService.log({
        userId: req.user.id,
        action: AuditAction.FRIEND_REQUEST_SENT,
        ip: req.ip || '',
        details: `Friend request sent to user ${targetUserId}`,
      });
      return {
        success: true,
        data: { friendshipId: friendship.id },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error sending friend request: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Senden der Anfrage.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':friendshipId/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptRequest(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @Request() req: { user: AuthUser; ip: string },
  ) {
    try {
      await this.friendshipsService.acceptRequest(req.user.id, friendshipId);
      this.auditLogService.log({
        userId: req.user.id,
        action: AuditAction.FRIEND_REQUEST_ACCEPTED,
        ip: req.ip || '',
        details: `Friend request ${friendshipId} accepted`,
      });
      return {
        success: true,
        data: { message: 'Freundschaftsanfrage angenommen.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error accepting request: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Annehmen der Anfrage.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':friendshipId/reject')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @Request() req: { user: AuthUser; ip: string },
  ) {
    try {
      await this.friendshipsService.rejectRequest(req.user.id, friendshipId);
      return {
        success: true,
        data: { message: 'Freundschaftsanfrage abgelehnt.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error rejecting request: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Ablehnen der Anfrage.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':friendshipId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async removeFriendship(
    @Param('friendshipId', ParseIntPipe) friendshipId: number,
    @Request() req: { user: AuthUser; ip: string },
  ) {
    try {
      await this.friendshipsService.removeFriendship(req.user.id, friendshipId);
      return {
        success: true,
        data: { message: 'Freundschaft beendet.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error removing friendship: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Beenden der Freundschaft.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':userId/block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async blockUser(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: { user: AuthUser; ip: string },
  ) {
    try {
      await this.friendshipsService.blockUser(req.user.id, targetUserId);
      this.auditLogService.log({
        userId: req.user.id,
        action: AuditAction.USER_BLOCKED,
        ip: req.ip || '',
        details: `User ${targetUserId} blocked`,
      });
      return {
        success: true,
        data: { message: 'Benutzer blockiert.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error blocking user: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Blockieren.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':userId/unblock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unblockUser(
    @Param('userId', ParseIntPipe) targetUserId: number,
    @Request() req: { user: AuthUser; ip: string },
  ) {
    try {
      await this.friendshipsService.unblockUser(req.user.id, targetUserId);
      this.auditLogService.log({
        userId: req.user.id,
        action: AuditAction.USER_UNBLOCKED,
        ip: req.ip || '',
        details: `User ${targetUserId} unblocked`,
      });
      return {
        success: true,
        data: { message: 'Blockierung aufgehoben.' },
        meta: { timestamp: new Date().toISOString(), version: '1' },
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Error unblocking user: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Fehler beim Aufheben der Blockierung.',
            statusCode: 500,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
