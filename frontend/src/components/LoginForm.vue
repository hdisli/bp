<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const emailOrUsername = ref('')
const password = ref('')
const showPassword = ref(false)

const emailOrUsernameError = ref('')
const passwordError = ref('')

const isFormValid = computed(() => {
  return (
    emailOrUsername.value.trim().length > 0 &&
    password.value.length > 0 &&
    !emailOrUsernameError.value &&
    !passwordError.value
  )
})

function validateEmailOrUsername(): void {
  if (!emailOrUsername.value.trim()) {
    emailOrUsernameError.value = 'E-Mail oder Benutzername erforderlich'
  } else {
    emailOrUsernameError.value = ''
  }
}

function validatePassword(): void {
  if (!password.value) {
    passwordError.value = 'Passwort erforderlich'
  } else {
    passwordError.value = ''
  }
}

async function handleSubmit(): Promise<void> {
  validateEmailOrUsername()
  validatePassword()

  if (!isFormValid.value) return

  authStore.clearError()

  const success = await authStore.login({
    emailOrUsername: emailOrUsername.value.trim(),
    password: password.value,
  })

  if (success) {
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || '/')
  }
}

function togglePassword(): void {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Error Alert -->
    <div
      v-if="authStore.error"
      class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl"
      role="alert"
    >
      {{ authStore.error }}
    </div>

    <!-- Email/Username Field -->
    <div>
      <label for="emailOrUsername" class="block text-sm font-medium text-gray-700 mb-1.5">
        E-Mail oder Benutzername
      </label>
      <input
        id="emailOrUsername"
        v-model="emailOrUsername"
        type="text"
        autocomplete="username"
        required
        @blur="validateEmailOrUsername"
        class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
        :class="{ 'ring-2 ring-red-300 bg-red-50/50': emailOrUsernameError }"
        placeholder="deine@email.de"
      />
      <p v-if="emailOrUsernameError" class="mt-1.5 text-xs text-red-500" aria-live="polite">
        {{ emailOrUsernameError }}
      </p>
    </div>

    <!-- Password Field -->
    <div>
      <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5">
        Passwort
      </label>
      <div class="relative">
        <input
          id="password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          required
          @blur="validatePassword"
          class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 pr-11"
          :class="{ 'ring-2 ring-red-300 bg-red-50/50': passwordError }"
          placeholder="Passwort eingeben"
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
      <p v-if="passwordError" class="mt-1.5 text-xs text-red-500" aria-live="polite">
        {{ passwordError }}
      </p>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      :disabled="authStore.isLoading || !isFormValid"
      class="w-full py-3 bg-red-800 text-white text-sm font-medium rounded-xl hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-800 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span v-if="authStore.isLoading" class="flex items-center justify-center gap-2">
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        Anmeldung...
      </span>
      <span v-else>Anmelden</span>
    </button>
  </form>
</template>
