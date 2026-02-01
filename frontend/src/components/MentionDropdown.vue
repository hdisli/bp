<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  query: string
  usernames: string[]
  visible: boolean
  position: { top: number; left: number }
}>()

const emit = defineEmits<{
  select: [username: string]
}>()

const filteredUsers = computed(() => {
  if (!props.query) return props.usernames.slice(0, 5)
  const q = props.query.toLowerCase()
  return props.usernames
    .filter((u) => u.toLowerCase().includes(q))
    .slice(0, 5)
})

function selectUser(username: string) {
  emit('select', username)
}
</script>

<template>
  <div
    v-if="visible && filteredUsers.length > 0"
    class="absolute z-50 w-52 bg-white border border-gray-200/60 rounded-2xl shadow-lg overflow-hidden animate-scale-in"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <div class="py-1">
      <button
        v-for="user in filteredUsers"
        :key="user"
        type="button"
        @mousedown.prevent="selectUser(user)"
        class="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-gray-50 transition-colors duration-150 text-left"
      >
        <div class="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center shrink-0">
          <span class="text-white text-[10px] font-medium">{{ user.charAt(0).toUpperCase() }}</span>
        </div>
        <span class="text-sm text-gray-900 font-medium truncate">@{{ user }}</span>
      </button>
    </div>
  </div>
</template>
