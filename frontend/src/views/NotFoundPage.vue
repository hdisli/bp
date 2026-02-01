<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home } from 'lucide-vue-next'

const router = useRouter()

const goHome = () => {
  router.push({ name: 'Home' })
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
    <div class="text-center">
      <p class="text-8xl font-bold text-gray-200 mb-4">404</p>
      <h1 class="text-xl font-semibold text-gray-900 mb-2">Seite nicht gefunden</h1>
      <p class="text-sm text-gray-400 mb-8 max-w-xs mx-auto">
        Die Seite, die du suchst, existiert nicht oder wurde verschoben.
      </p>
      <button
        @click="goHome"
        class="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-800 transition-colors duration-200"
      >
        <Home :size="16" />
        Zur Startseite
      </button>
    </div>
  </div>
</template>
