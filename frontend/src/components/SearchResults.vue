<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '../stores/search.store'
import { AlertCircle, Package, ArrowRight } from 'lucide-vue-next'
import { useCategoryGradient } from '../composables/useCategoryGradient'

const props = defineProps<{
  query: string
}>()

const router = useRouter()
const store = useSearchStore()
const { getGradient: getCategoryGradient, getTextColor: getCategoryTextColor } = useCategoryGradient()

onMounted(async () => {
  if (props.query && props.query.trim().length >= 2) {
    await store.search(props.query)
  }
})

watch(
  () => props.query,
  async (newQuery) => {
    if (newQuery && newQuery.trim().length >= 2) {
      await store.search(newQuery)
    }
  },
)

const goToProduct = (id: number) => {
  router.push({ name: 'ProductDetail', params: { id: id.toString() } })
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Skeleton Loading -->
    <div v-if="store.loading" class="space-y-3">
      <div class="flex items-center gap-3 mb-8">
        <div class="skeleton h-7 w-40"></div>
        <div class="skeleton h-6 w-8 rounded-full"></div>
      </div>
      <div v-for="i in 4" :key="i" class="p-5 rounded-2xl">
        <div class="flex items-start gap-4">
          <div class="skeleton w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-3 w-32"></div>
            <div class="skeleton h-3 w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="text-center py-24">
      <div class="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
        <AlertCircle class="text-red-400" :size="24" />
      </div>
      <p class="text-gray-900 font-medium mb-1">Suchfehler</p>
      <p class="text-sm text-gray-400">{{ store.error }}</p>
    </div>

    <!-- Results -->
    <div v-else>
      <!-- Header with Badge -->
      <div class="mb-8 flex items-center gap-3">
        <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Suchergebnisse</h1>
        <span
          v-if="store.results.length > 0"
          class="inline-flex items-center justify-center bg-gray-900 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full min-w-[24px]"
        >
          {{ store.results.length }}
        </span>
      </div>
      <p class="text-sm text-gray-400 -mt-6 mb-8">
        für <span class="text-gray-600 font-medium">&ldquo;{{ query }}&rdquo;</span>
      </p>

      <!-- Results List -->
      <div v-if="store.results.length > 0" class="space-y-3">
        <div
          v-for="(result, index) in store.results"
          :key="result.id"
          :class="[
            'group p-5 rounded-2xl hover:bg-white hover:shadow-sm hover:shadow-gray-200/50 transition-all duration-300 cursor-pointer animate-fade-in-up',
            `stagger-${index + 1}`
          ]"
          @click="goToProduct(result.id)"
        >
          <div class="flex items-start gap-4">
            <!-- Thumbnail -->
            <div
              :class="[
                'w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 bg-gradient-to-br flex items-center justify-center',
                getCategoryGradient(result.category)
              ]"
            >
              <span :class="['text-sm font-bold', getCategoryTextColor(result.category)]">
                {{ result.name.substring(0, 2).toUpperCase() }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="text-[15px] font-medium text-gray-900 group-hover:text-gray-600 transition-colors duration-200 mb-1">
                {{ result.name }}
              </h3>
              <p v-if="result.brand" class="text-xs text-gray-400 mb-2">
                {{ result.brand }}
                <span v-if="result.category"> &middot; {{ result.category }}</span>
              </p>
              <p v-if="result.description" class="text-sm text-gray-500 leading-relaxed">
                {{ truncateText(result.description, 120) }}
              </p>
            </div>
            <ArrowRight class="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0 mt-2" />
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div v-else class="text-center py-24">
        <div class="w-16 h-16 mx-auto mb-5 bg-gray-100 rounded-2xl flex items-center justify-center">
          <Package class="w-7 h-7 text-gray-400" />
        </div>
        <p class="text-gray-900 font-medium mb-1">Keine Ergebnisse</p>
        <p class="text-sm text-gray-400">
          Keine Produkte für &ldquo;{{ query }}&rdquo; gefunden.
          <br />Versuche es mit anderen Suchbegriffen.
        </p>
      </div>
    </div>
  </div>
</template>
