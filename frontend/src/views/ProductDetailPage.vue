<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { Star, Tag, ChevronRight, ArrowUpDown, Calendar } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth.store'
import { useCategoryGradient } from '../composables/useCategoryGradient'
import type { Product } from '../types/product'
import RatingDisplay from '../components/RatingDisplay.vue'
import RatingsList from '../components/RatingsList.vue'
import RatingForm from '../components/RatingForm.vue'

interface RatingItem {
  id: number
  userId: number
  username: string
  avatarUrl: string | null
  pricePerformance: number
  quality: number
  ingredients: number
  packaging: number
  productRating: number
  title: string | null
  comment: string | null
  createdAt: string
  updatedAt: string
  likes: number
  dislikes: number
  userVote: string | null
}

interface RatingAverages {
  pricePerformance: number
  quality: number
  ingredients: number
  packaging: number
  productRating: number
  overall: number
}

const route = useRoute()
const authStore = useAuthStore()
const product = ref<Product | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const ratingsAverages = ref<RatingAverages | null>(null)
const ratingsCount = ref(0)
const ratingsList = ref<RatingItem[]>([])
const ratingsLoading = ref(true)

const userHasRated = ref(false)
const editingRating = ref<RatingItem | null>(null)
const showForm = ref(false)

type SortOption = 'newest' | 'best' | 'points'
const sortBy = ref<SortOption>('newest')
const filterYear = ref<number | null>(null)

const sortOptions: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Neueste' },
  { key: 'best', label: 'Beste' },
  { key: 'points', label: 'Punkte' },
]

const availableYears = computed(() => {
  const years = new Set<number>()
  for (const r of ratingsList.value) {
    years.add(new Date(r.createdAt).getFullYear())
  }
  const result = Array.from(years).sort((a, b) => b - a)
  if (!result.includes(2026)) result.unshift(2026)
  return result
})

const sortedRatings = computed(() => {
  const currentUserId = authStore.user?.id ?? null
  let filtered = [...ratingsList.value]

  if (filterYear.value !== null) {
    filtered = filtered.filter(
      (r) => new Date(r.createdAt).getFullYear() === filterYear.value,
    )
  }

  const own: RatingItem[] = []
  const rest: RatingItem[] = []
  for (const r of filtered) {
    if (currentUserId && r.userId === currentUserId) {
      own.push(r)
    } else {
      rest.push(r)
    }
  }

  rest.sort((a, b) => {
    if (sortBy.value === 'best') return b.productRating - a.productRating
    if (sortBy.value === 'points') return (b.likes - b.dislikes) - (a.likes - a.dislikes)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return [...own, ...rest]
})

const { getGradient } = useCategoryGradient()

const gradient = computed(() => {
  return getGradient(product.value?.category?.name || '')
})

const imageUrl = computed(() => {
  if (!product.value) return ''
  const cat = product.value.category?.name || ''
  const colors: Record<string, [string, string]> = {
    'Electronics': ['1e293b', 'e2e8f0'],
    'Beauty': ['fda4af', '1f2937'],
    'Food & Beverages': ['fbbf24', '1f2937'],
    'Sports & Outdoors': ['34d399', '1f2937'],
    'Home & Garden': ['7dd3fc', '1f2937'],
  }
  const [bg, fg] = colors[cat] || ['e2e8f0', '64748b']
  return `https://placehold.co/800x600/${bg}/${fg}?text=${encodeURIComponent(product.value.name.substring(0, 20))}`
})

const formattedOverallRating = computed(() => {
  return ratingsAverages.value?.overall?.toFixed(1) || null
})

const ringPercent = computed(() => {
  if (!ratingsAverages.value) return 0
  return (ratingsAverages.value.overall / 10) * 100
})

const ringColor = computed(() => {
  if (!ratingsAverages.value) return '#d1d5db'
  const v = ratingsAverages.value.overall
  if (v < 5) return '#ef4444'
  if (v <= 7) return '#f97316'
  return '#10b981'
})

const ringAnimated = ref(false)

watch(ratingsAverages, (val) => {
  if (val) {
    ringAnimated.value = false
    nextTick(() => {
      requestAnimationFrame(() => {
        ringAnimated.value = true
      })
    })
  }
}, { immediate: true })

const circumference = 2 * Math.PI * 42

const ringDasharray = computed(() => {
  if (!ringAnimated.value) return `0 ${circumference}`
  const filled = (ringPercent.value / 100) * circumference
  return `${filled} ${circumference - filled}`
})

const availableUsernames = computed(() => {
  const names = new Set<string>()
  for (const r of ratingsList.value) {
    names.add(r.username)
  }
  return Array.from(names)
})

const existingRatingForForm = computed(() => {
  if (!editingRating.value) return null
  return {
    id: editingRating.value.id,
    productRating: editingRating.value.productRating,
    pricePerformance: editingRating.value.pricePerformance,
    quality: editingRating.value.quality,
    ingredients: editingRating.value.ingredients,
    packaging: editingRating.value.packaging,
    title: editingRating.value.title,
    comment: editingRating.value.comment,
  }
})

onMounted(async () => {
  try {
    const id = route.params.id
    const response = await axios.get(`/api/products/${id}`)
    if (response.data.success) {
      product.value = response.data.data
      loadRatings()
      checkUserStatus()
    } else {
      error.value = 'Produkt nicht gefunden'
    }
  } catch (err) {
    console.error('Failed to load product:', err)
    error.value = 'Produktdetails konnten nicht geladen werden'
  } finally {
    loading.value = false
  }
})

async function loadRatings() {
  if (!product.value) return
  ratingsLoading.value = true
  try {
    const userId = authStore.user?.id
    const url = userId
      ? `/api/products/${product.value.id}/ratings?userId=${userId}`
      : `/api/products/${product.value.id}/ratings`
    const response = await axios.get(url)
    if (response.data.success) {
      const data = response.data.data
      ratingsAverages.value = data.averages
      ratingsCount.value = data.count
      ratingsList.value = data.ratings
    }
  } catch (err) {
    console.error('Failed to load ratings:', err)
  } finally {
    ratingsLoading.value = false
  }
}

async function checkUserStatus() {
  if (!product.value || !authStore.isAuthenticated) return
  try {
    const response = await axios.get(
      `/api/products/${product.value.id}/ratings/user-status`,
      { headers: authStore.getAuthHeader() },
    )
    if (response.data.success) {
      userHasRated.value = response.data.data.hasRated
    }
  } catch {
    // Silently fail
  }
}

function handleRatingSubmitted() {
  userHasRated.value = true
  editingRating.value = null
  showForm.value = false
  loadRatings()
}

function handleEditRating(rating: RatingItem) {
  editingRating.value = rating
  showForm.value = true
}

function handleCancelEdit() {
  editingRating.value = null
  showForm.value = false
}

function handleRatingDeleted() {
  userHasRated.value = false
  editingRating.value = null
  showForm.value = false
  loadRatings()
  checkUserStatus()
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm mb-8">
      <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">Home</router-link>
      <ChevronRight :size="14" class="text-gray-300" />
      <router-link to="/products" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">Produkte</router-link>
      <template v-if="product">
        <ChevronRight :size="14" class="text-gray-300" />
        <span class="text-gray-900 font-medium truncate max-w-[200px]">{{ product.name }}</span>
      </template>
    </nav>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 animate-fade-in">
      <div class="skeleton aspect-[4/3]"></div>
      <div class="flex flex-col justify-center space-y-6">
        <div class="skeleton h-3 w-20"></div>
        <div class="skeleton h-10 w-3/4"></div>
        <div class="skeleton h-4 w-32"></div>
        <div class="skeleton h-4 w-40"></div>
        <div class="skeleton h-px w-full"></div>
        <div class="space-y-2">
          <div class="skeleton h-4 w-24"></div>
          <div class="skeleton h-4 w-full"></div>
          <div class="skeleton h-4 w-5/6"></div>
          <div class="skeleton h-4 w-2/3"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-24">
      <p class="text-gray-900 font-medium mb-1">Fehler</p>
      <p class="text-sm text-gray-400">{{ error }}</p>
    </div>

    <!-- Product Details -->
    <div v-else-if="product" class="animate-fade-in">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <!-- Left: Image + Info -->
        <div class="lg:col-span-5">
          <div :class="['aspect-square rounded-3xl overflow-hidden bg-gradient-to-br mb-6', gradient]">
            <img
              :src="imageUrl"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
          </div>

          <div class="space-y-4">
            <span class="inline-block text-[11px] font-medium text-gray-400 uppercase tracking-widest">
              {{ product.category?.name }}
            </span>

            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
              {{ product.name }}
            </h1>

            <div v-if="product.brand" class="flex items-center gap-2">
              <Tag :size="14" class="text-gray-400" />
              <span class="text-sm text-gray-500">{{ product.brand }}</span>
            </div>

            <div class="h-px bg-gray-100"></div>

            <div>
              <h2 class="text-sm font-medium text-gray-900 mb-2">Beschreibung</h2>
              <p class="text-sm text-gray-500 leading-relaxed">
                {{ product.description || 'Keine Beschreibung verfügbar.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Right: Rating Summary Card -->
        <div class="lg:col-span-7">
          <div class="bg-gray-50 rounded-3xl p-6 md:p-8 lg:sticky lg:top-24">
            <!-- Overall Score Header -->
            <div v-if="formattedOverallRating" class="flex items-center gap-6 mb-8">
              <div class="relative w-24 h-24 shrink-0">
                <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" stroke-width="6" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    :stroke="ringColor"
                    stroke-width="6"
                    stroke-linecap="round"
                    :stroke-dasharray="ringDasharray"
                    style="transition: stroke-dasharray 0.6s ease-out, stroke 0.4s ease"
                  />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-2xl font-bold text-gray-900 leading-none">{{ formattedOverallRating }}</span>
                  <span class="text-[10px] text-gray-400 font-medium mt-0.5">von 10</span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 mb-0.5">Gesamtbewertung</p>
                <p class="text-sm text-gray-500">
                  {{ ratingsCount }} {{ ratingsCount === 1 ? 'Bewertung' : 'Bewertungen' }}
                </p>
              </div>
            </div>

            <div v-else class="flex items-center gap-6 mb-8">
              <div class="relative w-24 h-24 shrink-0">
                <svg class="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" stroke-width="6" />
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center">
                  <span class="text-2xl font-bold text-gray-300 leading-none">–</span>
                </div>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">Noch keine Bewertungen</p>
                <p class="text-[11px] text-gray-400 mt-0.5">Sei der Erste!</p>
              </div>
            </div>

            <!-- Rating Breakdown -->
            <RatingDisplay :averages="ratingsAverages" :count="ratingsCount" />
          </div>
        </div>
      </div>

      <!-- Rating Form Section — always below product -->
      <div class="mt-10 border-t border-gray-100 pt-10">
        <div v-if="!authStore.isAuthenticated" class="text-center py-6">
          <p class="text-sm text-gray-400">
            <router-link to="/login" class="text-red-800 hover:text-red-900 font-medium transition-colors duration-200">Anmelden</router-link>
            um eine Bewertung abzugeben
          </p>
        </div>

        <div v-else-if="showForm || editingRating">
          <h3 class="text-lg font-bold text-gray-900 tracking-tight mb-4">
            {{ editingRating ? 'Bewertung bearbeiten' : 'Deine Bewertung' }}
          </h3>
          <div class="max-w-2xl">
            <RatingForm
              :product-id="product.id"
              :existing-rating="existingRatingForForm"
              :available-usernames="availableUsernames"
              @submitted="handleRatingSubmitted"
              @cancel="handleCancelEdit"
            />
          </div>
        </div>

        <div v-else-if="userHasRated" class="flex items-center gap-3 py-4">
          <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <Star class="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Du hast dieses Produkt bereits bewertet.</p>
            <p class="text-[11px] text-gray-400">Du kannst deine Bewertung unten bearbeiten oder löschen.</p>
          </div>
        </div>

        <div v-else>
          <h3 class="text-lg font-bold text-gray-900 tracking-tight mb-4">Deine Bewertung</h3>
          <div class="max-w-2xl">
            <RatingForm
              :product-id="product.id"
              :available-usernames="availableUsernames"
              @submitted="handleRatingSubmitted"
            />
          </div>
        </div>
      </div>

      <!-- Einzelne Bewertungen -->
      <div v-if="!ratingsLoading && ratingsList.length > 0" class="mt-10 border-t border-gray-100 pt-10">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 class="text-lg font-bold text-gray-900 tracking-tight">Kundenbewertungen</h2>

          <div class="flex flex-wrap items-center gap-2">
            <!-- Sort -->
            <div class="flex items-center gap-1.5">
              <ArrowUpDown :size="14" class="text-gray-400" />
              <button
                v-for="opt in sortOptions"
                :key="opt.key"
                @click="sortBy = opt.key"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-full transition-all duration-200',
                  sortBy === opt.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ]"
              >
                {{ opt.label }}
              </button>
            </div>

            <!-- Year filter -->
            <div v-if="availableYears.length > 0" class="flex items-center gap-1.5">
              <Calendar :size="14" class="text-gray-400" />
              <button
                @click="filterYear = null"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-full transition-all duration-200',
                  filterYear === null
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ]"
              >
                Alle
              </button>
              <button
                v-for="year in availableYears"
                :key="year"
                @click="filterYear = year"
                :class="[
                  'px-3 py-1 text-xs font-medium rounded-full transition-all duration-200',
                  filterYear === year
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                ]"
              >
                {{ year }}
              </button>
            </div>
          </div>
        </div>

        <RatingsList
          :ratings="sortedRatings"
          :product-id="product.id"
          @edit="handleEditRating"
          @deleted="handleRatingDeleted"
          @voted="loadRatings"
        />
      </div>
      <div v-else-if="ratingsLoading" class="mt-10 border-t border-gray-100 pt-10">
        <h2 class="text-lg font-bold text-gray-900 tracking-tight mb-6">Kundenbewertungen</h2>
        <div class="space-y-3">
          <div v-for="i in 3" :key="i" class="skeleton h-32 rounded-2xl"></div>
        </div>
      </div>
    </div>
  </div>
</template>
