<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { Eye, EyeOff } from 'lucide-vue-next'
import type { PasswordStrength } from '../types/auth'

const emit = defineEmits<{
  registered: [email: string]
}>()

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const emailError = ref('')
const usernameError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

const passwordStrength = ref<PasswordStrength>(0)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/

const isFormValid = computed(() => {
  return (
    email.value.trim().length > 0 &&
    username.value.trim().length > 0 &&
    password.value.length >= 8 &&
    confirmPassword.value === password.value &&
    !emailError.value &&
    !usernameError.value &&
    !passwordError.value &&
    !confirmPasswordError.value
  )
})

const strengthLabel = computed(() => {
  const labels = ['Sehr schwach', 'Schwach', 'Mittel', 'Gut', 'Stark']
  return labels[passwordStrength.value]
})

const strengthColor = computed(() => {
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-600']
  return colors[passwordStrength.value]
})

const strengthTextColor = computed(() => {
  const colors = ['text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-500', 'text-green-600']
  return colors[passwordStrength.value]
})

function calculatePasswordStrength(pwd: string): PasswordStrength {
  let strength = 0
  if (pwd.length >= 8) strength++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
  if (/\d/.test(pwd)) strength++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) strength++
  return Math.min(strength, 4) as PasswordStrength
}

watch(password, (newPassword) => {
  passwordStrength.value = calculatePasswordStrength(newPassword)
})

function validateEmail(): void {
  if (!email.value.trim()) {
    emailError.value = 'E-Mail ist erforderlich'
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Bitte gib eine gültige E-Mail ein'
  } else {
    emailError.value = ''
  }
}

function validateUsername(): void {
  if (!username.value.trim()) {
    usernameError.value = 'Benutzername ist erforderlich'
  } else if (username.value.length < 3) {
    usernameError.value = 'Mindestens 3 Zeichen'
  } else if (username.value.length > 30) {
    usernameError.value = 'Maximal 30 Zeichen'
  } else if (!usernameRegex.test(username.value)) {
    usernameError.value = 'Nur Buchstaben, Zahlen und Unterstriche'
  } else {
    usernameError.value = ''
  }
}

function validatePassword(): void {
  if (!password.value) {
    passwordError.value = 'Passwort ist erforderlich'
  } else if (password.value.length < 8) {
    passwordError.value = 'Mindestens 8 Zeichen'
  } else if (!/[a-z]/.test(password.value)) {
    passwordError.value = 'Mindestens ein Kleinbuchstabe erforderlich'
  } else if (!/[A-Z]/.test(password.value)) {
    passwordError.value = 'Mindestens ein Großbuchstabe erforderlich'
  } else if (!/\d/.test(password.value)) {
    passwordError.value = 'Mindestens eine Zahl erforderlich'
  } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password.value)) {
    passwordError.value = 'Mindestens ein Sonderzeichen erforderlich'
  } else {
    passwordError.value = ''
  }

  if (confirmPassword.value) {
    validateConfirmPassword()
  }
}

function validateConfirmPassword(): void {
  if (!confirmPassword.value) {
    confirmPasswordError.value = 'Bitte Passwort bestätigen'
  } else if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwörter stimmen nicht überein'
  } else {
    confirmPasswordError.value = ''
  }
}

async function handleSubmit(): Promise<void> {
  validateEmail()
  validateUsername()
  validatePassword()
  validateConfirmPassword()

  if (!isFormValid.value) return

  authStore.clearError()

  const success = await authStore.register({
    email: email.value.trim().toLowerCase(),
    username: username.value.trim(),
    password: password.value,
  })

  if (success) {
    emit('registered', email.value.trim().toLowerCase())
  }
}

function togglePassword(): void {
  showPassword.value = !showPassword.value
}

function toggleConfirmPassword(): void {
  showConfirmPassword.value = !showConfirmPassword.value
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Error Alert -->
    <div
      v-if="authStore.error"
      class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl"
      role="alert"
    >
      {{ authStore.error }}
    </div>

    <!-- Email -->
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">E-Mail</label>
      <input
        id="email"
        v-model="email"
        type="email"
        autocomplete="email"
        required
        @blur="validateEmail"
        @input="validateEmail"
        class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
        :class="{ 'ring-2 ring-red-300 bg-red-50/50': emailError }"
        placeholder="deine@email.de"
      />
      <p v-if="emailError" class="mt-1.5 text-xs text-red-500" aria-live="polite">{{ emailError }}</p>
    </div>

    <!-- Username -->
    <div>
      <label for="username" class="block text-sm font-medium text-gray-700 mb-1.5">Benutzername</label>
      <input
        id="username"
        v-model="username"
        type="text"
        autocomplete="username"
        required
        @blur="validateUsername"
        @input="validateUsername"
        class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
        :class="{ 'ring-2 ring-red-300 bg-red-50/50': usernameError }"
        placeholder="benutzername"
      />
      <p v-if="usernameError" class="mt-1.5 text-xs text-red-500" aria-live="polite">{{ usernameError }}</p>
      <p v-else class="mt-1.5 text-xs text-gray-400">3-30 Zeichen, Buchstaben, Zahlen, Unterstriche</p>
    </div>

    <!-- Password -->
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">Passwort</label>
      <div class="relative">
        <input
          id="password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="new-password"
          required
          @blur="validatePassword"
          @input="validatePassword"
          class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 pr-11"
          :class="{ 'ring-2 ring-red-300 bg-red-50/50': passwordError }"
          placeholder="Mind. 8 Zeichen"
        />
        <button
          type="button"
          @click="togglePassword"
          class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <EyeOff v-if="!showPassword" :size="18" />
          <Eye v-else :size="18" />
        </button>
      </div>

      <!-- Password Strength Meter -->
      <div v-if="password.length > 0" class="mt-2 flex items-center gap-2">
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

      <p v-if="passwordError" class="mt-1.5 text-xs text-red-500" aria-live="polite">{{ passwordError }}</p>
      <p v-else class="mt-1.5 text-xs text-gray-400">Min. 8 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen</p>
    </div>

    <!-- Confirm Password -->
    <div>
      <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5">Passwort bestätigen</label>
      <div class="relative">
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          required
          @blur="validateConfirmPassword"
          @input="validateConfirmPassword"
          class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 pr-11"
          :class="{ 'ring-2 ring-red-300 bg-red-50/50': confirmPasswordError }"
          placeholder="Passwort wiederholen"
        />
        <button
          type="button"
          @click="toggleConfirmPassword"
          class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <EyeOff v-if="!showConfirmPassword" :size="18" />
          <Eye v-else :size="18" />
        </button>
      </div>
      <p v-if="confirmPasswordError" class="mt-1.5 text-xs text-red-500" aria-live="polite">{{ confirmPasswordError }}</p>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="authStore.isLoading || !isFormValid"
      class="w-full py-3 bg-red-800 text-white text-sm font-medium rounded-xl hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
    >
      <span v-if="authStore.isLoading" class="flex items-center justify-center gap-2">
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Wird erstellt...
      </span>
      <span v-else>Konto erstellen</span>
    </button>
  </form>
</template>
