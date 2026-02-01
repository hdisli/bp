import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { UserProfile, PrivateProfile, ActivityItem, ActivityResponse } from '../types/profile'
import type { ApiResponse } from '../types/auth'
import { useAuthStore } from './auth.store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | PrivateProfile | null>(null)
  const activity = ref<ActivityItem[]>([])
  const activityPagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const isLoading = ref(false)
  const isActivityLoading = ref(false)
  const error = ref<string | null>(null)

  // AbortControllers für Request-Cancellation
  let fetchProfileAbortController: AbortController | null = null
  let fetchActivityAbortController: AbortController | null = null

  async function fetchProfile(userId: number): Promise<void> {
    // Cancel previous request
    if (fetchProfileAbortController) {
      fetchProfileAbortController.abort()
    }
    fetchProfileAbortController = new AbortController()

    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const response = await axios.get<ApiResponse<UserProfile | PrivateProfile>>(
        `${API_URL}/api/users/${userId}/profile`,
        {
          headers: authStore.getAuthHeader(),
          signal: fetchProfileAbortController.signal,
        }
      )

      if (response.data.success && response.data.data) {
        profile.value = response.data.data
      }
    } catch (err: unknown) {
      // Ignore aborted requests
      if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
        return
      }

      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Profil konnte nicht geladen werden.'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchActivity(
    userId: number,
    page: number = 1,
    type: string = 'all'
  ): Promise<void> {
    // Cancel previous request
    if (fetchActivityAbortController) {
      fetchActivityAbortController.abort()
    }
    fetchActivityAbortController = new AbortController()

    isActivityLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const response = await axios.get<ApiResponse<ActivityResponse>>(
        `${API_URL}/api/users/${userId}/activity`,
        {
          params: { page, limit: 20, type },
          headers: authStore.getAuthHeader(),
          signal: fetchActivityAbortController.signal,
        }
      )

      if (response.data.success && response.data.data) {
        activity.value = response.data.data.items
        activityPagination.value = response.data.data.pagination
      }
    } catch (err: unknown) {
      // Ignore aborted requests
      if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
        return
      }

      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Aktivität konnte nicht geladen werden.'
      }
    } finally {
      isActivityLoading.value = false
    }
  }

  async function updateProfile(data: Record<string, unknown>): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const response = await axios.put<ApiResponse<UserProfile>>(
        `${API_URL}/api/users/profile`,
        data,
        { headers: authStore.getAuthHeader() }
      )

      if (response.data.success && response.data.data) {
        profile.value = response.data.data
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Profil konnte nicht aktualisiert werden.'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function uploadAvatar(file: File): Promise<string | null> {
    error.value = null

    try {
      const authStore = useAuthStore()
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await axios.post<ApiResponse<{ avatarUrl: string }>>(
        `${API_URL}/api/users/avatar`,
        formData,
        {
          headers: authStore.getAuthHeader(),
        }
      )

      if (response.data.success && response.data.data) {
        const avatarUrl = response.data.data.avatarUrl
        // Update auth store user
        if (authStore.user) {
          authStore.user.avatarUrl = avatarUrl
          authStore.saveToStorage()
        }
        // Update profile if loaded
        if (profile.value && 'id' in profile.value) {
          profile.value.avatarUrl = avatarUrl
        }
        return avatarUrl
      }
      return null
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Avatar konnte nicht hochgeladen werden.'
      }
      return null
    }
  }

  async function updateAccount(data: Record<string, unknown>): Promise<boolean> {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const response = await axios.put<ApiResponse<{ message: string }>>(
        `${API_URL}/api/users/account`,
        data,
        { headers: authStore.getAuthHeader() }
      )

      if (response.data.success) {
        // If email changed, update auth store
        if (data.email && authStore.user) {
          authStore.user.email = data.email as string
          authStore.saveToStorage()
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
        error.value = 'Account konnte nicht aktualisiert werden.'
      }
      return false
    } finally {
      isLoading.value = false
    }
  }

  function clearError(): void {
    error.value = null
  }

  return {
    profile,
    activity,
    activityPagination,
    isLoading,
    isActivityLoading,
    error,
    fetchProfile,
    fetchActivity,
    updateProfile,
    uploadAvatar,
    updateAccount,
    clearError,
  }
})
