<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { MessageSquare, Bold, Italic } from 'lucide-vue-next'
import EmojiPicker from './EmojiPicker.vue'
import MentionDropdown from './MentionDropdown.vue'

interface ExistingRating {
  id: number
  productRating: number
  pricePerformance: number
  quality: number
  ingredients: number
  packaging: number
  title: string | null
  comment: string | null
}

const props = defineProps<{
  productId: number
  existingRating?: ExistingRating | null
  availableUsernames?: string[]
}>()

const emit = defineEmits<{
  submitted: []
  cancel: []
}>()

const authStore = useAuthStore()

const isEditMode = computed(() => !!props.existingRating)

const productRating = ref(props.existingRating?.productRating ?? 5)
const pricePerformance = ref(props.existingRating?.pricePerformance ?? 5)
const quality = ref(props.existingRating?.quality ?? 5)
const ingredients = ref(props.existingRating?.ingredients ?? 5)
const packaging = ref(props.existingRating?.packaging ?? 5)
const title = ref(props.existingRating?.title ?? '')
const comment = ref(props.existingRating?.comment ?? '')
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref(false)
const hasSubmitted = ref(false)
const showCommentPrompt = ref(false)
const commentSectionHighlight = ref(false)

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const mentionQuery = ref('')
const mentionVisible = ref(false)
const mentionPosition = ref({ top: 0, left: 0 })
const mentionStartIndex = ref(-1)

watch(
  () => props.existingRating,
  (val) => {
    if (val) {
      productRating.value = val.productRating
      pricePerformance.value = val.pricePerformance
      quality.value = val.quality
      ingredients.value = val.ingredients
      packaging.value = val.packaging
      title.value = val.title ?? ''
      comment.value = val.comment ?? ''
      hasSubmitted.value = false
      successMessage.value = false
      errorMessage.value = null
    }
  },
)

const commentLength = computed(() => comment.value.length)

const isFormValid = computed(() => {
  return (
    productRating.value >= 1 &&
    productRating.value <= 10 &&
    pricePerformance.value >= 1 &&
    pricePerformance.value <= 10 &&
    quality.value >= 1 &&
    quality.value <= 10 &&
    ingredients.value >= 1 &&
    ingredients.value <= 10 &&
    packaging.value >= 1 &&
    packaging.value <= 10 &&
    title.value.length <= 100 &&
    comment.value.length <= 500
  )
})

const mainSlider = { model: productRating, label: 'Gesamt', weight: '40%' }

const detailSliders = [
  { model: pricePerformance, label: 'Preis-Leistung', weight: '15%' },
  { model: quality, label: 'Qualität', weight: '15%' },
  { model: ingredients, label: 'Inhaltsstoffe', weight: '15%' },
  { model: packaging, label: 'Verpackung', weight: '15%' },
]

function sliderColor(value: number): string {
  if (value < 5) return 'accent-red-500'
  if (value <= 7) return 'accent-orange-400'
  return 'accent-emerald-500'
}

function scoreColor(value: number): string {
  if (value < 5) return 'text-red-600'
  if (value <= 7) return 'text-orange-500'
  return 'text-emerald-600'
}

function insertEmoji(emoji: string) {
  const textarea = textareaRef.value
  if (!textarea) {
    comment.value += emoji
    return
  }
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = comment.value.substring(0, start)
  const after = comment.value.substring(end)
  comment.value = before + emoji + after
  nextTick(() => {
    textarea.focus()
    const pos = start + emoji.length
    textarea.setSelectionRange(pos, pos)
  })
}

function handleCommentInput() {
  const textarea = textareaRef.value
  if (!textarea) return

  const cursorPos = textarea.selectionStart
  const textBefore = comment.value.substring(0, cursorPos)
  const match = textBefore.match(/@(\w*)$/)

  if (match) {
    mentionStartIndex.value = match.index!
    mentionQuery.value = match[1]
    mentionVisible.value = true
    mentionPosition.value = { top: -180, left: 0 }
  } else {
    mentionVisible.value = false
  }
}

function wrapSelection(prefix: string, suffix: string) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = comment.value
  const selected = text.substring(start, end)

  // If already wrapped, unwrap
  const before = text.substring(0, start)
  const after = text.substring(end)
  if (before.endsWith(prefix) && after.startsWith(suffix)) {
    comment.value = before.slice(0, -prefix.length) + selected + after.slice(suffix.length)
    nextTick(() => {
      textarea.focus()
      textarea.setSelectionRange(start - prefix.length, end - prefix.length)
    })
    return
  }

  comment.value = before + prefix + selected + suffix + after
  nextTick(() => {
    textarea.focus()
    if (selected) {
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    } else {
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }
  })
}

function handleKeyboardShortcut(e: KeyboardEvent) {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return

  if (e.key === 'b') {
    e.preventDefault()
    wrapSelection('**', '**')
  } else if (e.key === 'i') {
    e.preventDefault()
    wrapSelection('*', '*')
  }
}

function selectMention(username: string) {
  const before = comment.value.substring(0, mentionStartIndex.value)
  const after = comment.value.substring(
    mentionStartIndex.value + mentionQuery.value.length + 1,
  )
  comment.value = before + '@' + username + ' ' + after
  mentionVisible.value = false

  nextTick(() => {
    const textarea = textareaRef.value
    if (textarea) {
      const pos = mentionStartIndex.value + username.length + 2
      textarea.focus()
      textarea.setSelectionRange(pos, pos)
    }
  })
}

function handleSubmitClick() {
  if (!isFormValid.value || isSubmitting.value || hasSubmitted.value) return

  // If no comment and not in edit mode, show the prompt
  if (!comment.value.trim() && !isEditMode.value && !showCommentPrompt.value) {
    showCommentPrompt.value = true
    return
  }

  handleSubmit()
}

function handleAddComment() {
  showCommentPrompt.value = false
  commentSectionHighlight.value = true
  nextTick(() => {
    textareaRef.value?.focus()
  })
  setTimeout(() => {
    commentSectionHighlight.value = false
  }, 1500)
}

function handleSkipComment() {
  showCommentPrompt.value = false
  handleSubmit()
}

async function handleSubmit() {
  if (!isFormValid.value || isSubmitting.value || hasSubmitted.value) return

  isSubmitting.value = true
  errorMessage.value = null

  const payload = {
    productRating: productRating.value,
    pricePerformance: pricePerformance.value,
    quality: quality.value,
    ingredients: ingredients.value,
    packaging: packaging.value,
    title: title.value || undefined,
    comment: comment.value || undefined,
  }

  try {
    if (isEditMode.value && props.existingRating) {
      await axios.put(
        `/api/products/${props.productId}/ratings/${props.existingRating.id}`,
        payload,
        { headers: authStore.getAuthHeader() },
      )
    } else {
      await axios.post(
        `/api/products/${props.productId}/ratings`,
        payload,
        { headers: authStore.getAuthHeader() },
      )
    }

    successMessage.value = true
    hasSubmitted.value = true
    emit('submitted')

    setTimeout(() => {
      successMessage.value = false
    }, 3000)
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      errorMessage.value = 'Du hast dieses Produkt bereits bewertet'
      hasSubmitted.value = true
    } else if (axios.isAxiosError(err) && err.response?.status === 401) {
      errorMessage.value = 'Bitte melde dich an, um eine Bewertung abzugeben'
    } else if (axios.isAxiosError(err) && err.response?.status === 403) {
      errorMessage.value = 'Deine E-Mail-Adresse muss bestätigt werden, um Bewertungen abzugeben'
    } else {
      errorMessage.value = 'Bewertung konnte nicht gespeichert werden'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
    <p class="text-emerald-700 font-medium">
      {{ isEditMode ? 'Bewertung erfolgreich aktualisiert!' : 'Bewertung erfolgreich gespeichert!' }}
    </p>
  </div>

  <div v-else-if="hasSubmitted && errorMessage" class="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
    <p class="text-red-700 font-medium">{{ errorMessage }}</p>
  </div>

  <!-- Comment Prompt Dialog -->
  <div
    v-else-if="showCommentPrompt"
    class="bg-gray-50 rounded-2xl p-6 text-center space-y-4 animate-scale-in"
  >
    <div class="w-12 h-12 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center">
      <MessageSquare :size="22" class="text-gray-500" />
    </div>
    <div class="space-y-1.5">
      <p class="text-sm font-medium text-gray-900">Willst du uns nicht deine Meinung auch sagen?</p>
      <p class="text-xs text-gray-400">Dein Kommentar hilft anderen bei der Kaufentscheidung</p>
    </div>
    <div class="flex gap-3">
      <button
        type="button"
        @click="handleSkipComment"
        class="flex-1 py-3 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200"
      >
        Ohne Kommentar bewerten
      </button>
      <button
        type="button"
        @click="handleAddComment"
        class="flex-1 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200"
      >
        Kommentar schreiben
      </button>
    </div>
  </div>

  <form v-else @submit.prevent="handleSubmitClick" class="space-y-6">
    <!-- Produktbewertung (40%) -->
    <div class="bg-gray-50 rounded-2xl p-5 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-900">{{ mainSlider.label }}</label>
          <span class="text-[11px] text-gray-400 font-medium">{{ mainSlider.weight }}</span>
        </div>
        <span :class="['text-lg font-bold', scoreColor(mainSlider.model.value)]">{{ mainSlider.model.value.toFixed(1) }}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        step="0.5"
        v-model.number="mainSlider.model.value"
        :class="['w-full h-3 bg-gray-200 rounded-full cursor-pointer', sliderColor(mainSlider.model.value)]"
      />
      <div class="flex justify-between text-[11px] text-gray-400">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>

    <!-- Einzelbewertungen (je 15%) -->
    <div class="space-y-4">
      <p class="text-[11px] font-medium text-gray-400 uppercase tracking-widest">Einzelbewertungen</p>
      <div v-for="s in detailSliders" :key="s.label" class="space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-500">{{ s.label }}</label>
            <span class="text-[11px] text-gray-300 font-medium">{{ s.weight }}</span>
          </div>
          <span :class="['text-sm font-semibold', scoreColor(s.model.value)]">{{ s.model.value.toFixed(1) }}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          v-model.number="s.model.value"
          :class="['w-full h-2.5 bg-gray-100 rounded-full cursor-pointer', sliderColor(s.model.value)]"
        />
      </div>
    </div>

    <!-- Titel -->
    <div class="space-y-2">
      <label for="rating-title" class="text-sm text-gray-500">Titel (optional)</label>
      <input
        id="rating-title"
        v-model="title"
        type="text"
        maxlength="100"
        placeholder="Kurze Zusammenfassung deiner Erfahrung"
        class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all duration-200"
      />
      <p class="text-xs text-gray-400 text-right">{{ title.length }}/100</p>
    </div>

    <!-- Kommentar -->
    <div :class="['space-y-2 rounded-2xl transition-all duration-700', commentSectionHighlight ? 'bg-gray-100 ring-2 ring-gray-300 p-4 -m-4' : '']">
      <div class="flex items-center justify-between">
        <label class="text-sm text-gray-500">Kommentar (optional)</label>
        <span :class="['text-xs', commentLength > 500 ? 'text-red-500' : 'text-gray-400']">{{ commentLength }} / 500</span>
      </div>
      <div class="relative">
        <textarea
          ref="textareaRef"
          v-model="comment"
          @input="handleCommentInput"
          @keydown="handleKeyboardShortcut"
          rows="5"
          maxlength="500"
          placeholder="Teile deine Erfahrung mit diesem Produkt... Nutze @username um andere zu erwähnen"
          class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 resize-none transition-all duration-200"
        />
        <MentionDropdown
          :query="mentionQuery"
          :usernames="availableUsernames || []"
          :visible="mentionVisible"
          :position="mentionPosition"
          @select="selectMention"
        />
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-0.5">
          <button
            type="button"
            @click="wrapSelection('**', '**')"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Fett (Strg+B)"
            aria-label="Fett"
          >
            <Bold :size="14" />
          </button>
          <button
            type="button"
            @click="wrapSelection('*', '*')"
            class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Kursiv (Strg+I)"
            aria-label="Kursiv"
          >
            <Italic :size="14" />
          </button>
        </div>
        <div class="w-px h-4 bg-gray-200"></div>
        <EmojiPicker @select="insertEmoji" />
        <span class="text-[11px] text-gray-300">Strg+B Fett, Strg+I Kursiv</span>
      </div>
    </div>

    <div v-if="errorMessage && !hasSubmitted" class="text-sm text-red-600">
      {{ errorMessage }}
    </div>

    <div class="flex gap-3">
      <button
        v-if="isEditMode"
        type="button"
        @click="emit('cancel')"
        class="flex-1 py-3.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200"
      >
        Abbrechen
      </button>
      <button
        type="submit"
        :disabled="!isFormValid || isSubmitting"
        :class="[
          'py-3.5 text-white text-sm font-medium rounded-full disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200',
          isEditMode ? 'flex-1 bg-gray-900 hover:bg-gray-800' : 'w-full bg-gray-900 hover:bg-gray-800'
        ]"
      >
        {{ isSubmitting ? 'Wird gespeichert...' : isEditMode ? 'Änderungen speichern' : 'Bewertung abgeben' }}
      </button>
    </div>
  </form>
</template>
