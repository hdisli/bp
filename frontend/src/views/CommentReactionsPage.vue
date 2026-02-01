<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useProfileCommentsStore, type ReactionType, type ReactionDetail } from '../stores/profile-comments.store'
import { useReactions } from '../composables/useReactions'
import { ArrowLeft, MessageSquare, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const profileCommentsStore = useProfileCommentsStore()
const { getReactionEmoji, getReactionLabel } = useReactions()

const profileUserId = computed(() => Number(route.params.userId))
const commentId = computed(() => Number(route.params.commentId))
const reactions = ref<ReactionDetail[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadReactions() {
  isLoading.value = true
  error.value = null

  try {
    const details = await profileCommentsStore.fetchReactionDetails(
      profileUserId.value,
      commentId.value
    )
    reactions.value = details
  } catch (err) {
    error.value = 'Reaktionen konnten nicht geladen werden.'
    if (err instanceof Error) {
      console.error('Load reactions error:', err.message, err.stack)
    } else {
      console.error('Unknown error:', err)
    }
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadReactions()
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
      <router-link to="/" class="hover:text-gray-600 transition-colors duration-200">
        Home
      </router-link>
      <ChevronRight :size="14" />
      <router-link
        :to="`/profile/${profileUserId}`"
        class="hover:text-gray-600 transition-colors duration-200"
      >
        Profil
      </router-link>
      <ChevronRight :size="14" />
      <span class="text-gray-900 font-medium truncate">Reaktionen</span>
    </nav>

    <!-- Header -->
    <div class="mb-6">
      <button
        @click="goBack"
        class="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4"
      >
        <ArrowLeft :size="16" />
        Zurück
      </button>
      <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Alle Reaktionen</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-2xl p-6 space-y-3">
        <div class="h-6 w-32 skeleton rounded-xl"></div>
        <div class="space-y-2">
          <div v-for="j in 3" :key="j" class="h-12 skeleton rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <MessageSquare :size="28" class="text-gray-400" />
      </div>
      <p class="text-sm font-medium text-gray-900 mb-1">Fehler</p>
      <p class="text-sm text-gray-400">{{ error }}</p>
    </div>

    <!-- Empty -->
    <div v-else-if="reactions.length === 0" class="text-center py-12">
      <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <MessageSquare :size="28" class="text-gray-400" />
      </div>
      <p class="text-sm font-medium text-gray-900 mb-1">Keine Reaktionen</p>
      <p class="text-sm text-gray-400">Dieser Kommentar hat noch keine Reaktionen.</p>
    </div>

    <!-- Reactions List -->
    <div v-else class="space-y-4">
      <div
        v-for="reactionGroup in reactions"
        :key="reactionGroup.type"
        class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <!-- Reaction Type Header -->
        <div class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <span class="text-3xl">{{ getReactionEmoji(reactionGroup.type) }}</span>
          <div>
            <h2 class="text-base font-bold text-gray-900 tracking-tight">
              {{ getReactionLabel(reactionGroup.type) }}
            </h2>
            <p class="text-sm text-gray-400">{{ reactionGroup.totalCount }} {{ reactionGroup.totalCount === 1 ? 'Person' : 'Personen' }}</p>
          </div>
        </div>

        <!-- Users List -->
        <div class="space-y-2">
          <router-link
            v-for="user in reactionGroup.users"
            :key="user.id"
            :to="`/profile/${user.id}`"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
          >
            <!-- Avatar -->
            <div
              v-if="user.avatarUrl"
              class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white flex-shrink-0"
            >
              <img :src="user.avatarUrl" :alt="user.username" class="w-full h-full object-cover" />
            </div>
            <div
              v-else
              class="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-white flex-shrink-0"
            >
              <span class="text-sm font-bold text-white">
                {{ user.username.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Username -->
            <span class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200">
              {{ user.username }}
            </span>
          </router-link>
        </div>

        <!-- "und X weitere" Hinweis -->
        <div
          v-if="reactionGroup.hasMore"
          class="mt-4 pt-4 border-t border-gray-100 text-center"
        >
          <p class="text-sm text-gray-400">
            und {{ reactionGroup.totalCount - reactionGroup.users.length }} weitere
          </p>
          <p class="text-xs text-gray-400 mt-1">Maximal 50 Nutzer werden angezeigt</p>
        </div>
      </div>
    </div>
  </div>
</template>
