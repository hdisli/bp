import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    avatarUrl: string | null;
  } | null;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getNotifications(
    userId: number,
    page: number,
    limit: number,
  ): Promise<NotificationsListResponse> {
    const offset = (page - 1) * limit;

    const [notifications, total] = await this.notificationRepository
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.sender', 's')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    const unreadCount = await this.getUnreadCount(userId);

    const items: NotificationItem[] = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      isRead: n.isRead,
      referenceId: n.referenceId,
      createdAt: n.createdAt.toISOString(),
      sender: n.sender
        ? {
            id: n.sender.id,
            username: n.sender.username,
            avatarUrl: n.sender.avatarUrl,
          }
        : null,
    }));

    return {
      notifications: items,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepository
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.is_read = false')
      .getCount();
  }

  async markAsRead(userId: number, notificationId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Benachrichtigung nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Keine Berechtigung für diese Aktion.',
          statusCode: 403,
        },
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('user_id = :userId', { userId })
      .andWhere('is_read = false')
      .execute();
  }

  async createNotification(data: {
    userId: number;
    type: NotificationType;
    senderId: number | null;
    referenceId: number | null;
    message: string;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      type: data.type,
      senderId: data.senderId,
      referenceId: data.referenceId,
      message: data.message,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(
      `Notification created: type=${data.type}, userId=${data.userId}, senderId=${data.senderId}`,
    );
    return saved;
  }
}
