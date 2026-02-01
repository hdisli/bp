import { ref, computed, watch, type Ref } from 'vue'
import type { PasswordStrength } from '../types/auth'

export function usePasswordStrength(password: Ref<string>) {
  const passwordStrength = ref<PasswordStrength>(0)

  function calculatePasswordStrength(pwd: string): PasswordStrength {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++
    if (/\d/.test(pwd)) strength++
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) strength++
    return Math.min(strength, 4) as PasswordStrength
  }

  watch(password, (newPassword) => {
    passwordStrength.value = calculatePasswordStrength(newPassword)
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

  return {
    passwordStrength,
    strengthLabel,
    strengthColor,
    strengthTextColor,
  }
}
