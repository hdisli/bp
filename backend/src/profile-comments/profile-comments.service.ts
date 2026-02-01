import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ProfileComment } from './entities/profile-comment.entity';
import { ProfileCommentReaction, ReactionType } from './entities/profile-comment-reaction.entity';
import { User } from '../entities/user.entity';
import { Friendship, FriendshipStatus } from '../friendships/entities/friendship.entity';
import { CreateProfileCommentDto } from './dto/create-profile-comment.dto';
import { ReactToCommentDto } from './dto/react-to-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { REACTION_DETAILS_LIMIT } from '../common/constants/pagination.constants';

export interface ReactionCount {
  type: ReactionType;
  count: number;
  userReacted: boolean;
}

export interface ProfileCommentItem {
  id: number;
  comment: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  reactions: ReactionCount[];
  totalReactions: number;
}

export interface ProfileCommentsListResponse {
  comments: ProfileCommentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ProfileCommentsService {
  private readonly logger = new Logger(ProfileCommentsService.name);

  constructor(
    @InjectRepository(ProfileComment)
    private readonly profileCommentRepository: Repository<ProfileComment>,
    @InjectRepository(ProfileCommentReaction)
    private readonly reactionRepository: Repository<ProfileCommentReaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async canViewProfile(
    profileUserId: number,
    currentUserId: number | null,
  ): Promise<boolean> {
    const profileUser = await this.userRepository.findOne({
      where: { id: profileUserId },
    });

    if (!profileUser) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Benutzer nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Eigenes Profil
    if (currentUserId === profileUserId) {
      return true;
    }

    // Öffentliches Profil
    if (profileUser.profileVisibility === 'public') {
      return true;
    }

    // Nicht eingeloggt
    if (!currentUserId) {
      return false;
    }

    // Privates Profil
    if (profileUser.profileVisibility === 'private') {
      return false;
    }

    // friends_only
    if (profileUser.profileVisibility === 'friends_only') {
      const friendship = await this.friendshipRepository.findOne({
        where: {
          userId: Math.min(currentUserId, profileUserId),
          friendId: Math.max(currentUserId, profileUserId),
          status: FriendshipStatus.ACCEPTED,
        },
      });
      return !!friendship;
    }

    return false;
  }

  async getProfileComments(
    profileUserId: number,
    currentUserId: number | null,
    page: number,
    limit: number,
  ): Promise<ProfileCommentsListResponse> {
    // Prüfen ob Profil sichtbar ist
    const canView = await this.canViewProfile(profileUserId, currentUserId);

    if (!canView) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PROFILE_NOT_VISIBLE',
          message: 'Dieses Profil ist nicht sichtbar.',
          statusCode: 403,
        },
      });
    }

    const offset = (page - 1) * limit;

    const [comments, total] = await this.profileCommentRepository.findAndCount({
      where: { profileUserId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: offset,
      take: limit,
    });

    // Reaktionen für alle Kommentare in einem Query laden (kein N+1)
    const commentIds = comments.map((c) => c.id);
    const allReactions =
      commentIds.length > 0
        ? await this.reactionRepository.find({
            where: { commentId: In(commentIds) },
          })
        : [];

    const items: ProfileCommentItem[] = comments.map((c) => {
      const commentReactions = allReactions.filter((r) => r.commentId === c.id);
      const reactionCounts = this.aggregateReactions(commentReactions, currentUserId);

      return {
        id: c.id,
        comment: c.comment,
        createdAt: c.createdAt.toISOString(),
        author: {
          id: c.author.id,
          username: c.author.username,
          avatarUrl: c.author.avatarUrl,
        },
        reactions: reactionCounts,
        totalReactions: reactionCounts.reduce((sum, r) => sum + r.count, 0),
      };
    });

    return {
      comments: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createProfileComment(
    profileUserId: number,
    authorId: number,
    dto: CreateProfileCommentDto,
  ): Promise<ProfileCommentItem> {
    // Prüfen ob Autor ≠ Profilbesitzer
    if (authorId === profileUserId) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'SELF_COMMENT_NOT_ALLOWED',
          message: 'Du kannst dein eigenes Profil nicht kommentieren.',
          statusCode: 400,
        },
      });
    }

    // Prüfen ob Profil sichtbar ist
    const canView = await this.canViewProfile(profileUserId, authorId);

    if (!canView) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PROFILE_NOT_VISIBLE',
          message: 'Dieses Profil ist nicht sichtbar.',
          statusCode: 403,
        },
      });
    }

    // Erstellen
    const comment = this.profileCommentRepository.create({
      profileUserId,
      authorId,
      comment: dto.comment,
    });

    const saved = await this.profileCommentRepository.save(comment);

    // Author-Daten laden
    const author = await this.userRepository.findOne({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'AUTHOR_NOT_FOUND',
          message: 'Autor nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Notification erstellen
    await this.notificationsService.createNotification({
      userId: profileUserId,
      type: NotificationType.COMMENT_ON_PROFILE,
      senderId: authorId,
      referenceId: saved.id,
      message: `${author.username} hat dein Profil kommentiert.`,
    });

    this.logger.log(
      `Profile comment created: id=${saved.id}, profileUserId=${profileUserId}, authorId=${authorId}`,
    );

    return {
      id: saved.id,
      comment: saved.comment,
      createdAt: saved.createdAt.toISOString(),
      author: {
        id: author.id,
        username: author.username,
        avatarUrl: author.avatarUrl,
      },
      reactions: [],
      totalReactions: 0,
    };
  }

  async deleteProfileComment(commentId: number, userId: number): Promise<void> {
    const comment = await this.profileCommentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Kommentar nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Löschbar durch Autor ODER Profilbesitzer
    if (comment.authorId !== userId && comment.profileUserId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Keine Berechtigung für diese Aktion.',
          statusCode: 403,
        },
      });
    }

    await this.profileCommentRepository.remove(comment);
    this.logger.log(`Profile comment deleted: id=${commentId}, userId=${userId}`);
  }

  private aggregateReactions(
    reactions: ProfileCommentReaction[],
    currentUserId: number | null,
  ): ReactionCount[] {
    const grouped = reactions.reduce(
      (acc, r) => {
        if (!acc[r.type]) {
          acc[r.type] = { count: 0, userIds: [] };
        }
        acc[r.type].count++;
        acc[r.type].userIds.push(r.userId);
        return acc;
      },
      {} as Record<ReactionType, { count: number; userIds: number[] }>,
    );

    return Object.entries(grouped).map(([type, data]) => ({
      type: type as ReactionType,
      count: data.count,
      userReacted: currentUserId ? data.userIds.includes(currentUserId) : false,
    }));
  }

  async reactToComment(commentId: number, userId: number, dto: ReactToCommentDto): Promise<void> {
    const comment = await this.profileCommentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Kommentar nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Prüfen ob Profil sichtbar ist
    const canView = await this.canViewProfile(comment.profileUserId, userId);

    if (!canView) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'PROFILE_NOT_VISIBLE',
          message: 'Dieses Profil ist nicht sichtbar.',
          statusCode: 403,
        },
      });
    }

    // Bestehende Reaktion suchen
    const existingReaction = await this.reactionRepository.findOne({
      where: { commentId, userId },
    });

    if (existingReaction) {
      // Reaktion aktualisieren
      existingReaction.type = dto.type;
      await this.reactionRepository.save(existingReaction);
      this.logger.log(
        `Reaction updated: commentId=${commentId}, userId=${userId}, type=${dto.type}`,
      );
    } else {
      // Neue Reaktion erstellen
      const reaction = this.reactionRepository.create({
        commentId,
        userId,
        type: dto.type,
      });
      await this.reactionRepository.save(reaction);
      this.logger.log(
        `Reaction created: commentId=${commentId}, userId=${userId}, type=${dto.type}`,
      );

      // Notification NUR bei NEUER Reaktion (nicht bei Update)
      // Nur Notification wenn Reaktion NICHT vom Kommentar-Autor selbst kommt
      if (comment.authorId !== userId) {
        const reactingUser = await this.userRepository.findOne({ where: { id: userId } });
        if (reactingUser) {
          await this.notificationsService.createNotification({
            userId: comment.authorId,
            type: NotificationType.COMMENT_REACTION,
            senderId: userId,
            referenceId: commentId,
            message: `${reactingUser.username} hat auf deinen Kommentar reagiert.`,
          });
        }
      }
    }
  }

  async removeReaction(commentId: number, userId: number): Promise<void> {
    const reaction = await this.reactionRepository.findOne({
      where: { commentId, userId },
    });

    if (!reaction) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'REACTION_NOT_FOUND',
          message: 'Reaktion nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    await this.reactionRepository.remove(reaction);
    this.logger.log(`Reaction removed: commentId=${commentId}, userId=${userId}`);
  }

  async getReactionDetails(
    commentId: number,
    currentUserId: number | null,
  ): Promise<
    {
      type: ReactionType;
      users: Array<{ id: number; username: string; avatarUrl: string | null }>;
      totalCount: number;
      hasMore: boolean;
    }[]
  > {
    const DISPLAY_LIMIT = REACTION_DETAILS_LIMIT;

    // Prüfe ob Kommentar existiert und ob User ihn sehen darf
    const comment = await this.profileCommentRepository.findOne({
      where: { id: commentId },
      relations: ['profileUser'],
    });

    if (!comment) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Kommentar nicht gefunden.',
          statusCode: 404,
        },
      });
    }

    // Visibility Check
    const canView = await this.canViewProfile(comment.profileUserId, currentUserId);
    if (!canView) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Keine Berechtigung.',
          statusCode: 403,
        },
      });
    }

    // Lade alle Reactions mit User-Daten
    const reactions = await this.reactionRepository.find({
      where: { commentId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    // Gruppiere nach Reaction-Type
    const grouped = reactions.reduce(
      (acc, reaction) => {
        if (!acc[reaction.type]) {
          acc[reaction.type] = [];
        }
        acc[reaction.type].push({
          id: reaction.user.id,
          username: reaction.user.username,
          avatarUrl: reaction.user.avatarUrl || null,
        });
        return acc;
      },
      {} as Record<ReactionType, Array<{ id: number; username: string; avatarUrl: string | null }>>,
    );

    // Konvertiere zu Array-Format mit Limit
    return Object.entries(grouped).map(([type, users]) => {
      const totalCount = users.length;
      const limitedUsers = users.slice(0, DISPLAY_LIMIT);

      return {
        type: type as ReactionType,
        users: limitedUsers,
        totalCount,
        hasMore: totalCount > DISPLAY_LIMIT,
      };
    });
  }
}
