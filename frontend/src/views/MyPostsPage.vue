<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { ChevronRight, Star, MessageSquare, User as UserIcon } from 'lucide-vue-next'
import { useCategoryGradient } from '../composables/useCategoryGradient'
import type { ActivityItem } from '../types/profile'

const authStore = useAuthStore()
const { getGradientClasses, getTextClass } = useCategoryGradient()

const activeTab = ref<'ratings' | 'comments'>('ratings')
const page = ref(1)
const limit = 20

const items = ref<ActivityItem[]>([])
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
})
const isLoading = ref(false)
const error = ref<string | null>(null)

const ratingsCount = computed(() => {
  if (activeTab.value === 'ratings') return pagination.value.total
  // Hole count aus erster Anfrage
  return items.value.length
})

const commentsCount = computed(() => {
  if (activeTab.value === 'comments') return pagination.value.total
  return items.value.filter(i => i.comment).length
})

async function loadActivity() {
  if (!authStore.user) return

  error.value = null
  isLoading.value = true

  try {
    const type = activeTab.value === 'comments' ? 'comments' : 'ratings'
    const response = await fetch(
      `/api/users/${authStore.user.id}/activity?page=${page.value}&limit=${limit}&type=${type}`,
      { credentials: 'include' }
    )
    const data = await response.json()

    if (data.success) {
      items.value = data.data.items
      pagination.value = data.data.pagination
    } else {
      error.value = data.error?.message || 'Fehler beim Laden der Aktivität.'
    }
  } catch (err) {
    error.value = 'Netzwerkfehler beim Laden der Aktivität.'
    console.error('Load activity error:', err)
  } finally {
    isLoading.value = false
  }
}

function changeTab(tab: 'ratings' | 'comments') {
  activeTab.value = tab
  page.value = 1
  loadActivity()
}

function changePage(newPage: number) {
  page.value = newPage
  loadActivity()
}

onMounted(() => {
  loadActivity()
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm mb-8" aria-label="Breadcrumb">
      <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">Home</router-link>
      <ChevronRight :size="14" class="text-gray-300" />
      <span class="text-gray-900 font-medium truncate">Meine Beiträge</span>
    </nav>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 tracking-tight">Meine Beiträge</h1>
      <p class="text-sm text-gray-500 mt-2">Übersicht deiner Bewertungen und Kommentare</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        @click="changeTab('ratings')"
        class="px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200"
        :class="
          activeTab === 'ratings'
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
      >
        Meine Bewertungen
        <span
          v-if="ratingsCount > 0"
          class="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full"
          :class="activeTab === 'ratings' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
        >
          {{ ratingsCount }}
        </span>
      </button>
      <button
        @click="changeTab('comments')"
        class="px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200"
        :class="
          activeTab === 'comments'
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
      >
        Meine Kommentare
        <span
          v-if="commentsCount > 0"
          class="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full"
          :class="activeTab === 'comments' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'"
        >
          {{ commentsCount }}
        </span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-24 skeleton rounded-2xl"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-sm text-red-500" role="alert">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="flex flex-col items-center py-20">
      <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <component :is="activeTab === 'ratings' ? Star : MessageSquare" :size="28" class="text-gray-400" />
      </div>
      <p class="text-sm font-medium text-gray-900">Keine {{ activeTab === 'ratings' ? 'Bewertungen' : 'Kommentare' }}</p>
      <p class="text-sm text-gray-400 mt-1">
        Du hast noch keine {{ activeTab === 'ratings' ? 'Bewertungen' : 'Kommentare' }} geschrieben.
      </p>
    </div>

    <!-- Items List -->
    <div v-else class="space-y-3">
      <!-- Bewertungen -->
      <template v-if="activeTab === 'ratings'">
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-2xl p-5 hover:shadow-sm transition-shadow duration-200"
        >
          <div class="flex items-start gap-4">
            <!-- Gradient Placeholder -->
            <div
              class="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
              :class="getGradientClasses(item.category)"
            >
              <Star :size="24" :class="getTextClass(item.category)" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <router-link
                :to="`/product/${item.productId}`"
                class="text-[15px] font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 block truncate"
              >
                {{ item.productName }}
              </router-link>

              <div class="flex items-center gap-2 mt-1">
                <span
                  class="inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest rounded-full bg-gray-900 text-white"
                >
                  {{ item.category }}
                </span>
                <span class="text-xs text-gray-400">&middot;</span>
                <div class="flex items-center gap-1">
                  <Star :size="14" class="fill-amber-400 text-amber-400" />
                  <span class="text-sm font-semibold text-gray-900">{{ item.overall.toFixed(1) }}</span>
                  <span class="text-xs text-gray-400">/ 10</span>
                </div>
              </div>

              <p class="text-sm text-gray-400 mt-2">
                {{ new Date(item.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- Kommentare -->
      <template v-else>
        <div
          v-for="item in items"
          :key="item.id"
          class="bg-white rounded-2xl p-5 hover:shadow-sm transition-shadow duration-200"
        >
          <div class="flex items-start gap-4">
            <!-- Gradient Placeholder -->
            <div
              class="w-16 h-16 rounded-xl flex-shrink-0 flex items-center justify-center"
              :class="getGradientClasses(item.category)"
            >
              <MessageSquare :size="24" :class="getTextClass(item.category)" />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <router-link
                :to="`/product/${item.productId}`"
                class="text-[15px] font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 block truncate"
              >
                {{ item.productName }}
              </router-link>

              <div class="flex items-center gap-2 mt-1 mb-2">
                <span
                  class="inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-widest rounded-full bg-gray-900 text-white"
                >
                  {{ item.category }}
                </span>
              </div>

              <p class="text-sm text-gray-600 leading-relaxed line-clamp-2">{{ item.comment }}</p>

              <p class="text-sm text-gray-400 mt-2">
                {{ new Date(item.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.totalPages > 1 && !isLoading && !error"
      class="flex items-center justify-between mt-8 pt-6 border-t border-gray-100"
    >
      <p class="text-sm text-gray-400">
        Seite {{ pagination.page }} von {{ pagination.totalPages }}
      </p>
      <div class="flex gap-2">
        <button
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
          class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Zurück
        </button>
        <button
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
          class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Weiter
        </button>
      </div>
    </div>
  </div>
</template>
