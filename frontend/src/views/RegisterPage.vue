<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import RegisterForm from '../components/RegisterForm.vue'
import { UserPlus, Mail, CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const registeredEmail = ref<string | null>(null)

onMounted(() => {
  if (authStore.isAuthenticated && !registeredEmail.value) {
    router.push('/')
  }
})

function handleRegistered(email: string) {
  registeredEmail.value = email
}

function goToHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-[calc(100vh-64px)] flex">
    <!-- Left: Visual Panel (hidden on mobile) -->
    <div class="hidden lg:flex lg:w-1/2 bg-gray-950 relative overflow-hidden items-center justify-center">
      <div class="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-20"
        style="background: radial-gradient(circle, #991b1b 0%, transparent 70%);"></div>
      <div class="absolute bottom-[-15%] left-[-5%] w-[350px] h-[350px] rounded-full opacity-15"
        style="background: radial-gradient(circle, #fbbf24 0%, transparent 70%);"></div>

      <div class="relative z-10 text-center max-w-md px-8">
        <div class="w-16 h-16 mx-auto mb-8 rounded-2xl bg-white/[0.06] flex items-center justify-center">
          <component :is="registeredEmail ? Mail : UserPlus" :size="28" class="text-gray-400" />
        </div>
        <h2 class="text-3xl font-bold text-white tracking-tight mb-4">
          {{ registeredEmail ? 'Fast geschafft!' : 'Werde Teil unserer Community' }}
        </h2>
        <p class="text-gray-400 leading-relaxed">
          {{ registeredEmail ? 'Bestätige deine E-Mail-Adresse, um alle Funktionen nutzen zu können.' : 'Erstelle ein Konto und entdecke unsere kuratierte Produktauswahl.' }}
        </p>
      </div>
    </div>

    <!-- Right: Form / Verification Message -->
    <div class="flex-1 flex items-center justify-center px-4 py-12">
      <!-- Verification Success Screen -->
      <div v-if="registeredEmail" class="w-full max-w-sm space-y-6 text-center animate-fade-in">
        <div class="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center">
          <CheckCircle :size="28" class="text-emerald-600" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Konto erstellt</h1>
          <p class="text-sm text-gray-500 leading-relaxed">
            Wir haben eine Bestätigungsmail an
            <span class="font-medium text-gray-900">{{ registeredEmail }}</span>
            gesendet. Bitte bestätige deine E-Mail-Adresse, um Bewertungen abgeben zu können.
          </p>
        </div>
        <div class="bg-amber-50 rounded-2xl p-4 text-left">
          <p class="text-xs text-amber-700 leading-relaxed">
            <span class="font-medium">Hinweis:</span> Ohne E-Mail-Bestätigung kannst du die Plattform erkunden, aber keine Bewertungen abgeben.
          </p>
        </div>
        <button
          @click="goToHome"
          class="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200"
        >
          Zur Startseite
        </button>
      </div>

      <!-- Registration Form -->
      <div v-else class="w-full max-w-sm space-y-8">
        <div class="text-center lg:text-left">
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight">Konto erstellen</h1>
          <p class="mt-2 text-sm text-gray-400">Registriere dich in wenigen Schritten</p>
        </div>

        <RegisterForm @registered="handleRegistered" />

        <p class="text-center lg:text-left text-sm text-gray-400">
          Bereits registriert?
          <router-link to="/login" class="text-red-800 font-medium hover:text-red-900 transition-colors duration-200">
            Anmelden
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
