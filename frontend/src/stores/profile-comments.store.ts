import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from './auth.store'

export interface ProfileCommentAuthor {
  id: number
  username: string
  avatarUrl: string | null
}

export type ReactionType =
  | 'like'
  | 'love'
  | 'laugh'
  | 'wow'
  | 'fire'
  | 'idea'
  | 'party'
  | 'clap'
  | 'poop'
  | 'clown'
  | 'sleepy'
  | 'vomit'

export const REACTION_TYPES: ReactionType[] = [
  'like',
  'love',
  'laugh',
  'wow',
  'fire',
  'idea',
  'party',
  'clap',
  'poop',
  'clown',
  'sleepy',
  'vomit',
]

export interface ReactionCount {
  type: ReactionType
  count: number
  userReacted: boolean
}

export interface ProfileComment {
  id: number
  comment: string
  createdAt: string
  author: ProfileCommentAuthor
  reactions: ReactionCount[]
  totalReactions: number
}

export interface ReactionUser {
  id: number
  username: string
  avatarUrl: string | null
}

export interface ReactionDetail {
  type: ReactionType
  users: ReactionUser[]
  totalCount: number
  hasMore: boolean
}

export interface ProfileCommentsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const useProfileCommentsStore = defineStore('profileComments', () => {
  const comments = ref<ProfileComment[]>([])
  const pagination = ref<ProfileCommentsPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const error = ref<string | null>(null)

  // AbortController für Request-Cancellation
  let fetchCommentsAbortController: AbortController | null = null

  async function fetchComments(profileUserId: number, page = 1): Promise<void> {
    // Cancel previous request
    if (fetchCommentsAbortController) {
      fetchCommentsAbortController.abort()
    }
    fetchCommentsAbortController = new AbortController()

    error.value = null
    isLoading.value = true

    const authStore = useAuthStore()

    try {
      const response = await fetch(
        `/api/users/${profileUserId}/profile-comments?page=${page}&limit=20`,
        {
          headers: authStore.getAuthHeader(),
          credentials: 'include',
          signal: fetchCommentsAbortController.signal,
        },
      )

      // Don't process if request was aborted
      if (fetchCommentsAbortController.signal.aborted) {
        return
      }

      const data = await response.json()

      if (data.success) {
        comments.value = data.data.comments
        pagination.value = data.data.pagination
      } else {
        error.value = data.error?.message || 'Fehler beim Laden der Kommentare.'
      }
    } catch (err) {
      // Ignore aborted requests
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      error.value = 'Netzwerkfehler beim Laden der Kommentare.'
      if (err instanceof Error) {
        console.error('Fetch profile comments error:', err.message, err.stack)
      } else {
        console.error('Unknown error:', err)
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createComment(
    profileUserId: number,
    comment: string,
  ): Promise<boolean> {
    error.value = null
    isSubmitting.value = true

    const authStore = useAuthStore()

    try {
      const response = await fetch(`/api/users/${profileUserId}/profile-comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authStore.getAuthHeader(),
        },
        body: JSON.stringify({ comment }),
        credentials: 'include',
      })

      const data = await response.json()

      if (data.success) {
        // Prepend neuen Kommentar zur Liste
        comments.value.unshift(data.data)
        pagination.value.total += 1
        return true
      } else {
        error.value = data.error?.message || 'Fehler beim Erstellen des Kommentars.'
        return false
      }
    } catch (err) {
      error.value = 'Netzwerkfehler beim Erstellen des Kommentars.'
      if (err instanceof Error) {
        console.error('Create profile comment error:', err.message, err.stack)
      } else {
        console.error('Unknown error:', err)
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteComment(
    profileUserId: number,
    commentId: number,
  ): Promise<boolean> {
    error.value = null

    const authStore = useAuthStore()

    try {
      const response = await fetch(
        `/api/users/${profileUserId}/profile-comments/${commentId}`,
        {
          method: 'DELETE',
          headers: authStore.getAuthHeader(),
          credentials: 'include',
        },
      )

      if (response.status === 204) {
        // Entferne Kommentar aus Liste
        comments.value = comments.value.filter((c) => c.id !== commentId)
        pagination.value.total -= 1
        return true
      } else {
        const data = await response.json()
        error.value = data.error?.message || 'Fehler beim Löschen des Kommentars.'
        return false
      }
    } catch (err) {
      error.value = 'Netzwerkfehler beim Löschen des Kommentars.'
      if (err instanceof Error) {
        console.error('Delete profile comment error:', err.message, err.stack)
      } else {
        console.error('Unknown error:', err)
      }
      return false
    }
  }

  async function reactToComment(
    profileUserId: number,
    commentId: number,
    type: ReactionType,
  ): Promise<boolean> {
    error.value = null
    const authStore = useAuthStore()

    try {
      const response = await fetch(
        `/api/users/${profileUserId}/profile-comments/${commentId}/reactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authStore.getAuthHeader(),
          },
          body: JSON.stringify({ type }),
          credentials: 'include',
        },
      )

      if (response.status === 204) {
        // Aktualisiere lokale Reaktionen (optimistic update)
        const comment = comments.value.find((c) => c.id === commentId)
        if (comment) {
          // 1. Finde die alte Reaction des Users (wenn vorhanden)
          const oldUserReaction = comment.reactions.find((r) => r.userReacted)

          // 2. Entferne die alte Reaction
          if (oldUserReaction) {
            oldUserReaction.count--
            oldUserReaction.userReacted = false
          }

          // 3. Füge die neue Reaction hinzu oder erhöhe Count
          const newReaction = comment.reactions.find((r) => r.type === type)
          if (newReaction) {
            newReaction.count++
            newReaction.userReacted = true
          } else {
            comment.reactions.push({ type, count: 1, userReacted: true })
          }

          // 4. Entferne Reactions mit count = 0
          comment.reactions = comment.reactions.filter((r) => r.count > 0)

          // 5. Update total count
          comment.totalReactions = comment.reactions.reduce((sum, r) => sum + r.count, 0)
        }
        return true
      }

      // Error bei nicht-204 Response
      const data = await response.json()
      error.value = data.error?.message || 'Reaktion konnte nicht gespeichert werden.'
      return false
    } catch (err) {
      // Error bei Network-Fehler
      error.value = 'Netzwerkfehler beim Speichern der Reaktion.'
      if (err instanceof Error) {
        console.error('React to comment error:', err.message, err.stack)
      } else {
        console.error('Unknown error:', err)
      }
      return false
    }
  }

  async function removeReaction(
    profileUserId: number,
    commentId: number,
  ): Promise<boolean> {
    error.value = null
    const authStore = useAuthStore()

    try {
      const response = await fetch(
        `/api/users/${profileUserId}/profile-comments/${commentId}/reactions`,
        {
          method: 'DELETE',
          headers: authStore.getAuthHeader(),
          credentials: 'include',
        },
      )

      if (response.status === 204) {
        // Entferne Reaktion lokal
        const comment = comments.value.find((c) => c.id === commentId)
        if (comment) {
          comment.reactions = comment.reactions
            .map((r) => {
              if (r.userReacted) {
                return { ...r, count: r.count - 1, userReacted: false }
              }
              return r
            })
            .filter((r) => r.count > 0)
          comment.totalReactions = comment.reactions.reduce((sum, r) => sum + r.count, 0)
        }
        return true
      }

      // Error bei nicht-204 Response
      const data = await response.json()
      error.value = data.error?.message || 'Reaktion konnte nicht entfernt werden.'
      return false
    } catch (err) {
      // Error bei Network-Fehler
      error.value = 'Netzwerkfehler beim Entfernen der Reaktion.'
      if (err instanceof Error) {
        console.error('Remove reaction error:', err.message, err.stack)
      } else {
        console.error('Unknown error:', err)
      }
      return false
    }
  }

  async function fetchReactionDetails(
    profileUserId: number,
    commentId: number,
  ): Promise<ReactionDetail[]> {
    const authStore = useAuthStore()

    try {
      const response = await fetch(
        `/api/users/${profileUserId}/profile-comments/${commentId}/reactions`,
        {
          headers: authStore.getAuthHeader(),
          credentials: 'include',
        },
      )

      const data = await response.json()

      if (data.success) {
        return data.data as ReactionDetail[]
      } else {
        console.error('Failed to fetch reaction details:', data.error)
        return []
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Fetch reaction details error:', err.message, err.stack)
      } else {
        console.error('Unknown error:', err)
      }
      return []
    }
  }

  function reset(): void {
    // Cancel pending requests
    if (fetchCommentsAbortController) {
      fetchCommentsAbortController.abort()
      fetchCommentsAbortController = null
    }

    comments.value = []
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    }
    isLoading.value = false
    isSubmitting.value = false
    error.value = null
  }

  return {
    comments,
    pagination,
    isLoading,
    isSubmitting,
    error,
    fetchComments,
    createComment,
    deleteComment,
    reactToComment,
    removeReaction,
    fetchReactionDetails,
    reset,
  }
})
