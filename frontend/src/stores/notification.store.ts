import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { NotificationItem, NotificationsResponse } from '../types/profile'
import type { ApiResponse } from '../types/auth'
import { useAuthStore } from './auth.store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationItem[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const currentPage = ref(1)
  const totalPages = ref(1)
  const total = ref(0)

  let pollingInterval: ReturnType<typeof setInterval> | null = null

  async function fetchNotifications(page = 1, limit = 20): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const response = await axios.get<ApiResponse<NotificationsResponse>>(
        `${API_URL}/api/notifications`,
        {
          params: { page, limit },
          headers: authStore.getAuthHeader(),
        }
      )

      if (response.data.success && response.data.data) {
        const data = response.data.data
        notifications.value = data.notifications
        unreadCount.value = data.unreadCount
        currentPage.value = data.pagination.page
        totalPages.value = data.pagination.totalPages
        total.value = data.pagination.total
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Benachrichtigungen konnten nicht geladen werden.'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchUnreadCount(): Promise<void> {
    try {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      const response = await axios.get<ApiResponse<{ unreadCount: number }>>(
        `${API_URL}/api/notifications/unread-count`,
        { headers: authStore.getAuthHeader() }
      )

      if (response.data.success && response.data.data) {
        unreadCount.value = response.data.data.unreadCount
      }
    } catch {
      // Silently fail for polling
    }
  }

  async function markAsRead(notificationId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.put<ApiResponse<{ message: string }>>(
        `${API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: authStore.getAuthHeader() }
      )

      if (response.data.success) {
        const notification = notifications.value.find((n) => n.id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Benachrichtigung konnte nicht als gelesen markiert werden.'
      }
      return false
    }
  }

  async function markAllAsRead(): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.put<ApiResponse<{ message: string }>>(
        `${API_URL}/api/notifications/read-all`,
        {},
        { headers: authStore.getAuthHeader() }
      )

      if (response.data.success) {
        notifications.value.forEach((n) => { n.isRead = true })
        unreadCount.value = 0
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Benachrichtigungen konnten nicht als gelesen markiert werden.'
      }
      return false
    }
  }

  function startPolling(): void {
    stopPolling()
    fetchUnreadCount()
    pollingInterval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
  }

  function stopPolling(): void {
    if (pollingInterval) {
      clearInterval(pollingInterval)
      pollingInterval = null
    }
  }

  function clearNotifications(): void {
    notifications.value = []
    unreadCount.value = 0
    currentPage.value = 1
    totalPages.value = 1
    total.value = 0
    error.value = null
    stopPolling()
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
    clearNotifications,
  }
})
