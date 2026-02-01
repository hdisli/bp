import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Rating } from '../ratings/entities/rating.entity';
import { RATING_WEIGHTS_SQL } from '../common/constants/rating-weights';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  private async enrichWithRatings(products: Product[]): Promise<Product[]> {
    if (products.length === 0) return products;

    const productIds = products.map((p) => p.id);

    const ratingStats = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('rating.product_id', 'productId')
      .addSelect(RATING_WEIGHTS_SQL, 'overall')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.product_id IN (:...productIds)', { productIds })
      .groupBy('rating.product_id')
      .getRawMany();

    const statsMap: Record<number, { rating: number; count: number }> = {};
    for (const row of ratingStats) {
      statsMap[parseInt(row.productId, 10)] = {
        rating: parseFloat(parseFloat(row.overall).toFixed(1)),
        count: parseInt(row.count, 10),
      };
    }

    for (const product of products) {
      const stats = statsMap[product.id];
      if (stats) {
        product.rating = stats.rating;
        product.reviewCount = stats.count;
      } else {
        product.rating = 0;
        product.reviewCount = 0;
      }
    }

    return products;
  }

  /**
   * Find all products with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 50,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(`Fetching products - Page: ${page}, Limit: ${limit}`);

    const [products, total] = await this.productRepository.findAndCount({
      relations: ['category', 'images'],
      order: {
        createdAt: 'DESC',
        images: {
          displayOrder: 'ASC',
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    await this.enrichWithRatings(products);

    this.logger.log(`Found ${products.length} products (Total: ${total}, Pages: ${totalPages})`);

    return {
      products,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find product by ID with all relations
   */
  async findById(id: number): Promise<Product> {
    this.logger.log(`Fetching product by ID: ${id}`);

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'images'],
      order: {
        images: {
          displayOrder: 'ASC',
        },
      },
    });

    if (!product) {
      this.logger.warn(`Product with ID ${id} not found`);
      throw new NotFoundException({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: `Product with ID ${id} not found`,
          statusCode: 404,
        },
      });
    }

    await this.enrichWithRatings([product]);

    this.logger.log(`Product found: ${product.name} (${product.images.length} images)`);

    return product;
  }

  /**
   * Find featured products for homepage
   */
  async findFeatured(limit: number = 6): Promise<Product[]> {
    this.logger.log(`Fetching featured products - Limit: ${limit}`);

    const products = await this.productRepository.find({
      where: { isFeatured: true },
      relations: ['category', 'images'],
      order: {
        images: {
          displayOrder: 'ASC',
        },
      },
      take: limit,
    });

    await this.enrichWithRatings(products);

    this.logger.log(`Found ${products.length} featured products`);

    return products;
  }
}
