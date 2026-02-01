import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { User } from '../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

export interface FriendshipUserInfo {
  id: number;
  username: string;
  avatarUrl: string | null;
  onlineStatus: boolean;
  lastSeen: string | null;
}

export interface FriendItem {
  friendshipId: number;
  user: FriendshipUserInfo;
  since: string;
}

export interface PendingRequestItem {
  friendshipId: number;
  user: FriendshipUserInfo;
  createdAt: string;
}

export interface FriendshipsListResponse {
  friends: FriendItem[];
  pendingReceived: PendingRequestItem[];
  pendingSent: PendingRequestItem[];
}

@Injectable()
export class FriendshipsService {
  private readonly logger = new Logger(FriendshipsService.name);

  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private getCanonicalIds(a: number, b: number): { userId: number; friendId: number } {
    return a < b ? { userId: a, friendId: b } : { userId: b, friendId: a };
  }

  async sendRequest(currentUserId: number, targetUserId: number): Promise<Friendship> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CANNOT_FRIEND_SELF',
          message: 'Du kannst dir nicht selbst eine Freundschaftsanfrage senden.',
          statusCode: 400,
        },
      });
    }

    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Benutzer nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    const { userId, friendId } = this.getCanonicalIds(currentUserId, targetUserId);

    const existing = await this.friendshipRepository.findOne({
      where: { userId, friendId },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.BLOCKED) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'ACTION_NOT_ALLOWED',
            message: 'Diese Aktion ist nicht möglich.',
            statusCode: 403,
          },
        });
      }
      throw new ConflictException({
        success: false,
        error: {
          code: 'FRIENDSHIP_EXISTS',
          message: 'Es besteht bereits eine Freundschaft oder Anfrage.',
          statusCode: 409,
        },
      });
    }

    // Check allow_friend_requests_from
    if (targetUser.allowFriendRequestsFrom === 'none') {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FRIEND_REQUESTS_DISABLED',
          message: 'Dieser Benutzer akzeptiert keine Freundschaftsanfragen.',
          statusCode: 403,
        },
      });
    }

    if (targetUser.allowFriendRequestsFrom === 'friends_of_friends') {
      const hasMutualFriend = await this.hasMutualFriend(currentUserId, targetUserId);
      if (!hasMutualFriend) {
        throw new ForbiddenException({
          success: false,
          error: {
            code: 'NOT_FRIEND_OF_FRIEND',
            message: 'Nur Freunde von Freunden können Anfragen senden.',
            statusCode: 403,
          },
        });
      }
    }

    const friendship = this.friendshipRepository.create({
      userId,
      friendId,
      status: FriendshipStatus.PENDING,
      requestedBy: currentUserId,
    });

    const saved = await this.friendshipRepository.save(friendship);
    this.logger.log(`Friend request sent from user ${currentUserId} to user ${targetUserId}`);

    // Fetch sender username for notification message
    const sender = await this.userRepository.findOne({
      where: { id: currentUserId },
      select: ['id', 'username'],
    });
    const senderName = sender?.username ?? 'Ein Benutzer';
    await this.notificationsService.createNotification({
      userId: targetUserId,
      type: NotificationType.FRIEND_REQUEST,
      senderId: currentUserId,
      referenceId: currentUserId,
      message: `${senderName} hat dir eine Freundschaftsanfrage gesendet.`,
    });

    return saved;
  }

  async acceptRequest(currentUserId: number, friendshipId: number): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, status: FriendshipStatus.PENDING },
    });

    if (!friendship) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FRIENDSHIP_NOT_FOUND',
          message: 'Freundschaftsanfrage nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Only the receiver (not the sender/requestedBy) can accept
    if (friendship.requestedBy === currentUserId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'CANNOT_ACCEPT_OWN_REQUEST',
          message: 'Du kannst deine eigene Anfrage nicht annehmen.',
          statusCode: 403,
        },
      });
    }

    // Verify current user is part of this friendship
    if (friendship.userId !== currentUserId && friendship.friendId !== currentUserId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Keine Berechtigung für diese Aktion.',
          statusCode: 403,
        },
      });
    }

    friendship.status = FriendshipStatus.ACCEPTED;
    const saved = await this.friendshipRepository.save(friendship);
    this.logger.log(`Friend request ${friendshipId} accepted by user ${currentUserId}`);

    // Notify the original requester that their request was accepted
    const accepter = await this.userRepository.findOne({
      where: { id: currentUserId },
      select: ['id', 'username'],
    });
    const accepterName = accepter?.username ?? 'Ein Benutzer';
    await this.notificationsService.createNotification({
      userId: friendship.requestedBy,
      type: NotificationType.FRIEND_ACCEPTED,
      senderId: currentUserId,
      referenceId: currentUserId,
      message: `${accepterName} hat deine Freundschaftsanfrage angenommen.`,
    });

    return saved;
  }

  async rejectRequest(currentUserId: number, friendshipId: number): Promise<void> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, status: FriendshipStatus.PENDING },
    });

    if (!friendship) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FRIENDSHIP_NOT_FOUND',
          message: 'Freundschaftsanfrage nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    if (friendship.requestedBy === currentUserId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'CANNOT_REJECT_OWN_REQUEST',
          message: 'Du kannst deine eigene Anfrage nicht ablehnen.',
          statusCode: 403,
        },
      });
    }

    if (friendship.userId !== currentUserId && friendship.friendId !== currentUserId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Keine Berechtigung für diese Aktion.',
          statusCode: 403,
        },
      });
    }

    await this.friendshipRepository.remove(friendship);
    this.logger.log(`Friend request ${friendshipId} rejected by user ${currentUserId}`);
  }

  async removeFriendship(currentUserId: number, friendshipId: number): Promise<void> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'FRIENDSHIP_NOT_FOUND',
          message: 'Freundschaft nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    if (friendship.userId !== currentUserId && friendship.friendId !== currentUserId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Keine Berechtigung für diese Aktion.',
          statusCode: 403,
        },
      });
    }

    await this.friendshipRepository.remove(friendship);
    this.logger.log(`Friendship ${friendshipId} removed by user ${currentUserId}`);
  }

  async blockUser(currentUserId: number, targetUserId: number): Promise<void> {
    if (currentUserId === targetUserId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'CANNOT_BLOCK_SELF',
          message: 'Du kannst dich nicht selbst blockieren.',
          statusCode: 400,
        },
      });
    }

    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Benutzer nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    const { userId, friendId } = this.getCanonicalIds(currentUserId, targetUserId);

    const existing = await this.friendshipRepository.findOne({
      where: { userId, friendId },
    });

    if (existing) {
      if (existing.status === FriendshipStatus.BLOCKED && existing.requestedBy === currentUserId) {
        throw new ConflictException({
          success: false,
          error: {
            code: 'ALREADY_BLOCKED',
            message: 'Benutzer ist bereits blockiert.',
            statusCode: 409,
          },
        });
      }
      await this.friendshipRepository.remove(existing);
    }

    const blocked = this.friendshipRepository.create({
      userId,
      friendId,
      status: FriendshipStatus.BLOCKED,
      requestedBy: currentUserId, // requestedBy = the blocker
    });

    await this.friendshipRepository.save(blocked);
    this.logger.log(`User ${currentUserId} blocked user ${targetUserId}`);
  }

  async unblockUser(currentUserId: number, targetUserId: number): Promise<void> {
    const { userId, friendId } = this.getCanonicalIds(currentUserId, targetUserId);

    const friendship = await this.friendshipRepository.findOne({
      where: { userId, friendId, status: FriendshipStatus.BLOCKED },
    });

    if (!friendship) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'BLOCK_NOT_FOUND',
          message: 'Blockierung nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Only the blocker can unblock
    if (friendship.requestedBy !== currentUserId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Nur der blockierende Benutzer kann die Blockierung aufheben.',
          statusCode: 403,
        },
      });
    }

    await this.friendshipRepository.remove(friendship);
    this.logger.log(`User ${currentUserId} unblocked user ${targetUserId}`);
  }

  async getFriendships(currentUserId: number): Promise<FriendshipsListResponse> {
    // Get all friendships involving this user
    const allFriendships = await this.friendshipRepository
      .createQueryBuilder('f')
      .where('(f.user_id = :uid OR f.friend_id = :uid)', { uid: currentUserId })
      .getMany();

    const accepted = allFriendships.filter((f) => f.status === FriendshipStatus.ACCEPTED);
    const pending = allFriendships.filter((f) => f.status === FriendshipStatus.PENDING);

    // Collect all related user IDs
    const relatedUserIds = new Set<number>();
    for (const f of allFriendships) {
      if (f.userId !== currentUserId) relatedUserIds.add(f.userId);
      if (f.friendId !== currentUserId) relatedUserIds.add(f.friendId);
    }

    // Fetch all related users in one query
    let usersMap = new Map<number, User>();
    if (relatedUserIds.size > 0) {
      const users = await this.userRepository
        .createQueryBuilder('u')
        .where('u.id IN (:...ids)', { ids: Array.from(relatedUserIds) })
        .getMany();
      usersMap = new Map(users.map((u) => [u.id, u]));
    }

    const toUserInfo = (user: User | undefined): FriendshipUserInfo => ({
      id: user?.id ?? 0,
      username: user?.username ?? '',
      avatarUrl: user?.avatarUrl ?? null,
      onlineStatus: user?.onlineStatus ?? false,
      lastSeen: user?.lastSeen ? user.lastSeen.toISOString() : null,
    });

    const getOtherUserId = (f: Friendship): number =>
      f.userId === currentUserId ? f.friendId : f.userId;

    const friends: FriendItem[] = accepted.map((f) => ({
      friendshipId: f.id,
      user: toUserInfo(usersMap.get(getOtherUserId(f))),
      since: f.updatedAt.toISOString(),
    }));

    const pendingReceived: PendingRequestItem[] = pending
      .filter((f) => f.requestedBy !== currentUserId)
      .map((f) => ({
        friendshipId: f.id,
        user: toUserInfo(usersMap.get(f.requestedBy)),
        createdAt: f.createdAt.toISOString(),
      }));

    const pendingSent: PendingRequestItem[] = pending
      .filter((f) => f.requestedBy === currentUserId)
      .map((f) => ({
        friendshipId: f.id,
        user: toUserInfo(usersMap.get(getOtherUserId(f))),
        createdAt: f.createdAt.toISOString(),
      }));

    return { friends, pendingReceived, pendingSent };
  }

  async isFriend(userA: number, userB: number): Promise<boolean> {
    const { userId, friendId } = this.getCanonicalIds(userA, userB);
    const friendship = await this.friendshipRepository.findOne({
      where: { userId, friendId, status: FriendshipStatus.ACCEPTED },
    });
    return !!friendship;
  }

  async getFriendRequestStatus(
    currentUserId: number,
    targetUserId: number,
  ): Promise<{
    status: FriendshipStatus | null;
    friendshipId: number | null;
    requestedBy: number | null;
  }> {
    const { userId, friendId } = this.getCanonicalIds(currentUserId, targetUserId);
    const friendship = await this.friendshipRepository.findOne({
      where: { userId, friendId },
    });
    if (!friendship) {
      return { status: null, friendshipId: null, requestedBy: null };
    }
    return {
      status: friendship.status,
      friendshipId: friendship.id,
      requestedBy: friendship.requestedBy,
    };
  }

  async getFriendsCount(userId: number): Promise<number> {
    return this.friendshipRepository
      .createQueryBuilder('f')
      .where('(f.user_id = :uid OR f.friend_id = :uid)', { uid: userId })
      .andWhere('f.status = :status', { status: FriendshipStatus.ACCEPTED })
      .getCount();
  }

  private async hasMutualFriend(userA: number, userB: number): Promise<boolean> {
    // Friends of userA
    // Friends of userB
    // Intersect = mutual friends
    const result = await this.friendshipRepository.query(
      `SELECT 1 FROM (
        SELECT CASE WHEN user_id = $1 THEN friend_id ELSE user_id END AS fid
        FROM friendships WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
      ) fa
      INNER JOIN (
        SELECT CASE WHEN user_id = $2 THEN friend_id ELSE user_id END AS fid
        FROM friendships WHERE (user_id = $2 OR friend_id = $2) AND status = 'accepted'
      ) fb ON fa.fid = fb.fid
      LIMIT 1`,
      [userA, userB],
    );

    return result.length > 0;
  }
}
