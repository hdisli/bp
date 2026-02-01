<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProfileStore } from '../stores/profile.store'
import { useAuthStore } from '../stores/auth.store'
import {
  ChevronRight,
  Lock,
  Star,
  MessageSquare,
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Check,
  X,
  Settings,
  Calendar,
  MapPin,
  User as UserIcon,
  Clock,
  ChevronDown,
  Trash2,
  Send,
} from 'lucide-vue-next'
import type { UserProfile } from '../types/profile'
import { useFriendshipStore } from '../stores/friendship.store'
import { useProfileCommentsStore, type ReactionType, type ProfileComment, type ReactionDetail, REACTION_TYPES } from '../stores/profile-comments.store'
import { useReactions } from '../composables/useReactions'

const route = useRoute()
const profileStore = useProfileStore()
const authStore = useAuthStore()
const friendshipStore = useFriendshipStore()
const profileCommentsStore = useProfileCommentsStore()
const { getReactionEmoji, getReactionLabel } = useReactions()

const userId = computed(() => Number(route.params.id))
const activityType = ref('all')
const activityPage = ref(1)
const friendDropdownOpen = ref(false)
const friendActionLoading = ref(false)
const friendDropdownRef = ref<HTMLElement | null>(null)
const newCommentText = ref('')
const commentCharCount = computed(() => newCommentText.value.length)
const activeReactionPickerFor = ref<number | null>(null)
const reactionsModalOpen = ref(false)
const reactionsModalCommentId = ref<number | null>(null)
const reactionsModalReactionType = ref<ReactionType | null>(null)
const reactionsModalData = ref<ReactionDetail[]>([])
const reactionsModalLoading = ref(false)

function openReactionPicker(commentId: number) {
  if (activeReactionPickerFor.value === commentId) {
    activeReactionPickerFor.value = null
  } else {
    activeReactionPickerFor.value = commentId
  }
}

function closeReactionPicker() {
  activeReactionPickerFor.value = null
}

function hasUserReacted(comment: ProfileComment): boolean {
  return comment.reactions.some(r => r.userReacted)
}

async function handleReaction(commentId: number, type: ReactionType, userReacted: boolean) {
  if (!fullProfile.value) return
  closeReactionPicker()

  if (userReacted) {
    // Nutzer klickt auf eigene Reaktion → Toggle (entfernen)
    await profileCommentsStore.removeReaction(fullProfile.value.id, commentId)
  } else {
    // Neue Reaktion oder Reaktion ändern
    await profileCommentsStore.reactToComment(fullProfile.value.id, commentId, type)
  }
}

async function openReactionsModal(commentId: number, reactionType: ReactionType) {
  if (!fullProfile.value) return

  // Loading ZUERST setzen (Skeleton sofort sichtbar wenn Modal öffnet)
  reactionsModalLoading.value = true
  reactionsModalCommentId.value = commentId
  reactionsModalReactionType.value = reactionType
  reactionsModalOpen.value = true

  const details = await profileCommentsStore.fetchReactionDetails(fullProfile.value.id, commentId)
  reactionsModalData.value = details
  reactionsModalLoading.value = false
}

function closeReactionsModal() {
  reactionsModalOpen.value = false
  reactionsModalCommentId.value = null
  reactionsModalReactionType.value = null
  reactionsModalData.value = []
  reactionsModalLoading.value = false
}

const profile = computed(() => profileStore.profile)
const isFullProfile = computed(
  () => profile.value && 'canViewProfile' in profile.value && profile.value.canViewProfile === true
)
const fullProfile = computed(() => (isFullProfile.value ? (profile.value as UserProfile) : null))

const genderLabel = computed(() => {
  const map: Record<string, string> = { male: 'Männlich', female: 'Weiblich', diverse: 'Divers' }
  return fullProfile.value?.gender ? map[fullProfile.value.gender] || fullProfile.value.gender : null
})

const onlineLabel = computed(() => {
  if (!fullProfile.value) return ''
  if (fullProfile.value.onlineStatus) return 'Online'
  if (fullProfile.value.lastSeen) {
    return 'Zuletzt gesehen ' + new Date(fullProfile.value.lastSeen).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }
  return 'Offline'
})

async function loadProfile() {
  friendDropdownOpen.value = false
  await profileStore.fetchProfile(userId.value)
  if (isFullProfile.value) {
    await profileStore.fetchActivity(userId.value, 1, activityType.value)
    await profileCommentsStore.fetchComments(userId.value, 1)
  }
}

async function changeActivityType(type: string) {
  activityType.value = type
  activityPage.value = 1
  await profileStore.fetchActivity(userId.value, 1, type)
}

async function changePage(page: number) {
  activityPage.value = page
  await profileStore.fetchActivity(userId.value, page, activityType.value)
}

async function handleSendRequest() {
  if (!fullProfile.value) return
  friendActionLoading.value = true
  const success = await friendshipStore.sendRequest(fullProfile.value.id)
  if (success) {
    await profileStore.fetchProfile(userId.value)
  }
  friendActionLoading.value = false
}

async function handleAcceptRequest() {
  if (!fullProfile.value?.friendshipId) return
  friendActionLoading.value = true
  const success = await friendshipStore.acceptRequest(fullProfile.value.friendshipId)
  if (success) {
    await profileStore.fetchProfile(userId.value)
  }
  friendActionLoading.value = false
}

async function handleRejectRequest() {
  if (!fullProfile.value?.friendshipId) return
  friendActionLoading.value = true
  const success = await friendshipStore.rejectRequest(fullProfile.value.friendshipId)
  if (success) {
    await profileStore.fetchProfile(userId.value)
  }
  friendActionLoading.value = false
}

async function handleRemoveFriendship() {
  if (!fullProfile.value?.friendshipId) return
  friendDropdownOpen.value = false
  friendActionLoading.value = true
  const success = await friendshipStore.removeFriendship(fullProfile.value.friendshipId)
  if (success) {
    await profileStore.fetchProfile(userId.value)
  }
  friendActionLoading.value = false
}

// Konsolidierter Click-Handler für alle Outside-Clicks
function handleDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  // Friend Dropdown schließen
  if (friendDropdownOpen.value && friendDropdownRef.value && !friendDropdownRef.value.contains(target)) {
    friendDropdownOpen.value = false
  }

  // Reaction Picker schließen
  if (activeReactionPickerFor.value !== null) {
    const clickedContainer = target.closest('.reaction-picker-container')
    const clickedTrigger = target.closest('[data-reaction-trigger]')

    if (!clickedContainer && !clickedTrigger) {
      closeReactionPicker()
    }
  }

  // Reactions Detail Popup schließen
  if (reactionsModalOpen.value) {
    const clickedReactionButton = target.closest('.reaction-bubble')
    const clickedPopup = target.closest('.reactions-detail-popup')

    if (!clickedReactionButton && !clickedPopup) {
      closeReactionsModal()
    }
  }
}

// Konsolidierter Keydown-Handler für Escape
function handleDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    // Reactions Modal schließen (höchste Priorität)
    if (reactionsModalOpen.value) {
      closeReactionsModal()
      event.preventDefault()
      return
    }

    // Friend Dropdown schließen
    if (friendDropdownOpen.value) {
      friendDropdownOpen.value = false
      event.preventDefault()
    }

    // Reaction Picker schließen
    if (activeReactionPickerFor.value !== null) {
      closeReactionPicker()
      event.preventDefault()
    }
  }
}

async function handleSubmitComment() {
  if (!newCommentText.value.trim() || !fullProfile.value) return
  const success = await profileCommentsStore.createComment(fullProfile.value.id, newCommentText.value.trim())
  if (success) {
    newCommentText.value = ''
  }
}

async function handleDeleteComment(commentId: number) {
  if (!fullProfile.value) return
  await profileCommentsStore.deleteComment(fullProfile.value.id, commentId)
}

async function changeCommentPage(page: number) {
  await profileCommentsStore.fetchComments(userId.value, page)
}

onMounted(() => {
  loadProfile()
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
})

watch(userId, loadProfile)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm mb-8" aria-label="Breadcrumb">
      <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">Home</router-link>
      <ChevronRight :size="14" class="text-gray-300" />
      <span class="text-gray-400">Profil</span>
      <template v-if="profile && 'username' in profile">
        <ChevronRight :size="14" class="text-gray-300" />
        <span class="text-gray-900 font-medium truncate">{{ profile.username }}</span>
      </template>
    </nav>

    <!-- Loading Skeleton -->
    <div v-if="profileStore.isLoading" class="space-y-6">
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start gap-6">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-full skeleton flex-shrink-0"></div>
          <div class="flex-1 space-y-3 pt-1 w-full">
            <div class="h-7 w-48 skeleton rounded-lg"></div>
            <div class="h-4 w-32 skeleton rounded-lg"></div>
            <div class="h-4 w-64 skeleton rounded-lg"></div>
            <div class="h-10 w-40 skeleton rounded-full mt-4"></div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="h-24 skeleton rounded-2xl"></div>
        <div class="h-24 skeleton rounded-2xl"></div>
        <div class="h-24 skeleton rounded-2xl"></div>
      </div>
      <div class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-20 skeleton rounded-2xl"></div>
      </div>
    </div>

    <!-- Private Profile -->
    <div
      v-else-if="profile && 'canViewProfile' in profile && !profile.canViewProfile"
      class="flex flex-col items-center justify-center py-20"
    >
      <div class="bg-white rounded-2xl p-10 text-center max-w-sm">
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock :size="28" class="text-gray-400" />
        </div>
        <div
          v-if="profile.avatarUrl"
          class="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-gray-100"
        >
          <img :src="profile.avatarUrl" :alt="profile.username" class="w-full h-full object-cover" />
        </div>
        <h2 class="text-lg font-medium text-gray-900 mb-2">Dieses Profil ist privat</h2>
        <p class="text-sm text-gray-400">{{ profile.username }} hat sein Profil auf privat gestellt.</p>
      </div>
    </div>

    <!-- Full Profile -->
    <div v-else-if="fullProfile" class="space-y-6">
      <!-- Profile Header Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <div class="flex flex-col sm:flex-row items-start gap-6">
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            <div
              v-if="fullProfile.avatarUrl"
              class="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-gray-100 overflow-hidden"
            >
              <img
                :src="fullProfile.avatarUrl"
                :alt="fullProfile.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-gray-100 bg-gray-900 flex items-center justify-center"
            >
              <span class="text-2xl sm:text-3xl font-bold text-white">
                {{ fullProfile.username.charAt(0).toUpperCase() }}
              </span>
            </div>
            <!-- Online Status Dot -->
            <div
              class="absolute bottom-1 right-1 w-4 h-4 rounded-full border-[3px] border-white"
              :class="fullProfile.onlineStatus ? 'bg-emerald-500' : 'bg-gray-300'"
            ></div>
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 tracking-tight">{{ fullProfile.username }}</h1>
              <span
                class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                :class="fullProfile.onlineStatus
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="fullProfile.onlineStatus ? 'bg-emerald-500' : 'bg-gray-400'"
                ></span>
                {{ onlineLabel }}
              </span>
            </div>

            <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400 mt-1.5">
              <Calendar :size="12" class="inline -mt-0.5 mr-1" />
              Mitglied seit {{ new Date(fullProfile.memberSince).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }) }}
            </p>

            <!-- Details inline -->
            <div
              v-if="fullProfile.age || fullProfile.gender || fullProfile.state"
              class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3"
            >
              <span v-if="fullProfile.age" class="text-sm text-gray-500">{{ fullProfile.age }} Jahre</span>
              <span v-if="fullProfile.gender" class="text-sm text-gray-500">{{ genderLabel }}</span>
              <span v-if="fullProfile.state" class="text-sm text-gray-500 inline-flex items-center gap-1">
                <MapPin :size="13" class="text-gray-400" />
                {{ fullProfile.state }}
              </span>
            </div>

            <p v-if="fullProfile.bio" class="text-sm text-gray-600 mt-3 max-w-2xl leading-relaxed">{{ fullProfile.bio }}</p>
            <p v-if="fullProfile.signature" class="text-sm text-gray-400 italic mt-2">&bdquo;{{ fullProfile.signature }}&ldquo;</p>

            <!-- Action Buttons -->
            <div class="flex flex-wrap items-center gap-3 mt-5">
              <router-link
                v-if="fullProfile.isOwnProfile"
                to="/profile/edit"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200"
              >
                <Settings :size="16" />
                Profil bearbeiten
              </router-link>
              <router-link
                v-if="fullProfile.isOwnProfile"
                to="/friends"
                class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200"
              >
                <Users :size="16" />
                Freunde
              </router-link>

              <!-- Not authenticated -->
              <template v-else-if="!authStore.isAuthenticated">
                <router-link
                  to="/login"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200"
                >
                  <UserPlus :size="16" />
                  Freund hinzufügen
                </router-link>
              </template>

              <!-- Already friends -->
              <template v-else-if="fullProfile.isFriend">
                <div class="relative" ref="friendDropdownRef">
                  <button
                    @click="friendDropdownOpen = !friendDropdownOpen"
                    class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full hover:bg-emerald-100 transition-all duration-200 border border-emerald-200/60"
                    :aria-expanded="friendDropdownOpen"
                  >
                    <UserCheck :size="16" />
                    Befreundet
                    <ChevronDown :size="14" class="transition-transform duration-200" :class="friendDropdownOpen ? 'rotate-180' : ''" />
                  </button>
                  <div
                    v-if="friendDropdownOpen"
                    class="absolute left-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-scale-in"
                  >
                    <button
                      @click="handleRemoveFriendship"
                      :disabled="friendActionLoading"
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50"
                    >
                      <UserMinus :size="15" />
                      Freundschaft beenden
                    </button>
                  </div>
                </div>
              </template>

              <!-- Pending sent -->
              <template v-else-if="fullProfile.friendRequestStatus === 'pending' && fullProfile.friendRequestDirection === 'sent'">
                <button
                  disabled
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-700 text-sm font-medium rounded-full cursor-default border border-amber-200/60"
                >
                  <Clock :size="16" />
                  Anfrage gesendet
                </button>
              </template>

              <!-- Pending received -->
              <template v-else-if="fullProfile.friendRequestStatus === 'pending' && fullProfile.friendRequestDirection === 'received'">
                <button
                  @click="handleAcceptRequest"
                  :disabled="friendActionLoading"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50"
                >
                  <Check :size="16" />
                  Annehmen
                </button>
                <button
                  @click="handleRejectRequest"
                  :disabled="friendActionLoading"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-50"
                >
                  <X :size="16" />
                  Ablehnen
                </button>
              </template>

              <!-- Not friends, no pending -->
              <template v-else>
                <button
                  @click="handleSendRequest"
                  :disabled="friendActionLoading"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200 disabled:opacity-50"
                >
                  <UserPlus :size="16" />
                  Freund hinzufügen
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 text-center">
          <div class="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-xl mx-auto mb-2.5">
            <Star :size="18" class="text-amber-500" />
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ fullProfile.stats.ratingsCount }}</p>
          <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400 mt-0.5">Bewertungen</p>
        </div>
        <div class="bg-white rounded-2xl p-5 text-center">
          <div class="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl mx-auto mb-2.5">
            <MessageSquare :size="18" class="text-blue-500" />
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ fullProfile.stats.ratingsCommentsCount }}</p>
          <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400 mt-0.5">Kommentare</p>
        </div>
        <div class="bg-white rounded-2xl p-5 text-center">
          <div class="flex items-center justify-center w-10 h-10 bg-violet-50 rounded-xl mx-auto mb-2.5">
            <Users :size="18" class="text-violet-500" />
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ fullProfile.stats.friendsCount }}</p>
          <p class="text-[11px] font-medium uppercase tracking-widest text-gray-400 mt-0.5">Freunde</p>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <h2 class="text-lg font-bold text-gray-900 tracking-tight mb-5">Aktivität</h2>

        <!-- Activity Filter Tabs -->
        <div class="flex gap-2 mb-6">
          <button
            v-for="tab in [
              { key: 'all', label: 'Alle' },
              { key: 'ratings', label: 'Bewertungen' },
              { key: 'comments', label: 'Mit Kommentar' },
            ]"
            :key="tab.key"
            @click="changeActivityType(tab.key)"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
            :class="
              activityType === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            "
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Loading -->
        <div v-if="profileStore.isActivityLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-[72px] skeleton rounded-xl"></div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="profileStore.activity.length === 0"
          class="flex flex-col items-center py-12"
        >
          <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <UserIcon :size="28" class="text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-900">Keine Aktivität</p>
          <p class="text-sm text-gray-400 mt-1">Hier ist noch nichts zu sehen.</p>
        </div>

        <!-- Activity List -->
        <div v-else class="space-y-2">
          <div
            v-for="item in profileStore.activity"
            :key="item.id"
            class="flex items-center gap-4 p-4 rounded-xl bg-gray-50/80 hover:bg-gray-50 transition-colors duration-200"
          >
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-amber-50"
            >
              <Star :size="18" class="text-amber-500" />
            </div>
            <div class="flex-1 min-w-0">
              <router-link
                :to="`/product/${item.productId}`"
                class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 truncate block"
              >
                {{ item.productName }}
              </router-link>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-gray-400">
                  {{ item.overall.toFixed(1) }} / 10
                </span>
                <span v-if="item.comment" class="text-xs text-gray-300">&middot;</span>
                <span v-if="item.comment" class="text-xs text-gray-400 truncate">
                  {{ item.comment }}
                </span>
              </div>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0">
              {{ new Date(item.createdAt).toLocaleDateString('de-DE') }}
            </span>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="profileStore.activityPagination.totalPages > 1"
          class="flex items-center justify-between mt-6 pt-5 border-t border-gray-100"
        >
          <p class="text-sm text-gray-400">
            Seite {{ profileStore.activityPagination.page }} von {{ profileStore.activityPagination.totalPages }}
          </p>
          <div class="flex gap-2">
            <button
              :disabled="profileStore.activityPagination.page <= 1"
              @click="changePage(profileStore.activityPagination.page - 1)"
              class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              :disabled="profileStore.activityPagination.page >= profileStore.activityPagination.totalPages"
              @click="changePage(profileStore.activityPagination.page + 1)"
              class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Comments Section -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <h2 class="text-lg font-bold text-gray-900 tracking-tight mb-5">Profilkommentare</h2>

        <!-- Comment Form (nur wenn eingeloggt und nicht eigenes Profil) -->
        <div
          v-if="authStore.isAuthenticated && !fullProfile.isOwnProfile"
          class="mb-6"
        >
          <div class="relative">
            <textarea
              v-model="newCommentText"
              placeholder="Schreibe einen Kommentar..."
              maxlength="500"
              rows="3"
              class="w-full px-4 py-3 text-sm bg-gray-50/80 border border-gray-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all duration-200 resize-none"
            ></textarea>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs text-gray-400">{{ commentCharCount }} / 500</span>
              <button
                @click="handleSubmitComment"
                :disabled="!newCommentText.trim() || profileCommentsStore.isSubmitting"
                class="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send :size="14" />
                Kommentar schreiben
              </button>
            </div>
          </div>
          <p
            v-if="profileCommentsStore.error"
            class="text-sm text-red-500 mt-2"
            role="alert"
            aria-live="assertive"
          >
            {{ profileCommentsStore.error }}
          </p>
        </div>

        <!-- Loading -->
        <div v-if="profileCommentsStore.isLoading" class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-20 skeleton rounded-xl"></div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="profileCommentsStore.comments.length === 0"
          class="flex flex-col items-center py-12"
        >
          <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare :size="28" class="text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-900">Keine Kommentare</p>
          <p class="text-sm text-gray-400 mt-1">Noch hat niemand dieses Profil kommentiert.</p>
        </div>

        <!-- Comments List -->
        <div v-else class="space-y-4">
          <div
            v-for="comment in profileCommentsStore.comments"
            :key="comment.id"
            class="relative rounded-xl bg-gray-50/80 overflow-visible"
          >
            <div class="flex items-start gap-3 p-4 pb-3">
            <!-- Author Avatar -->
            <router-link :to="`/profile/${comment.author.id}`" class="flex-shrink-0">
              <div
                v-if="comment.author.avatarUrl"
                class="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white"
              >
                <img
                  :src="comment.author.avatarUrl"
                  :alt="comment.author.username"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                v-else
                class="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-white"
              >
                <span class="text-sm font-bold text-white">
                  {{ comment.author.username.charAt(0).toUpperCase() }}
                </span>
              </div>
            </router-link>

            <!-- Comment Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <router-link
                  :to="`/profile/${comment.author.id}`"
                  class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200"
                >
                  {{ comment.author.username }}
                </router-link>
                <span class="text-xs text-gray-400">
                  {{ new Date(comment.createdAt).toLocaleDateString('de-DE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }) }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mt-1 leading-relaxed">{{ comment.comment }}</p>
            </div>

            <!-- Delete Button (nur für Autor oder Profilbesitzer) -->
            <button
              v-if="authStore.user && (authStore.user.id === comment.author.id || fullProfile.isOwnProfile)"
              @click="handleDeleteComment(comment.id)"
              class="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
              aria-label="Kommentar löschen"
            >
              <Trash2 :size="16" />
            </button>
          </div>

          <!-- Reactions Bar (innerhalb der Box, am unteren Rand) -->
          <div
            v-if="comment.reactions.length > 0 || authStore.isAuthenticated"
            class="px-4 pb-3 pt-0 flex items-center gap-2 flex-wrap"
          >
            <!-- Reaction Bubbles -->
            <div
              v-for="reaction in comment.reactions"
              :key="reaction.type"
              class="relative reaction-bubble"
            >
              <button
                @click="reaction.userReacted && authStore.isAuthenticated ? handleReaction(comment.id, reaction.type, true) : openReactionsModal(comment.id, reaction.type)"
                :aria-label="`${getReactionLabel(reaction.type)}, ${reaction.count} ${reaction.count === 1 ? 'Person' : 'Personen'}${reaction.userReacted ? ', ausgewählt' : ''}`"
                :aria-pressed="reaction.userReacted"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 min-h-[32px] cursor-pointer"
                :class="
                  reaction.userReacted
                    ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/60 shadow-sm'
                "
              >
                <span class="text-base leading-none" aria-hidden="true">{{ getReactionEmoji(reaction.type) }}</span>
                <span class="font-semibold" aria-live="polite" aria-atomic="true">{{ reaction.count }}</span>
              </button>

              <!-- Reactions Details Popup -->
              <div
                v-if="reactionsModalOpen && reactionsModalCommentId === comment.id && reactionsModalReactionType === reaction.type"
                class="reactions-detail-popup absolute left-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-200/60 p-4 z-50 animate-scale-in overflow-hidden"
                style="min-width: 240px; max-width: 320px; max-height: 400px;"
                @click.stop
              >
                <!-- Loading -->
                <div v-if="reactionsModalLoading" class="space-y-3">
                  <div v-for="i in 3" :key="i" class="h-12 skeleton rounded-xl"></div>
                </div>

                <!-- Empty -->
                <div v-else-if="reactionsModalData.length === 0" class="flex flex-col items-center py-8">
                  <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <MessageSquare :size="20" class="text-gray-400" />
                  </div>
                  <p class="text-xs font-medium text-gray-900">Keine Reaktionen</p>
                </div>

                <!-- Reactions List -->
                <div v-else class="space-y-4 overflow-y-auto" style="max-height: 350px;">
                  <div
                    v-for="reactionGroup in reactionsModalData"
                    :key="reactionGroup.type"
                    class="space-y-2"
                  >
                    <!-- Reaction Type Header -->
                    <div class="flex items-center gap-2 sticky top-0 bg-white pb-2">
                      <span class="text-xl">{{ getReactionEmoji(reactionGroup.type) }}</span>
                      <h3 class="text-xs font-medium text-gray-900">
                        {{ getReactionLabel(reactionGroup.type) }} ({{ reactionGroup.totalCount }})
                      </h3>
                    </div>

                    <!-- Users List -->
                    <div class="space-y-1">
                      <router-link
                        v-for="user in reactionGroup.users"
                        :key="user.id"
                        :to="`/profile/${user.id}`"
                        @click="closeReactionsModal"
                        class="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                      >
                        <!-- Avatar -->
                        <div
                          v-if="user.avatarUrl"
                          class="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white flex-shrink-0"
                        >
                          <img :src="user.avatarUrl" :alt="user.username" class="w-full h-full object-cover" />
                        </div>
                        <div
                          v-else
                          class="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-white flex-shrink-0"
                        >
                          <span class="text-xs font-bold text-white">
                            {{ user.username.charAt(0).toUpperCase() }}
                          </span>
                        </div>

                        <!-- Username -->
                        <span class="text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200">
                          {{ user.username }}
                        </span>
                      </router-link>

                      <!-- "und X weitere" Hinweis mit "Alle anzeigen"-Link -->
                      <div
                        v-if="reactionGroup.hasMore"
                        class="p-2 text-center"
                      >
                        <span class="text-xs text-gray-400 block mb-2">
                          und {{ reactionGroup.totalCount - reactionGroup.users.length }} weitere
                        </span>
                        <router-link
                          :to="`/profile/${fullProfile?.id}/comments/${comment.id}/reactions`"
                          @click="closeReactionsModal"
                          class="inline-block text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200"
                        >
                          Alle anzeigen →
                        </router-link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Reaction Button: NUR wenn User authenticated UND NICHT bereits reagiert hat -->
            <div v-if="authStore.isAuthenticated && !hasUserReacted(comment)" class="relative reaction-picker-container">
              <button
                @click.stop="openReactionPicker(comment.id)"
                data-reaction-trigger
                aria-label="Reaktion hinzufügen"
                class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 transition-all duration-200 border border-gray-200/60 shadow-sm"
                :aria-expanded="activeReactionPickerFor === comment.id"
              >
                <span class="text-base font-medium leading-none" aria-hidden="true">+</span>
              </button>

              <!-- Emoji Picker Popup -->
              <div
                v-if="activeReactionPickerFor === comment.id"
                role="menu"
                aria-label="Reaktion auswählen"
                class="absolute left-0 bottom-full mb-2 bg-white rounded-2xl shadow-xl border border-gray-200/60 p-3 grid grid-cols-6 gap-1.5 z-50 animate-scale-in"
                style="min-width: 280px"
                @click.stop
              >
                <button
                  v-for="type in REACTION_TYPES"
                  :key="type"
                  @click="handleReaction(comment.id, type, false)"
                  role="menuitem"
                  :aria-label="getReactionLabel(type)"
                  class="min-w-[44px] min-h-[44px] rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 flex items-center justify-center text-2xl hover:scale-110 active:scale-95"
                >
                  {{ getReactionEmoji(type) }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

        <!-- Pagination -->
        <div
          v-if="profileCommentsStore.pagination.totalPages > 1"
          class="flex items-center justify-between mt-6 pt-5 border-t border-gray-100"
        >
          <p class="text-sm text-gray-400">
            Seite {{ profileCommentsStore.pagination.page }} von {{ profileCommentsStore.pagination.totalPages }}
          </p>
          <div class="flex gap-2">
            <button
              :disabled="profileCommentsStore.pagination.page <= 1"
              @click="changeCommentPage(profileCommentsStore.pagination.page - 1)"
              class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              :disabled="profileCommentsStore.pagination.page >= profileCommentsStore.pagination.totalPages"
              @click="changeCommentPage(profileCommentsStore.pagination.page + 1)"
              class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="profileStore.error && !profileStore.isLoading" class="text-center py-12">
      <p class="text-sm text-red-500" role="alert">{{ profileStore.error }}</p>
    </div>
  </div>
</template>
