export class ProductImageDto {
  id: number;
  path: string;
  isPrimary: boolean;
  displayOrder: number;
}

export class CategoryDto {
  id: number;
  name: string;
}

export class ProductDto {
  id: number;
  name: string;
  description: string | null;
  brand: string | null;
  category: CategoryDto;
  images: ProductImageDto[];
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductListResponseDto {
  success: boolean;
  data: ProductDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    timestamp: string;
    version: string;
  };
}

export class ProductDetailResponseDto {
  success: boolean;
  data: ProductDto;
  meta: {
    timestamp: string;
    version: string;
  };
}
