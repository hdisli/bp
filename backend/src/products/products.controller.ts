import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Logger,
  HttpStatus,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ProductDto,
  ProductImageDto,
  CategoryDto,
  ProductListResponseDto,
  ProductDetailResponseDto,
} from './dto/product-response.dto';
import { Product } from './entities/product.entity';

@Controller('api/products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * GET /api/products
   * Get all products with pagination
   */
  @Get()
  async getAllProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ProductListResponseDto> {
    try {
      const pageNum = page ? parseInt(page, 10) : 1;
      const limitNum = limit ? parseInt(limit, 10) : 50;

      if (isNaN(pageNum) || pageNum < 1) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_PAGE',
            message: 'Parameter "page" must be an integer >= 1',
            statusCode: 400,
          },
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'Parameter "limit" must be an integer between 1 and 100',
            statusCode: 400,
          },
        });
      }

      this.logger.log(`GET /api/products - Page: ${pageNum}, Limit: ${limitNum}`);

      const result = await this.productsService.findAll(pageNum, limitNum);

      const productDtos: ProductDto[] = result.products.map((product) =>
        this.transformToDto(product),
      );

      return {
        success: true,
        data: productDtos,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching products', error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch products',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/products/featured
   * Get featured products for homepage
   */
  @Get('featured')
  async getFeaturedProducts(@Query('limit') limit?: string): Promise<ProductListResponseDto> {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 6;

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        throw new BadRequestException({
          success: false,
          error: {
            code: 'INVALID_LIMIT',
            message: 'Parameter "limit" must be an integer between 1 and 100',
            statusCode: 400,
          },
        });
      }

      this.logger.log(`GET /api/products/featured - Limit: ${limitNum}`);

      const products = await this.productsService.findFeatured(limitNum);

      const productDtos: ProductDto[] = products.map((product) => this.transformToDto(product));

      return {
        success: true,
        data: productDtos,
        meta: {
          total: products.length,
          page: 1,
          limit: limitNum,
          totalPages: 1,
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error fetching featured products', error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch featured products',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /api/products/:id
   * Get single product by ID
   */
  @Get(':id')
  async getProductById(@Param('id', ParseIntPipe) id: number): Promise<ProductDetailResponseDto> {
    try {
      this.logger.log(`GET /api/products/${id}`);

      const product = await this.productsService.findById(id);
      const productDto = this.transformToDto(product);

      return {
        success: true,
        data: productDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1',
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error fetching product ${id}`, error.stack);
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch product',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          },
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transform Product entity to DTO
   */
  private transformToDto(product: Product): ProductDto {
    const categoryDto: CategoryDto = {
      id: product.category.id,
      name: product.category.name,
    };

    const imageDtos: ProductImageDto[] = product.images.map((image) => ({
      id: image.id,
      path: image.path,
      isPrimary: image.isPrimary,
      displayOrder: image.displayOrder,
    }));

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      brand: product.brand,
      category: categoryDto,
      images: imageDtos,
      rating: Number(product.rating) || 0,
      reviewCount: product.reviewCount || 0,
      isFeatured: product.isFeatured || false,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
