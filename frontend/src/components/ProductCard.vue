<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Star } from 'lucide-vue-next'
import type { Product } from '../types/product'
import { useCategoryGradient } from '../composables/useCategoryGradient'

const props = withDefaults(defineProps<{
  product: Product
  variant?: 'default' | 'featured'
  index?: number
}>(), {
  variant: 'default',
  index: 0,
})

const router = useRouter()
const { getGradient } = useCategoryGradient()

const primaryImage = computed(() => {
  const primary = props.product.images.find(img => img.isPrimary)
  return primary?.path || props.product.images[0]?.path
})

const gradient = computed(() => {
  return getGradient(props.product.category?.name || '')
})

const imageUrl = computed(() => {
  const cat = props.product.category?.name || ''
  const colors: Record<string, [string, string]> = {
    'Electronics': ['1e293b', 'e2e8f0'],
    'Beauty': ['fda4af', '1f2937'],
    'Food & Beverages': ['fbbf24', '1f2937'],
    'Sports & Outdoors': ['34d399', '1f2937'],
    'Home & Garden': ['7dd3fc', '1f2937'],
  }
  const [bg, fg] = colors[cat] || ['e2e8f0', '64748b']
  return `https://placehold.co/600x400/${bg}/${fg}?text=${encodeURIComponent(props.product.name.substring(0, 15))}`
})

const formattedRating = computed(() => {
  return props.product.rating?.toFixed(1) || '0.0'
})

const formattedReviewCount = computed(() => {
  const count = props.product.reviewCount || 0
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
})

const staggerClass = computed(() => {
  if (props.index >= 0 && props.index <= 14) {
    return `stagger-${props.index + 1}`
  }
  return ''
})

const viewDetails = () => {
  router.push(`/product/${props.product.id}`)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image'
}
</script>

<template>
  <div
    @click="viewDetails"
    :class="['group cursor-pointer animate-fade-in-up', staggerClass]"
  >
    <!-- Image Container -->
    <div :class="['relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-gradient-to-br', gradient]">
      <img
        :src="imageUrl"
        :alt="product.name"
        @error="handleImageError"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
      />

      <!-- Brand Badge -->
      <div
        v-if="product.brand"
        class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-[11px] font-medium px-2.5 py-1 rounded-full"
      >
        {{ product.brand }}
      </div>
    </div>

    <!-- Content -->
    <div class="space-y-1.5">
      <span class="text-[11px] font-medium text-gray-400 uppercase tracking-widest">
        {{ product.category?.name || 'Uncategorized' }}
      </span>

      <h3 class="text-[15px] font-medium text-gray-900 group-hover:text-gray-600 transition-colors duration-300 line-clamp-2 leading-snug">
        {{ product.name }}
      </h3>

      <div v-if="product.reviewCount > 0" class="flex items-center gap-1.5 pt-0.5">
        <Star class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span class="text-xs font-medium text-gray-700">{{ formattedRating }}</span>
        <span class="text-xs text-gray-400">({{ formattedReviewCount }})</span>
      </div>

      <p
        v-if="variant === 'featured' && product.description"
        class="text-sm text-gray-500 line-clamp-2 leading-relaxed pt-0.5"
      >
        {{ product.description }}
      </p>
    </div>
  </div>
</template>
