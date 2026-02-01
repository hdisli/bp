<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, X } from 'lucide-vue-next'
import axios from 'axios'
import type { SearchSuggestion } from '../types/product'
import { useCategoryGradient } from '../composables/useCategoryGradient'

const router = useRouter()
const route = useRoute()
const searchInput = ref('')
const loading = ref(false)
const suggestions = ref<SearchSuggestion[]>([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const { getGradient: getCategoryGradient, getTextColor: getCategoryTextColor } = useCategoryGradient()

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => route.query.q,
  (newQuery) => {
    if (typeof newQuery === 'string') {
      searchInput.value = newQuery
    } else if (route.name !== 'Search') {
      searchInput.value = ''
    }
  },
  { immediate: true }
)

const fetchSuggestions = async (query: string) => {
  if (query.trim().length < 1) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  try {
    const response = await axios.get(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`)

    if (response.data.success && response.data.data) {
      suggestions.value = response.data.data.slice(0, 8)
      showSuggestions.value = suggestions.value.length > 0
      selectedIndex.value = -1
    }
  } catch {
    suggestions.value = []
  }
}

const debouncedFetchSuggestions = (query: string) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => fetchSuggestions(query), 150)
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchInput.value = target.value
  debouncedFetchSuggestions(target.value)
}

const executeSearch = (query: string) => {
  if (query.trim().length < 2) return

  showSuggestions.value = false
  loading.value = true
  router.push({ name: 'Search', query: { q: query.trim() } }).finally(() => {
    loading.value = false
  })
}

const selectSuggestion = (suggestion: SearchSuggestion) => {
  searchInput.value = suggestion.name
  showSuggestions.value = false
  executeSearch(suggestion.name)
}

const clearSearch = () => {
  searchInput.value = ''
  suggestions.value = []
  showSuggestions.value = false
  router.push('/')
}

const onKeyDown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || suggestions.value.length === 0) {
    if (event.key === 'Enter' && searchInput.value.trim().length >= 2) {
      executeSearch(searchInput.value)
    }
    return
  }

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedIndex.value])
      } else if (searchInput.value.trim().length >= 2) {
        executeSearch(searchInput.value)
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedIndex.value = -1
      break
  }
}

const onFocus = () => {
  if (suggestions.value.length > 0) {
    showSuggestions.value = true
  }
}

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})
</script>

<template>
  <div ref="containerRef" class="flex-1 max-w-lg relative">
    <div class="relative">
      <div class="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search class="text-gray-400" :size="18" />
      </div>
      <input
        ref="inputRef"
        :value="searchInput"
        @input="handleInput"
        @keydown="onKeyDown"
        @focus="onFocus"
        type="text"
        placeholder="Produkte suchen..."
        class="w-full pl-10 pr-10 py-2 bg-gray-100 border-0 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-300"
        autocomplete="off"
      />
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        <button
          v-if="searchInput"
          @click="clearSearch"
          class="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-0.5 rounded-full hover:bg-gray-200"
          aria-label="Clear search"
        >
          <X :size="14" />
        </button>
        <div
          v-if="loading"
          class="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
        ></div>
      </div>

      <!-- Suggestions Dropdown -->
      <div
        v-if="showSuggestions && suggestions.length > 0"
        class="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-50 animate-slide-down"
      >
        <ul class="py-1.5">
          <li
            v-for="(suggestion, index) in suggestions"
            :key="suggestion.id"
            @click="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
            :class="[
              'px-4 py-2.5 cursor-pointer transition-colors duration-150 flex items-center gap-3',
              selectedIndex === index ? 'bg-gray-50' : ''
            ]"
          >
            <div
              :class="[
                'w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br flex items-center justify-center',
                getCategoryGradient(suggestion.category)
              ]"
            >
              <span :class="['text-[10px] font-bold', getCategoryTextColor(suggestion.category)]">
                {{ suggestion.name.substring(0, 2).toUpperCase() }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-900 truncate">
                {{ suggestion.name }}
              </div>
              <div class="text-xs text-gray-400 truncate">
                {{ suggestion.brand }} &middot; {{ suggestion.category }}
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
