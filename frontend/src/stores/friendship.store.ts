import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Friend, PendingRequest, FriendshipsResponse } from '../types/profile'
import type { ApiResponse } from '../types/auth'
import { useAuthStore } from './auth.store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useFriendshipStore = defineStore('friendship', () => {
  const friends = ref<Friend[]>([])
  const pendingReceived = ref<PendingRequest[]>([])
  const pendingSent = ref<PendingRequest[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFriendships(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const authStore = useAuthStore()
      const response = await axios.get<ApiResponse<FriendshipsResponse>>(
        `${API_URL}/api/friendships`,
        { headers: authStore.getAuthHeader() }
      )

      if (response.data.success && response.data.data) {
        friends.value = response.data.data.friends
        pendingReceived.value = response.data.data.pendingReceived
        pendingSent.value = response.data.data.pendingSent
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Freundschaften konnten nicht geladen werden.'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function sendRequest(userId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.post<ApiResponse<{ friendshipId: number }>>(
        `${API_URL}/api/friendships/${userId}/request`,
        {},
        { headers: authStore.getAuthHeader() }
      )
      return response.data.success === true
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Anfrage konnte nicht gesendet werden.'
      }
      return false
    }
  }

  async function acceptRequest(friendshipId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.put<ApiResponse<{ message: string }>>(
        `${API_URL}/api/friendships/${friendshipId}/accept`,
        {},
        { headers: authStore.getAuthHeader() }
      )
      if (response.data.success) {
        await fetchFriendships()
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Anfrage konnte nicht angenommen werden.'
      }
      return false
    }
  }

  async function rejectRequest(friendshipId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.put<ApiResponse<{ message: string }>>(
        `${API_URL}/api/friendships/${friendshipId}/reject`,
        {},
        { headers: authStore.getAuthHeader() }
      )
      if (response.data.success) {
        await fetchFriendships()
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Anfrage konnte nicht abgelehnt werden.'
      }
      return false
    }
  }

  async function removeFriendship(friendshipId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.delete<ApiResponse<{ message: string }>>(
        `${API_URL}/api/friendships/${friendshipId}`,
        { headers: authStore.getAuthHeader() }
      )
      if (response.data.success) {
        await fetchFriendships()
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Freundschaft konnte nicht beendet werden.'
      }
      return false
    }
  }

  async function blockUser(userId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.post<ApiResponse<{ message: string }>>(
        `${API_URL}/api/friendships/${userId}/block`,
        {},
        { headers: authStore.getAuthHeader() }
      )
      if (response.data.success) {
        await fetchFriendships()
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Benutzer konnte nicht blockiert werden.'
      }
      return false
    }
  }

  async function unblockUser(userId: number): Promise<boolean> {
    error.value = null
    try {
      const authStore = useAuthStore()
      const response = await axios.delete<ApiResponse<{ message: string }>>(
        `${API_URL}/api/friendships/${userId}/unblock`,
        { headers: authStore.getAuthHeader() }
      )
      if (response.data.success) {
        await fetchFriendships()
        return true
      }
      return false
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Blockierung konnte nicht aufgehoben werden.'
      }
      return false
    }
  }

  return {
    friends,
    pendingReceived,
    pendingSent,
    isLoading,
    error,
    fetchFriendships,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriendship,
    blockUser,
    unblockUser,
  }
})
