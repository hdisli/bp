import { IsNumber, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

export class CreateRatingDto {
  @IsNumber()
  @Min(1.0, { message: 'Price performance must be at least 1.0' })
  @Max(10.0, { message: 'Price performance must be at most 10.0' })
  pricePerformance: number;

  @IsNumber()
  @Min(1.0, { message: 'Quality must be at least 1.0' })
  @Max(10.0, { message: 'Quality must be at most 10.0' })
  quality: number;

  @IsNumber()
  @Min(1.0, { message: 'Ingredients must be at least 1.0' })
  @Max(10.0, { message: 'Ingredients must be at most 10.0' })
  ingredients: number;

  @IsNumber()
  @Min(1.0, { message: 'Packaging must be at least 1.0' })
  @Max(10.0, { message: 'Packaging must be at most 10.0' })
  packaging: number;

  @IsNumber()
  @Min(1.0, { message: 'Product rating must be at least 1.0' })
  @Max(10.0, { message: 'Product rating must be at most 10.0' })
  productRating: number;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Title must be at most 100 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Comment must be at most 500 characters' })
  comment?: string;
}
