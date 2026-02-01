<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile.store'
import { useAuthStore } from '../stores/auth.store'
import { usePasswordStrength } from '../composables/usePasswordStrength'
import {
  ChevronRight,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
} from 'lucide-vue-next'

const router = useRouter()
const profileStore = useProfileStore()
const authStore = useAuthStore()

// Email section
const newEmail = ref(authStore.user?.email || '')
const emailCurrentPassword = ref('')
const emailSuccess = ref(false)
const emailError = ref('')

// Password section
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

const { passwordStrength, strengthLabel, strengthColor, strengthTextColor } =
  usePasswordStrength(newPassword)

if (!authStore.user) {
  router.push('/login')
}

async function handleEmailChange() {
  emailSuccess.value = false
  emailError.value = ''

  if (!newEmail.value.trim()) {
    emailError.value = 'E-Mail ist erforderlich'
    return
  }
  if (!emailCurrentPassword.value) {
    emailError.value = 'Aktuelles Passwort ist erforderlich'
    return
  }

  const ok = await profileStore.updateAccount({
    email: newEmail.value.trim().toLowerCase(),
    currentPassword: emailCurrentPassword.value,
  })

  if (ok) {
    emailSuccess.value = true
    emailCurrentPassword.value = ''
    setTimeout(() => { emailSuccess.value = false }, 3000)
  } else {
    emailError.value = profileStore.error || 'Fehler beim Ändern der E-Mail'
    profileStore.clearError()
  }
}

function validatePassword(): string | null {
  if (!currentPassword.value) return 'Aktuelles Passwort ist erforderlich'
  if (newPassword.value.length < 8) return 'Mindestens 8 Zeichen'
  if (!/[a-z]/.test(newPassword.value)) return 'Mindestens ein Kleinbuchstabe'
  if (!/[A-Z]/.test(newPassword.value)) return 'Mindestens ein Großbuchstabe'
  if (!/\d/.test(newPassword.value)) return 'Mindestens eine Zahl'
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword.value))
    return 'Mindestens ein Sonderzeichen'
  if (newPassword.value !== confirmNewPassword.value) return 'Passwörter stimmen nicht überein'
  return null
}

async function handlePasswordChange() {
  passwordSuccess.value = false
  passwordError.value = ''

  const validationError = validatePassword()
  if (validationError) {
    passwordError.value = validationError
    return
  }

  const ok = await profileStore.updateAccount({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
  })

  if (ok) {
    passwordSuccess.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    setTimeout(() => { passwordSuccess.value = false }, 3000)
  } else {
    passwordError.value = profileStore.error || 'Fehler beim Ändern des Passworts'
    profileStore.clearError()
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm mb-8" aria-label="Breadcrumb">
      <router-link to="/" class="text-gray-400 hover:text-gray-600 transition-colors duration-200">Home</router-link>
      <ChevronRight :size="14" class="text-gray-300" />
      <router-link
        v-if="authStore.user"
        :to="`/profile/${authStore.user.id}`"
        class="text-gray-400 hover:text-gray-600 transition-colors duration-200"
      >
        Profil
      </router-link>
      <ChevronRight :size="14" class="text-gray-300" />
      <span class="text-gray-900 font-medium">Account-Einstellungen</span>
    </nav>

    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">Account-Einstellungen</h1>

    <div class="space-y-6">
      <!-- Email Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl">
            <Mail :size="18" class="text-blue-500" />
          </div>
          <div>
            <h2 class="text-sm font-medium text-gray-900">E-Mail ändern</h2>
            <p class="text-xs text-gray-400 mt-0.5">{{ authStore.user?.email }}</p>
          </div>
        </div>

        <div
          v-if="emailSuccess"
          class="mb-4 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-200/60"
          role="alert"
        >
          E-Mail erfolgreich geändert
        </div>
        <div
          v-if="emailError"
          class="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200/60"
          role="alert"
        >
          {{ emailError }}
        </div>

        <form @submit.prevent="handleEmailChange" class="space-y-4">
          <div>
            <label for="newEmail" class="block text-sm font-medium text-gray-700 mb-1.5">Neue E-Mail</label>
            <input
              id="newEmail"
              v-model="newEmail"
              type="email"
              autocomplete="email"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
              placeholder="neue@email.de"
            />
          </div>

          <div>
            <label for="emailPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Aktuelles Passwort</label>
            <input
              id="emailPassword"
              v-model="emailCurrentPassword"
              type="password"
              autocomplete="current-password"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
              placeholder="Dein aktuelles Passwort"
            />
          </div>

          <button
            type="submit"
            :disabled="profileStore.isLoading"
            class="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            E-Mail ändern
          </button>
        </form>
      </div>

      <!-- Password Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-xl">
            <KeyRound :size="18" class="text-amber-500" />
          </div>
          <div>
            <h2 class="text-sm font-medium text-gray-900">Passwort ändern</h2>
            <p class="text-xs text-gray-400 mt-0.5">Wähle ein sicheres Passwort</p>
          </div>
        </div>

        <div
          v-if="passwordSuccess"
          class="mb-4 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-200/60"
          role="alert"
        >
          Passwort erfolgreich geändert
        </div>
        <div
          v-if="passwordError"
          class="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200/60"
          role="alert"
        >
          {{ passwordError }}
        </div>

        <form @submit.prevent="handlePasswordChange" class="space-y-4">
          <div>
            <label for="currentPwd" class="block text-sm font-medium text-gray-700 mb-1.5">Aktuelles Passwort</label>
            <div class="relative">
              <input
                id="currentPwd"
                v-model="currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                autocomplete="current-password"
                class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 pr-11"
                placeholder="Aktuelles Passwort"
              />
              <button
                type="button"
                @click="showCurrentPassword = !showCurrentPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                :aria-label="showCurrentPassword ? 'Passwort verbergen' : 'Passwort anzeigen'"
              >
                <EyeOff v-if="!showCurrentPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <div>
            <label for="newPwd" class="block text-sm font-medium text-gray-700 mb-1.5">Neues Passwort</label>
            <div class="relative">
              <input
                id="newPwd"
                v-model="newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 pr-11"
                placeholder="Min. 8 Zeichen"
              />
              <button
                type="button"
                @click="showNewPassword = !showNewPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                :aria-label="showNewPassword ? 'Passwort verbergen' : 'Passwort anzeigen'"
              >
                <EyeOff v-if="!showNewPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>

            <!-- Password Strength Meter -->
            <div v-if="newPassword.length > 0" class="mt-2 flex items-center gap-2">
              <div class="flex-1 flex gap-1">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-all duration-300"
                  :class="i <= passwordStrength ? strengthColor : 'bg-gray-200'"
                ></div>
              </div>
              <span class="text-[11px] font-medium" :class="strengthTextColor">{{ strengthLabel }}</span>
            </div>

            <p class="mt-1.5 text-xs text-gray-400">Min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen</p>
          </div>

          <div>
            <label for="confirmPwd" class="block text-sm font-medium text-gray-700 mb-1.5">Neues Passwort bestätigen</label>
            <div class="relative">
              <input
                id="confirmPwd"
                v-model="confirmNewPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 pr-11"
                placeholder="Passwort wiederholen"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                :aria-label="showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'"
              >
                <EyeOff v-if="!showConfirmPassword" :size="18" />
                <Eye v-else :size="18" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            :disabled="profileStore.isLoading"
            class="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Passwort ändern
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
