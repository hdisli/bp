<template>
  <div class="py-12 md:py-16">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900">Benachrichtigungen</h1>
        <button
          v-if="notificationStore.unreadCount > 0"
          @click="handleMarkAllAsRead"
          class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-all duration-200"
        >
          Alle als gelesen markieren
        </button>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="notificationStore.isLoading && notificationStore.notifications.length === 0" class="space-y-3" aria-busy="true">
        <div
          v-for="i in 6"
          :key="i"
          class="flex gap-4 p-4 bg-white rounded-2xl"
          aria-hidden="true"
        >
          <div class="w-12 h-12 rounded-full skeleton flex-shrink-0"></div>
          <div class="flex-1 space-y-2 py-1">
            <div class="h-3.5 skeleton rounded w-3/4"></div>
            <div class="h-3 skeleton rounded w-1/3"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="notificationStore.notifications.length === 0"
        class="text-center py-20"
      >
        <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bell :size="28" class="text-gray-400" />
        </div>
        <p class="text-base font-medium text-gray-900 mb-1">Keine Benachrichtigungen</p>
        <p class="text-sm text-gray-400">Du hast noch keine Benachrichtigungen erhalten.</p>
      </div>

      <!-- Notifications List -->
      <div v-else class="space-y-2">
        <button
          v-for="notification in notificationStore.notifications"
          :key="notification.id"
          @click="handleNotificationClick(notification)"
          class="w-full flex gap-4 p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors duration-200 text-left"
          :class="{
            'ring-1 ring-blue-200 bg-blue-50 hover:bg-blue-50/70': !notification.isRead,
          }"
        >
          <div
            v-if="notification.sender?.avatarUrl"
            class="w-12 h-12 rounded-full overflow-hidden flex-shrink-0"
          >
            <img
              :src="notification.sender.avatarUrl"
              :alt="notification.sender.username"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0"
          >
            <span class="text-sm font-semibold text-white">
              {{ notification.sender?.username?.charAt(0).toUpperCase() ?? '?' }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 leading-relaxed">{{ notification.message }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatRelativeTime(notification.createdAt) }}</p>
          </div>
          <div
            v-if="!notification.isRead"
            class="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"
          ></div>
        </button>

        <!-- Pagination -->
        <div
          v-if="notificationStore.totalPages > 1"
          class="flex items-center justify-center gap-2 pt-6"
        >
          <button
            @click="loadPage(notificationStore.currentPage - 1)"
            :disabled="notificationStore.currentPage <= 1"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
            :class="notificationStore.currentPage <= 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'"
          >
            Zurück
          </button>
          <span class="text-sm text-gray-400">
            Seite {{ notificationStore.currentPage }} von {{ notificationStore.totalPages }}
          </span>
          <button
            @click="loadPage(notificationStore.currentPage + 1)"
            :disabled="notificationStore.currentPage >= notificationStore.totalPages"
            class="px-4 py-2 text-sm font-medium rounded-full transition-all duration-200"
            :class="notificationStore.currentPage >= notificationStore.totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 bg-gray-100 hover:bg-gray-200'"
          >
            Weiter
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell } from 'lucide-vue-next'
import { useNotificationStore } from '../stores/notification.store'
import type { NotificationItem } from '../types/profile'

const router = useRouter()
const notificationStore = useNotificationStore()

onMounted(() => {
  notificationStore.fetchNotifications()
})

function loadPage(page: number) {
  notificationStore.fetchNotifications(page)
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
</script>
