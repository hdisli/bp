<template>
  <div class="relative" ref="dropdownRef">
    <button
      @click="toggleDropdown"
      class="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-200"
      :aria-expanded="isOpen"
      aria-label="Benachrichtigungen"
    >
      <Bell :size="20" />
      <span
        v-if="notificationStore.unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-800 rounded-full"
      >
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </button>

    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 animate-slide-down z-50 overflow-hidden"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="text-sm font-medium text-gray-900">Benachrichtigungen</h3>
        <button
          v-if="notificationStore.unreadCount > 0"
          @click="handleMarkAllAsRead"
          class="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
        >
          Alle als gelesen markieren
        </button>
      </div>

      <!-- Notifications List -->
      <div class="max-h-96 overflow-y-auto">
        <template v-if="isLoading && notificationStore.notifications.length === 0">
          <div v-for="i in 3" :key="i" class="flex gap-3 px-4 py-3">
            <div class="w-10 h-10 rounded-full skeleton flex-shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 skeleton rounded w-3/4"></div>
              <div class="h-2.5 skeleton rounded w-1/3"></div>
            </div>
          </div>
        </template>

        <template v-else-if="notificationStore.notifications.length === 0">
          <div class="py-10 text-center">
            <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BellOff :size="20" class="text-gray-400" />
            </div>
            <p class="text-sm text-gray-400">Keine Benachrichtigungen</p>
          </div>
        </template>

        <template v-else>
          <button
            v-for="notification in displayedNotifications"
            :key="notification.id"
            @click="handleNotificationClick(notification)"
            class="w-full flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-left"
            :class="{ 'bg-blue-50 border-l-2 border-l-blue-400': !notification.isRead }"
          >
            <div
              v-if="notification.sender?.avatarUrl"
              class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
            >
              <img
                :src="notification.sender.avatarUrl"
                :alt="notification.sender.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div
              v-else
              class="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0"
            >
              <span class="text-xs font-semibold text-white">
                {{ notification.sender?.username?.charAt(0).toUpperCase() ?? '?' }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-900 leading-snug">{{ notification.message }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatRelativeTime(notification.createdAt) }}</p>
            </div>
            <div
              v-if="!notification.isRead"
              class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"
            ></div>
          </button>
        </template>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-100">
        <router-link
          to="/notifications"
          @click="isOpen = false"
          class="block text-center text-sm text-gray-500 hover:text-gray-900 py-3 transition-colors duration-200"
        >
          Alle anzeigen
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, BellOff } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notification.store'
import type { NotificationItem } from '../types/profile'

const router = useRouter()
const notificationStore = useNotificationStore()
const isOpen = ref(false)
const isLoading = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const displayedNotifications = computed(() =>
  notificationStore.notifications.slice(0, 10)
)

function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    loadNotifications()
  }
}

async function loadNotifications() {
  isLoading.value = true
  await notificationStore.fetchNotifications(1, 10)
  isLoading.value = false
}

async function handleMarkAllAsRead() {
  await notificationStore.markAllAsRead()
}

function handleNotificationClick(notification: NotificationItem) {
  if (!notification.isRead) {
    notificationStore.markAsRead(notification.id)
  }

  if (
    (notification.type === 'friend_request' || notification.type === 'friend_accepted') &&
    notification.referenceId
  ) {
    router.push(`/profile/${notification.referenceId}`)
  } else if (notification.type === 'rating_vote' && notification.referenceId) {
    router.push(`/products/${notification.referenceId}`)
  }

  isOpen.value = false
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now()
  const date = new Date(dateString).getTime()
  const diffSeconds = Math.floor((now - date) / 1000)

  if (diffSeconds < 60) return 'Gerade eben'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `vor ${diffHours} Std.`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `vor ${diffWeeks} ${diffWeeks === 1 ? 'Woche' : 'Wochen'}`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `vor ${diffMonths} ${diffMonths === 1 ? 'Monat' : 'Monaten'}`
  return `vor ${Math.floor(diffDays / 365)} ${Math.floor(diffDays / 365) === 1 ? 'Jahr' : 'Jahren'}`
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>
