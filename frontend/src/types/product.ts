export interface ProductImage {
  id: number
  path: string
  isPrimary: boolean
  displayOrder: number
}

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string | null
  brand: string | null
  category: Category
  images: ProductImage[]
  rating: number
  reviewCount: number
  isFeatured: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchSuggestion {
  id: number
  name: string
  brand: string | null
  category: string
}

export interface ProductListResponse {
  success: boolean
  data: Product[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
    timestamp: string
    version: string
  }
}

export interface ProductDetailResponse {
  success: boolean
  data: Product
  meta: {
    timestamp: string
    version: string
  }
}

export interface SearchResult {
  id: number
  name: string
  brand: string | null
  description: string | null
  category: string
  category_id: number
}
