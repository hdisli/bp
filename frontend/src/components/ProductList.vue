<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useProductsStore } from '../stores/products.store'
import ProductCard from './ProductCard.vue'
import { Package } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  categoryFilter?: string
}>(), {
  categoryFilter: 'Alle',
})

const store = useProductsStore()

onMounted(() => {
  store.fetchProducts()
})

const filteredProducts = computed(() => {
  if (props.categoryFilter === 'Alle') {
    return store.products
  }
  return store.products.filter(p => p.category?.name === props.categoryFilter)
})
</script>

<template>
  <div>
    <!-- Skeleton Loading -->
    <div v-if="store.loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
      <div v-for="i in 8" :key="i" class="animate-fade-in">
        <div class="skeleton aspect-[4/3] mb-4"></div>
        <div class="space-y-2.5">
          <div class="skeleton h-3 w-16"></div>
          <div class="skeleton h-4 w-3/4"></div>
          <div class="skeleton h-3 w-24"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="max-w-md mx-auto text-center py-24">
      <div class="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
        <svg class="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-gray-900 font-medium mb-1">Fehler beim Laden</p>
      <p class="text-sm text-gray-400 mb-6">{{ store.error }}</p>
      <button
        @click="store.fetchProducts()"
        class="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors duration-200"
      >
        Erneut versuchen
      </button>
    </div>

    <!-- Products Grid -->
    <div v-else-if="filteredProducts.length > 0" :key="categoryFilter" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
      <ProductCard
        v-for="(product, index) in filteredProducts"
        :key="product.id"
        :product="product"
        :index="index"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-24">
      <div class="w-16 h-16 mx-auto mb-5 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Package class="w-7 h-7 text-gray-400" />
      </div>
      <p class="text-gray-900 font-medium mb-1">Keine Produkte gefunden</p>
      <p class="text-sm text-gray-400">
        {{ categoryFilter !== 'Alle' ? `Keine Produkte in "${categoryFilter}" verfügbar.` : 'Aktuell sind keine Produkte verfügbar.' }}
      </p>
    </div>
  </div>
</template>
