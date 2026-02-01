import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Product, ProductListResponse, ProductDetailResponse } from '../types/product'

export const useProductsStore = defineStore('products', () => {
  // State
  const products = ref<Product[]>([])
  const featuredProducts = ref<Product[]>([])
  const loading = ref(false)
  const featuredLoading = ref(false)
  const error = ref<string | null>(null)

  // API base URL - Falls back to localhost if env var not set
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  /**
   * Fetch all products from API
   */
  const fetchProducts = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get<ProductListResponse>(`${apiUrl}/api/products`)

      if (response.data.success) {
        products.value = response.data.data
      } else {
        throw new Error('API returned success: false')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      error.value = `Failed to load products: ${errorMessage}`
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch featured products from API
   */
  const fetchFeaturedProducts = async (limit: number = 6) => {
    featuredLoading.value = true
    error.value = null

    try {
      const response = await axios.get<ProductListResponse>(`${apiUrl}/api/products/featured?limit=${limit}`)

      if (response.data.success) {
        featuredProducts.value = response.data.data
      } else {
        throw new Error('API returned success: false')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      featuredProducts.value = []
    } finally {
      featuredLoading.value = false
    }
  }

  /**
   * Fetch single product by ID
   */
  const getProductById = async (id: number): Promise<Product | null> => {
    try {
      const response = await axios.get<ProductDetailResponse>(`${apiUrl}/api/products/${id}`)

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error('API returned success: false')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return null
    }
  }

  return {
    // State
    products,
    featuredProducts,
    loading,
    featuredLoading,
    error,

    // Actions
    fetchProducts,
    fetchFeaturedProducts,
    getProductById,
  }
})
