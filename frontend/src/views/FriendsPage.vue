<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useFriendshipStore } from '../stores/friendship.store'
import {
  ChevronRight,
  Users,
  UserPlus,
  Send,
  Check,
  X,
  MoreHorizontal,
  UserMinus,
  Ban,
  Clock,
} from 'lucide-vue-next'

const friendshipStore = useFriendshipStore()
const activeTab = ref<'friends' | 'received' | 'sent'>('friends')
const openMenuId = ref<number | null>(null)

const tabs = [
  { key: 'friends' as const, label: 'Meine Freunde', icon: Users },
  { key: 'received' as const, label: 'Eingehend', icon: UserPlus },
  { key: 'sent' as const, label: 'Gesendet', icon: Send },
]

const friendsCount = computed(() => friendshipStore.friends.length)
const receivedCount = computed(() => friendshipStore.pendingReceived.length)
const sentCount = computed(() => friendshipStore.pendingSent.length)

function getTabCount(key: string): number {
  if (key === 'friends') return friendsCount.value
  if (key === 'received') return receivedCount.value
  if (key === 'sent') return sentCount.value
  return 0
}

function toggleMenu(friendshipId: number) {
  openMenuId.value = openMenuId.value === friendshipId ? null : friendshipId
}

async function handleAccept(friendshipId: number) {
  await friendshipStore.acceptRequest(friendshipId)
}

async function handleReject(friendshipId: number) {
  await friendshipStore.rejectRequest(friendshipId)
}

async function handleRemove(friendshipId: number) {
  openMenuId.value = null
  await friendshipStore.removeFriendship(friendshipId)
}

async function handleWithdraw(friendshipId: number) {
  await friendshipStore.removeFriendship(friendshipId)
}

async function handleBlock(userId: number) {
  openMenuId.value = null
  await friendshipStore.blockUser(userId)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function handleClickOutside(event: MouseEvent) {
  // Close menu when clicking outside
  if (openMenuId.value !== null) {
    const target = event.target as HTMLElement
    if (!target.closest('[data-friend-menu]')) {
      openMenuId.value = null
    }
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    openMenuId.value = null
  }
}

onMounted(() => {
  friendshipStore.fetchFriendships()
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm mb-8" aria-label="Breadcrumb">
      <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">Home</router-link>
      <ChevronRight :size="14" class="text-gray-300" />
      <span class="text-gray-900 font-medium">Freunde</span>
    </nav>

    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">Freunde</h1>

    <!-- Tabs -->
    <div class="flex gap-2 mb-8">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        @click="activeTab = tab.key"
        class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
        :class="
          activeTab === tab.key
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        "
      >
        {{ tab.label }}
        <span
          v-if="getTabCount(tab.key) > 0"
          class="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full"
          :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'"
        >
          {{ getTabCount(tab.key) }}
        </span>
      </button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="friendshipStore.isLoading" class="space-y-4">
      <div v-for="i in 6" :key="i" class="h-20 skeleton rounded-2xl"></div>
    </div>

    <!-- Friends Tab -->
    <template v-else-if="activeTab === 'friends'">
      <div v-if="friendshipStore.friends.length === 0" class="flex flex-col items-center py-16">
        <div class="bg-white rounded-2xl p-10 text-center max-w-sm">
          <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Users :size="28" class="text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-900">Noch keine Freunde</p>
          <p class="text-sm text-gray-400 mt-1">Besuche Profile und füge andere Benutzer als Freunde hinzu.</p>
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          v-for="friend in friendshipStore.friends"
          :key="friend.friendshipId"
          class="bg-white rounded-2xl p-4 flex items-center gap-4 group"
        >
          <router-link :to="`/profile/${friend.user.id}`" class="relative flex-shrink-0">
            <div
              v-if="friend.user.avatarUrl"
              class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100"
            >
              <img
                :src="friend.user.avatarUrl"
                :alt="friend.user.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-gray-100">
              <span class="text-sm font-semibold text-white">
                {{ friend.user.username.charAt(0).toUpperCase() }}
              </span>
            </div>
            <div
              class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white"
              :class="friend.user.onlineStatus ? 'bg-emerald-500' : 'bg-gray-300'"
            ></div>
          </router-link>

          <div class="flex-1 min-w-0">
            <router-link
              :to="`/profile/${friend.user.id}`"
              class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 truncate block"
            >
              {{ friend.user.username }}
            </router-link>
            <p class="text-xs text-gray-400 mt-0.5">Seit {{ formatDate(friend.since) }}</p>
          </div>

          <div class="relative" data-friend-menu>
            <button
              @click.stop="toggleMenu(friend.friendshipId)"
              class="p-2 text-gray-300 hover:text-gray-500 rounded-lg hover:bg-gray-50 transition-all duration-200"
              :aria-expanded="openMenuId === friend.friendshipId"
              aria-label="Mehr Optionen"
            >
              <MoreHorizontal :size="18" />
            </button>
            <div
              v-if="openMenuId === friend.friendshipId"
              class="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 animate-scale-in"
            >
              <button
                @click="handleRemove(friend.friendshipId)"
                class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-200"
              >
                <UserMinus :size="15" class="text-gray-400" />
                Freundschaft beenden
              </button>
              <button
                @click="handleBlock(friend.user.id)"
                class="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <Ban :size="15" />
                Blockieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Received Tab -->
    <template v-else-if="activeTab === 'received'">
      <div v-if="friendshipStore.pendingReceived.length === 0" class="flex flex-col items-center py-16">
        <div class="bg-white rounded-2xl p-10 text-center max-w-sm">
          <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <UserPlus :size="28" class="text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-900">Keine eingehenden Anfragen</p>
          <p class="text-sm text-gray-400 mt-1">Momentan gibt es keine offenen Anfragen.</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="request in friendshipStore.pendingReceived"
          :key="request.friendshipId"
          class="bg-white rounded-2xl p-4 flex items-center gap-4 border-l-4 border-emerald-400"
        >
          <router-link :to="`/profile/${request.user.id}`" class="flex-shrink-0">
            <div
              v-if="request.user.avatarUrl"
              class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100"
            >
              <img
                :src="request.user.avatarUrl"
                :alt="request.user.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-gray-100">
              <span class="text-sm font-semibold text-white">
                {{ request.user.username.charAt(0).toUpperCase() }}
              </span>
            </div>
          </router-link>

          <div class="flex-1 min-w-0">
            <router-link
              :to="`/profile/${request.user.id}`"
              class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 truncate block"
            >
              {{ request.user.username }}
            </router-link>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(request.createdAt) }}</p>
          </div>

          <div class="flex gap-2 flex-shrink-0">
            <button
              @click="handleAccept(request.friendshipId)"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition-all duration-200"
              aria-label="Annehmen"
            >
              <Check :size="15" />
              Annehmen
            </button>
            <button
              @click="handleReject(request.friendshipId)"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200"
              aria-label="Ablehnen"
            >
              <X :size="15" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Sent Tab -->
    <template v-else-if="activeTab === 'sent'">
      <div v-if="friendshipStore.pendingSent.length === 0" class="flex flex-col items-center py-16">
        <div class="bg-white rounded-2xl p-10 text-center max-w-sm">
          <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Send :size="28" class="text-gray-400" />
          </div>
          <p class="text-sm font-medium text-gray-900">Keine gesendeten Anfragen</p>
          <p class="text-sm text-gray-400 mt-1">Du hast keine offenen Anfragen gesendet.</p>
        </div>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="request in friendshipStore.pendingSent"
          :key="request.friendshipId"
          class="bg-white rounded-2xl p-4 flex items-center gap-4 border-l-4 border-amber-300"
        >
          <router-link :to="`/profile/${request.user.id}`" class="flex-shrink-0">
            <div
              v-if="request.user.avatarUrl"
              class="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-100"
            >
              <img
                :src="request.user.avatarUrl"
                :alt="request.user.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div v-else class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-gray-100">
              <span class="text-sm font-semibold text-white">
                {{ request.user.username.charAt(0).toUpperCase() }}
              </span>
            </div>
          </router-link>

          <div class="flex-1 min-w-0">
            <router-link
              :to="`/profile/${request.user.id}`"
              class="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-200 truncate block"
            >
              {{ request.user.username }}
            </router-link>
            <p class="text-xs text-gray-400 mt-0.5 inline-flex items-center gap-1">
              <Clock :size="11" />
              Gesendet am {{ formatDate(request.createdAt) }}
            </p>
          </div>

          <button
            @click="handleWithdraw(request.friendshipId)"
            class="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200 flex-shrink-0"
          >
            <X :size="15" />
            Zurückziehen
          </button>
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-if="friendshipStore.error" class="mt-6 text-center">
      <p class="text-sm text-red-500" role="alert">{{ friendshipStore.error }}</p>
    </div>
  </div>
</template>
