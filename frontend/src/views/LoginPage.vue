<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import LoginForm from '../components/LoginForm.vue'
import { Shield } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] flex">
    <!-- Left: Visual Panel (hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-gray-950 relative overflow-hidden items-center justify-center">
      <!-- Decorative gradient orbs -->
      <div class="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full opacity-20"
        style="background: radial-gradient(circle, #991b1b 0%, transparent 70%);"></div>
      <div class="absolute bottom-[-15%] right-[-5%] w-[350px] h-[350px] rounded-full opacity-15"
        style="background: radial-gradient(circle, #fbbf24 0%, transparent 70%);"></div>

      <div class="relative z-10 text-center max-w-md px-8">
        <div class="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <Shield :size="28" class="text-gray-400" />
        </div>
        <h2 class="text-3xl font-bold text-white tracking-tight mb-4">
          Willkommen zurück
        </h2>
        <p class="text-gray-400 leading-relaxed">
          Melde dich an, um auf dein Konto und alle Funktionen zuzugreifen.
        </p>
      </div>
    </div>

    <!-- Right: Form -->
    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-sm space-y-8">
        <div class="text-center lg:text-left">
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Anmelden</h1>
          <p class="mt-2 text-sm text-gray-400">Gib deine Daten ein, um fortzufahren</p>
        </div>

        <LoginForm />

        <p class="text-center lg:text-left text-sm text-gray-400">
          Noch kein Konto?
          <router-link to="/register" class="text-red-800 font-medium hover:text-red-900 transition-colors duration-200">
            Registrieren
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
