import {
  Injectable,
  Logger,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './entities/rating.entity';
import { RatingVote } from './entities/rating-vote.entity';
import { User } from '../entities/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { calculateOverallRating } from '../common/constants/rating-weights';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(RatingVote)
    private readonly voteRepository: Repository<RatingVote>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByProductId(productId: number, currentUserId?: number) {
    this.logger.log(`Fetching ratings for product ${productId}`);

    const ratings = await this.ratingRepository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const averages = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.price_performance)', 'pricePerformance')
      .addSelect('AVG(rating.quality)', 'quality')
      .addSelect('AVG(rating.ingredients)', 'ingredients')
      .addSelect('AVG(rating.packaging)', 'packaging')
      .addSelect('AVG(rating.product_rating)', 'productRating')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.product_id = :productId', { productId })
      .getRawOne();

    const count = parseInt(averages.count, 10) || 0;

    const avg =
      count > 0
        ? {
            pricePerformance: parseFloat(parseFloat(averages.pricePerformance).toFixed(2)),
            quality: parseFloat(parseFloat(averages.quality).toFixed(2)),
            ingredients: parseFloat(parseFloat(averages.ingredients).toFixed(2)),
            packaging: parseFloat(parseFloat(averages.packaging).toFixed(2)),
            productRating: parseFloat(parseFloat(averages.productRating).toFixed(2)),
            overall: calculateOverallRating({
              pricePerformance: parseFloat(averages.pricePerformance),
              quality: parseFloat(averages.quality),
              ingredients: parseFloat(averages.ingredients),
              packaging: parseFloat(averages.packaging),
              productRating: parseFloat(averages.productRating),
            }),
          }
        : null;

    const ratingIds = ratings.map((r) => r.id);

    const voteCounts: Record<number, { likes: number; dislikes: number }> = {};
    const userVotes: Record<number, string> = {};

    if (ratingIds.length > 0) {
      const voteAggregates = await this.voteRepository
        .createQueryBuilder('vote')
        .select('vote.rating_id', 'ratingId')
        .addSelect('vote.type', 'type')
        .addSelect('COUNT(vote.id)', 'count')
        .where('vote.rating_id IN (:...ratingIds)', { ratingIds })
        .groupBy('vote.rating_id')
        .addGroupBy('vote.type')
        .getRawMany();

      for (const row of voteAggregates) {
        const rid = parseInt(row.ratingId, 10);
        if (!voteCounts[rid]) voteCounts[rid] = { likes: 0, dislikes: 0 };
        if (row.type === 'like') voteCounts[rid].likes = parseInt(row.count, 10);
        else voteCounts[rid].dislikes = parseInt(row.count, 10);
      }

      if (currentUserId) {
        const userVoteRows = await this.voteRepository
          .createQueryBuilder('vote')
          .where('vote.rating_id IN (:...ratingIds)', { ratingIds })
          .andWhere('vote.user_id = :userId', { userId: currentUserId })
          .getMany();
        for (const v of userVoteRows) {
          userVotes[v.ratingId] = v.type;
        }
      }
    }

    // Show ratings with a comment of at least 7 words as visible reviews.
    // Always include the current user's own rating so they can edit/delete it.
    // All ratings still count toward averages and count.
    const minCommentWords = 7;
    const visibleRatings = ratings.filter((r) => {
      if (currentUserId && r.userId === currentUserId) return true;
      if (!r.comment) return false;
      return r.comment.trim().split(/\s+/).length >= minCommentWords;
    });

    return {
      averages: avg,
      count,
      ratings: visibleRatings.map((r) => ({
        id: r.id,
        userId: r.userId,
        username: r.user.username,
        avatarUrl: r.user.avatarUrl || null,
        pricePerformance: Number(r.pricePerformance),
        quality: Number(r.quality),
        ingredients: Number(r.ingredients),
        packaging: Number(r.packaging),
        productRating: Number(r.productRating),
        title: r.title,
        comment: r.comment,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        likes: voteCounts[r.id]?.likes || 0,
        dislikes: voteCounts[r.id]?.dislikes || 0,
        userVote: userVotes[r.id] || null,
      })),
    };
  }

  async create(productId: number, userId: number, dto: CreateRatingDto) {
    this.logger.log(`Creating rating for product ${productId} by user ${userId}`);

    const isVerified = await this.authService.isUserVerified(userId);
    if (!isVerified) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'EMAIL_NOT_VERIFIED',
          message: 'You must verify your email before creating ratings',
          statusCode: 403,
        },
      });
    }

    const existing = await this.ratingRepository.findOne({
      where: { productId, userId },
    });

    if (existing) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'ALREADY_RATED',
          message: 'You have already rated this product',
          statusCode: 409,
        },
      });
    }

    const rating: Rating = this.ratingRepository.create({
      productId,
      userId,
      pricePerformance: dto.pricePerformance,
      quality: dto.quality,
      ingredients: dto.ingredients,
      packaging: dto.packaging,
      productRating: dto.productRating,
      title: dto.title ?? null,
      comment: dto.comment ?? null,
    });

    return await this.ratingRepository.save(rating);
  }

  async update(ratingId: number, userId: number, dto: UpdateRatingDto) {
    this.logger.log(`Updating rating ${ratingId} by user ${userId}`);

    const rating = await this.ratingRepository.findOne({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'RATING_NOT_FOUND',
          message: 'Rating not found',
          statusCode: 404,
        },
      });
    }

    if (rating.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only edit your own ratings',
          statusCode: 403,
        },
      });
    }

    if (dto.pricePerformance !== undefined) rating.pricePerformance = dto.pricePerformance;
    if (dto.quality !== undefined) rating.quality = dto.quality;
    if (dto.ingredients !== undefined) rating.ingredients = dto.ingredients;
    if (dto.packaging !== undefined) rating.packaging = dto.packaging;
    if (dto.productRating !== undefined) rating.productRating = dto.productRating;
    if (dto.title !== undefined) rating.title = dto.title ?? null;
    if (dto.comment !== undefined) rating.comment = dto.comment ?? null;

    return await this.ratingRepository.save(rating);
  }

  async delete(ratingId: number, userId: number) {
    this.logger.log(`Deleting rating ${ratingId} by user ${userId}`);

    const rating = await this.ratingRepository.findOne({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'RATING_NOT_FOUND',
          message: 'Rating not found',
          statusCode: 404,
        },
      });
    }

    if (rating.userId !== userId) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own ratings',
          statusCode: 403,
        },
      });
    }

    await this.ratingRepository.remove(rating);
  }

  async vote(ratingId: number, userId: number, type: 'like' | 'dislike') {
    this.logger.log(`User ${userId} voting ${type} on rating ${ratingId}`);

    const rating = await this.ratingRepository.findOne({
      where: { id: ratingId },
    });

    if (!rating) {
      throw new NotFoundException({
        success: false,
        error: {
          code: 'RATING_NOT_FOUND',
          message: 'Rating not found',
          statusCode: 404,
        },
      });
    }

    const existing = await this.voteRepository.findOne({
      where: { ratingId, userId },
    });

    if (existing) {
      if (existing.type === type) {
        await this.voteRepository.remove(existing);
        return { action: 'removed', type: null };
      } else {
        existing.type = type;
        await this.voteRepository.save(existing);
        return { action: 'changed', type };
      }
    }

    const vote = this.voteRepository.create({ ratingId, userId, type });
    await this.voteRepository.save(vote);

    if (rating.userId !== userId) {
      const voter = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'username'],
      });

      if (voter) {
        const voteLabel = type === 'like' ? 'Like' : 'Dislike';
        await this.notificationsService.createNotification({
          userId: rating.userId,
          type: NotificationType.RATING_VOTE,
          senderId: userId,
          referenceId: rating.productId,
          message: `${voter.username} hat deine Bewertung mit einem ${voteLabel} bewertet.`,
        });
      }
    }

    return { action: 'created', type };
  }

  async hasUserRated(
    productId: number,
    userId: number,
  ): Promise<{ hasRated: boolean; ratingId: number | null }> {
    const rating = await this.ratingRepository.findOne({
      where: { productId, userId },
    });

    return {
      hasRated: !!rating,
      ratingId: rating?.id || null,
    };
  }
}
