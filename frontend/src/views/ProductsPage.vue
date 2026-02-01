<script setup lang="ts">
import { ref } from 'vue'
import ProductList from '../components/ProductList.vue'

const categories = ['Alle', 'Electronics', 'Beauty', 'Food & Beverages', 'Sports & Outdoors', 'Home & Garden']
const activeCategory = ref('Alle')
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
    <div class="mb-10">
      <p class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Katalog</p>
      <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Alle Produkte</h1>
    </div>

    <!-- Category Filter Tabs -->
    <div class="mb-10 -mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div class="flex gap-2 min-w-max">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="activeCategory = cat"
          :class="[
            'px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 whitespace-nowrap',
            activeCategory === cat
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          ]"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <ProductList :category-filter="activeCategory" />
  </div>
</template>
