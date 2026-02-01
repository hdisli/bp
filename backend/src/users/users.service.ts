import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, FindOptionsWhere } from 'typeorm';
import * as argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';
import { User } from '../entities/user.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

export interface FriendshipData {
  isFriend: boolean;
  friendRequestStatus: 'pending' | 'accepted' | null;
  friendshipId: number | null;
  friendRequestDirection: 'sent' | 'received' | null;
  friendsCount: number;
}

export interface ProfileResponse {
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  age: number | null;
  gender: 'male' | 'female' | 'diverse' | null;
  state: string | null;
  signature: string | null;
  memberSince: string;
  onlineStatus: boolean;
  lastSeen: string | null;
  profileVisibility: 'public' | 'friends_only' | 'private';
  stats: {
    ratingsCount: number;
    ratingsCommentsCount: number;
    friendsCount: number;
  };
  isFriend: boolean;
  friendRequestStatus: 'pending' | 'accepted' | null;
  friendshipId: number | null;
  friendRequestDirection: 'sent' | 'received' | null;
  canViewProfile: boolean;
  isOwnProfile: boolean;
}

export interface PrivateProfileResponse {
  canViewProfile: false;
  username: string;
  avatarUrl: string | null;
}

export interface ActivityItem {
  type: 'rating';
  id: number;
  productId: number;
  productName: string;
  category: string;
  overall: number;
  comment?: string;
  createdAt: Date;
}

export interface ActivityResult {
  items: ActivityItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async getProfile(
    userId: number,
    currentUserId: number | null,
    friendshipData: FriendshipData,
  ): Promise<ProfileResponse | PrivateProfileResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    const isOwnProfile = currentUserId === userId;

    // Privacy check
    if (!isOwnProfile) {
      if (user.profileVisibility === 'private') {
        return {
          canViewProfile: false,
          username: user.username,
          avatarUrl: user.avatarUrl,
        };
      }
      if (user.profileVisibility === 'friends_only' && !friendshipData.isFriend) {
        return {
          canViewProfile: false,
          username: user.username,
          avatarUrl: user.avatarUrl,
        };
      }
    }

    // Fetch rating stats
    const stats = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('COUNT(rating.id)', 'ratingsCount')
      .addSelect('COUNT(CASE WHEN rating.comment IS NOT NULL THEN 1 END)', 'ratingsCommentsCount')
      .where('rating.user_id = :userId', { userId })
      .getRawOne();

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      age: user.age,
      gender: user.gender,
      state: user.state,
      signature: user.signature,
      memberSince: user.createdAt.toISOString(),
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
      profileVisibility: user.profileVisibility,
      stats: {
        ratingsCount: parseInt(stats.ratingsCount, 10) || 0,
        ratingsCommentsCount: parseInt(stats.ratingsCommentsCount, 10) || 0,
        friendsCount: friendshipData.friendsCount,
      },
      isFriend: friendshipData.isFriend,
      friendRequestStatus: friendshipData.friendRequestStatus,
      friendshipId: friendshipData.friendshipId,
      friendRequestDirection: friendshipData.friendRequestDirection,
      canViewProfile: true,
      isOwnProfile,
    };
  }

  async getActivity(
    userId: number,
    currentUserId: number | null,
    page: number,
    limit: number,
    type: string,
    isFriend: boolean,
  ): Promise<ActivityResult> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    const isOwnProfile = currentUserId === userId;

    // Privacy check
    if (!isOwnProfile) {
      if (user.profileVisibility === 'private') {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
      if (user.profileVisibility === 'friends_only' && !isFriend) {
        return {
          items: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        };
      }
    }

    const where: FindOptionsWhere<Rating> = { userId };
    if (type === 'comments') {
      where.comment = Not(IsNull());
    }

    const total = await this.ratingRepository.count({ where });
    const totalPages = Math.ceil(total / limit);

    const ratings = await this.ratingRepository.find({
      where,
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const items: ActivityItem[] = ratings.map((rating) => {
      const overall =
        Number(rating.pricePerformance) * 0.15 +
        Number(rating.quality) * 0.15 +
        Number(rating.ingredients) * 0.15 +
        Number(rating.packaging) * 0.15 +
        Number(rating.productRating) * 0.4;

      const hasQualifyingComment =
        rating.comment !== null && rating.comment.trim().split(/\s+/).length >= 7;
      const comment = hasQualifyingComment
        ? rating.comment!.length > 100
          ? rating.comment!.substring(0, 100) + '...'
          : rating.comment!
        : undefined;

      return {
        type: 'rating' as const,
        id: rating.id,
        productId: rating.productId,
        productName: rating.product?.name ?? '',
        category: rating.product?.category?.name ?? '',
        overall: parseFloat(overall.toFixed(2)),
        comment,
        createdAt: rating.createdAt,
      };
    });

    return {
      items,
      pagination: { page, limit, total, totalPages },
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    if (dto.bio !== undefined) user.bio = dto.bio || null;
    if (dto.age !== undefined) user.age = dto.age ?? null;
    if (dto.gender !== undefined) user.gender = dto.gender ?? null;
    if (dto.state !== undefined) user.state = dto.state || null;
    if (dto.signature !== undefined) user.signature = dto.signature || null;
    if (dto.profileVisibility !== undefined) user.profileVisibility = dto.profileVisibility;
    if (dto.allowFriendRequestsFrom !== undefined)
      user.allowFriendRequestsFrom = dto.allowFriendRequestsFrom;

    await this.userRepository.save(user);
    this.logger.log(`Profile updated for user ${userId}`);
  }

  async uploadAvatar(userId: number, file: Express.Multer.File): Promise<{ avatarUrl: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Validate MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only JPG, PNG and WebP images are allowed',
          statusCode: 400,
        },
      });
    }

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only JPG, PNG and WebP images are allowed',
          statusCode: 400,
        },
      });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Delete old avatar if exists
    if (user.avatarUrl) {
      const oldPath = path.join(process.cwd(), user.avatarUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const filename = `${userId}_400x400.webp`;
    const outputPath = path.join(uploadsDir, filename);

    await sharp(file.buffer)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(outputPath);

    const avatarUrl = `/uploads/avatars/${filename}`;
    user.avatarUrl = avatarUrl;
    await this.userRepository.save(user);

    this.logger.log(`Avatar uploaded for user ${userId}`);

    return { avatarUrl };
  }

  async updateAccount(userId: number, dto: UpdateAccountDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Verify current password if email or password is being changed
    if (dto.email || dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'CURRENT_PASSWORD_REQUIRED',
            message: 'Current password is required',
            statusCode: 400,
          },
        });
      }

      const isPasswordValid = await argon2.verify(user.passwordHash, dto.currentPassword);
      if (!isPasswordValid) {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
            statusCode: 401,
          },
        });
      }
    }

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await this.userRepository.findOne({
          where: { email: normalizedEmail },
        });
        if (existing) {
          throw new ConflictException({
            success: false,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'Email already registered',
              statusCode: 409,
            },
          });
        }
        user.email = normalizedEmail;
      }
    }

    if (dto.newPassword) {
      user.passwordHash = await argon2.hash(dto.newPassword, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    }

    await this.userRepository.save(user);
    this.logger.log(`Account updated for user ${userId}`);

    return { message: 'Account updated successfully' };
  }

  async setOnlineStatus(userId: number, online: boolean): Promise<void> {
    await this.userRepository.update(userId, {
      onlineStatus: online,
      lastSeen: new Date(),
    });
  }

  async markOfflineInactive(): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ onlineStatus: false })
      .where('online_status = :online', { online: true })
      .andWhere('last_seen < :cutoff', { cutoff: fifteenMinutesAgo })
      .execute();
  }
}
