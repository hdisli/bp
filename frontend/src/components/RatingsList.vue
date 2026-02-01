<script setup lang="ts">
import { ref, computed } from 'vue'
import { ThumbsUp, ThumbsDown, Pencil, Trash2 } from 'lucide-vue-next'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

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

const props = defineProps<{
  ratings: RatingItem[]
  productId: number
}>()

const emit = defineEmits<{
  edit: [rating: RatingItem]
  deleted: []
  voted: []
}>()

const authStore = useAuthStore()
const deleteConfirmId = ref<number | null>(null)
const votingId = ref<number | null>(null)

const currentUserId = computed(() => authStore.user?.id ?? null)

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function scoreBg(value: number): string {
  if (value < 5.0) return 'bg-red-500'
  if (value <= 7.0) return 'bg-orange-400'
  return 'bg-emerald-500'
}

function scoreColor(value: number): string {
  if (value < 5.0) return 'text-red-600'
  if (value <= 7.0) return 'text-orange-500'
  return 'text-emerald-600'
}

function voteDiff(rating: RatingItem): number {
  return rating.likes - rating.dislikes
}

function voteDiffColor(diff: number): string {
  if (diff > 0) return 'text-emerald-600'
  if (diff < 0) return 'text-red-500'
  return 'text-gray-400'
}

interface CommentSegment {
  type: 'text' | 'mention' | 'bold' | 'italic' | 'break'
  value: string
}

function parseComment(text: string | null): CommentSegment[] {
  if (!text) return []
  const segments: CommentSegment[] = []
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(@(\w+))|(\n)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }

    if (match[1]) {
      segments.push({ type: 'bold', value: match[2] })
    } else if (match[3]) {
      segments.push({ type: 'italic', value: match[4] })
    } else if (match[5]) {
      segments.push({ type: 'mention', value: match[6] })
    } else if (match[7]) {
      segments.push({ type: 'break', value: '' })
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}

async function handleVote(ratingId: number, type: 'like' | 'dislike') {
  if (!authStore.isAuthenticated || votingId.value === ratingId) return

  votingId.value = ratingId
  try {
    await axios.post(
      `/api/products/${props.productId}/ratings/${ratingId}/vote`,
      { type },
      { headers: authStore.getAuthHeader() },
    )
    emit('voted')
  } catch {
    // vote failed
  } finally {
    votingId.value = null
  }
}

async function handleDelete(ratingId: number) {
  try {
    await axios.delete(
      `/api/products/${props.productId}/ratings/${ratingId}`,
      { headers: authStore.getAuthHeader() },
    )
    deleteConfirmId.value = null
    emit('deleted')
  } catch {
    // delete failed
  }
}
</script>

<template>
  <div v-if="ratings.length > 0" class="space-y-3">
    <div
      v-for="rating in ratings"
      :key="rating.id"
      :class="[
        'rounded-2xl p-4 transition-all duration-200',
        currentUserId === rating.userId
          ? 'bg-gray-50 ring-1 ring-gray-200'
          : 'bg-white ring-1 ring-gray-100 hover:ring-gray-200',
      ]"
    >
      <!-- Top row: Avatar + Name + Score badge + Actions -->
      <div class="flex items-start gap-3">
        <!-- Avatar -->
        <router-link :to="`/profile/${rating.userId}`" class="flex-shrink-0 mt-0.5">
          <img
            v-if="rating.avatarUrl"
            :src="rating.avatarUrl"
            :alt="rating.username"
            class="w-9 h-9 rounded-full object-cover ring-2 ring-white hover:ring-gray-200 transition-all duration-200"
          />
          <div
            v-else
            class="w-9 h-9 bg-gray-900 rounded-full flex items-center justify-center ring-2 ring-white hover:ring-gray-200 transition-all duration-200"
          >
            <span class="text-white text-xs font-medium">{{ rating.username.charAt(0).toUpperCase() }}</span>
          </div>
        </router-link>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Name row -->
          <div class="flex items-center justify-between gap-2 mb-1">
            <div class="flex items-center gap-2 min-w-0">
              <router-link
                :to="`/profile/${rating.userId}`"
                class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 truncate"
              >
                {{ rating.username }}
              </router-link>
              <span class="text-[11px] text-gray-400 shrink-0">{{ formatDate(rating.createdAt) }}</span>
              <span
                v-if="rating.updatedAt && rating.updatedAt !== rating.createdAt"
                class="text-[10px] text-gray-400 shrink-0"
              >(bearbeitet)</span>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <!-- Edit/Delete -->
              <template v-if="currentUserId === rating.userId">
                <button
                  @click="emit('edit', rating)"
                  class="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Bearbeiten"
                  aria-label="Bewertung bearbeiten"
                >
                  <Pencil :size="13" />
                </button>
                <button
                  @click="deleteConfirmId = rating.id"
                  class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                  title="Löschen"
                  aria-label="Bewertung löschen"
                >
                  <Trash2 :size="13" />
                </button>
              </template>

              <!-- Score badge -->
              <div
                :class="[
                  'ml-1 flex items-center justify-center w-10 h-10 rounded-xl text-white font-bold text-sm',
                  scoreBg(rating.productRating),
                ]"
              >
                {{ rating.productRating.toFixed(1) }}
              </div>
            </div>
          </div>

          <!-- Sub-scores inline -->
          <div class="flex items-center gap-3 mb-2">
            <div
              v-for="sub in [
                { label: 'P/L', value: rating.pricePerformance },
                { label: 'Qual.', value: rating.quality },
                { label: 'Inhalte', value: rating.ingredients },
                { label: 'Verp.', value: rating.packaging },
              ]"
              :key="sub.label"
              class="flex items-center gap-1"
            >
              <span class="text-[10px] text-gray-400 font-medium">{{ sub.label }}</span>
              <span :class="['text-[11px] font-semibold', scoreColor(sub.value)]">{{ sub.value.toFixed(1) }}</span>
            </div>
          </div>

          <!-- Delete Confirmation -->
          <div
            v-if="deleteConfirmId === rating.id"
            class="mb-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-center justify-between"
          >
            <p class="text-xs text-red-700">Bewertung wirklich löschen?</p>
            <div class="flex gap-1.5">
              <button
                @click="deleteConfirmId = null"
                class="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                Abbrechen
              </button>
              <button
                @click="handleDelete(rating.id)"
                class="px-2.5 py-1 text-[11px] font-medium text-white bg-red-600 rounded-full hover:bg-red-700 transition-all duration-200"
              >
                Löschen
              </button>
            </div>
          </div>

          <!-- Title + Comment -->
          <div v-if="rating.title || rating.comment">
            <h4 v-if="rating.title" class="text-[13px] font-semibold text-gray-900 mb-0.5">{{ rating.title }}</h4>
            <p v-if="rating.comment" class="text-sm text-gray-600 leading-relaxed">
              <template v-for="(segment, i) in parseComment(rating.comment)" :key="i">
                <strong v-if="segment.type === 'bold'" class="font-semibold text-gray-900">{{ segment.value }}</strong>
                <em v-else-if="segment.type === 'italic'" class="italic">{{ segment.value }}</em>
                <router-link
                  v-else-if="segment.type === 'mention'"
                  :to="`/profile/${segment.value}`"
                  class="text-gray-900 font-semibold hover:text-red-800 transition-colors duration-200"
                >@{{ segment.value }}</router-link>
                <br v-else-if="segment.type === 'break'" />
                <template v-else>{{ segment.value }}</template>
              </template>
            </p>
          </div>

          <!-- Votes -->
          <div class="flex items-center gap-2 mt-2">
            <button
              @click="handleVote(rating.id, 'like')"
              :disabled="!authStore.isAuthenticated"
              :class="[
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-200',
                rating.userVote === 'like'
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50',
                !authStore.isAuthenticated && 'cursor-default'
              ]"
            >
              <ThumbsUp :size="12" />
              <span>{{ rating.likes }}</span>
            </button>

            <button
              @click="handleVote(rating.id, 'dislike')"
              :disabled="!authStore.isAuthenticated"
              :class="[
                'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all duration-200',
                rating.userVote === 'dislike'
                  ? 'bg-red-50 text-red-500'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50',
                !authStore.isAuthenticated && 'cursor-default'
              ]"
            >
              <ThumbsDown :size="12" />
              <span>{{ rating.dislikes }}</span>
            </button>

            <span
              v-if="rating.likes > 0 || rating.dislikes > 0"
              :class="['text-[11px] font-medium', voteDiffColor(voteDiff(rating))]"
            >
              {{ voteDiff(rating) > 0 ? '+' : '' }}{{ voteDiff(rating) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
