<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Smile } from 'lucide-vue-next'

const emit = defineEmits<{
  select: [emoji: string]
}>()

const isOpen = ref(false)
const pickerRef = ref<HTMLElement | null>(null)

const categories = [
  {
    label: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😜', '🤔', '🤗', '😎', '🥳', '😤', '😢', '😭', '😱', '🤯', '😴', '🥱', '🙄', '😬'],
  },
  {
    label: 'Gesten',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '💪', '✌️', '🤞', '👌', '🫶', '❤️', '🔥', '⭐', '✨', '💯', '🎉', '🏆', '👀', '💡', '✅'],
  },
  {
    label: 'Objekte',
    emojis: ['📦', '🛒', '💰', '🏷️', '📱', '💻', '🎧', '📸', '🧴', '🍕', '🥤', '🏃', '🌿', '🏠', '🔧', '📝', '🎁', '🚀', '💎', '🌟'],
  },
]

const activeCategory = ref(0)

function toggle() {
  isOpen.value = !isOpen.value
}

function selectEmoji(emoji: string) {
  emit('select', emoji)
  isOpen.value = false
}

function handleClickOutside(event: MouseEvent) {
  if (pickerRef.value && !pickerRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<template>
  <div ref="pickerRef" class="relative inline-block">
    <button
      type="button"
      @click.stop="toggle"
      class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
      title="Emoji einfügen"
    >
      <Smile :size="18" />
    </button>

    <div
      v-if="isOpen"
      class="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200/60 rounded-2xl shadow-lg z-50 animate-scale-in overflow-hidden"
    >
      <!-- Category Tabs -->
      <div class="flex border-b border-gray-100 px-2 pt-2">
        <button
          v-for="(cat, i) in categories"
          :key="cat.label"
          type="button"
          @click="activeCategory = i"
          :class="[
            'px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 mr-1',
            activeCategory === i
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:bg-gray-100'
          ]"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- Emoji Grid -->
      <div class="p-2 grid grid-cols-10 gap-0.5 max-h-40 overflow-y-auto">
        <button
          v-for="emoji in categories[activeCategory].emojis"
          :key="emoji"
          type="button"
          @click="selectEmoji(emoji)"
          class="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded-lg transition-colors duration-150 cursor-pointer"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>
