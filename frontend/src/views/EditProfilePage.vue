<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '../stores/profile.store'
import { useAuthStore } from '../stores/auth.store'
import {
  ChevronRight,
  Camera,
  UserCog,
  Globe,
  Users,
  Lock,
} from 'lucide-vue-next'
import AvatarCropper from '../components/AvatarCropper.vue'
import type { UserProfile } from '../types/profile'
import { GERMAN_STATES } from '../types/profile'

const router = useRouter()
const profileStore = useProfileStore()
const authStore = useAuthStore()

const bio = ref('')
const age = ref<number | null>(null)
const gender = ref<string | null>(null)
const state = ref('')
const signature = ref('')
const profileVisibility = ref('public')
const allowFriendRequestsFrom = ref('everyone')

const avatarPreview = ref<string | null>(null)
const avatarUploading = ref(false)
const avatarError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const cropImageSource = ref<string | null>(null)
const showCropper = ref(false)

const success = ref(false)

const bioCount = computed(() => bio.value.length)
const signatureCount = computed(() => signature.value.length)

const visibilityIcon = computed(() => {
  if (profileVisibility.value === 'public') return Globe
  if (profileVisibility.value === 'friends_only') return Users
  return Lock
})

const visibilityLabel = computed(() => {
  const map: Record<string, string> = {
    public: 'Öffentlich',
    friends_only: 'Nur Freunde',
    private: 'Privat',
  }
  return map[profileVisibility.value] || profileVisibility.value
})

/** Append cache-buster to avatar URLs to prevent stale images */
function cacheBust(url: string | null): string | null {
  if (!url) return null
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}t=${Date.now()}`
}

onMounted(async () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }
  await profileStore.fetchProfile(authStore.user.id)
  const p = profileStore.profile
  if (p && 'canViewProfile' in p && p.canViewProfile) {
    const fp = p as UserProfile
    bio.value = fp.bio || ''
    age.value = fp.age
    gender.value = fp.gender
    state.value = fp.state || ''
    signature.value = fp.signature || ''
    profileVisibility.value = fp.profileVisibility
    avatarPreview.value = cacheBust(fp.avatarUrl)
    if ('allowFriendRequestsFrom' in fp) {
      allowFriendRequestsFrom.value = (fp as UserProfile & { allowFriendRequestsFrom: string }).allowFriendRequestsFrom || 'everyone'
    }
  }
})

function openFileInput() {
  fileInput.value?.click()
}

function handleFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  avatarError.value = ''

  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = 'Datei darf maximal 5 MB groß sein'
    return
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    avatarError.value = 'Nur JPG, PNG und WebP erlaubt'
    return
  }

  // Read file as data URL and show cropper
  const reader = new FileReader()
  reader.onload = () => {
    cropImageSource.value = reader.result as string
    showCropper.value = true
  }
  reader.readAsDataURL(file)

  // Reset input so the same file can be selected again
  target.value = ''
}

function handleCropCancel() {
  showCropper.value = false
  cropImageSource.value = null
}

async function handleCropDone(file: File) {
  showCropper.value = false
  cropImageSource.value = null
  avatarError.value = ''

  avatarUploading.value = true
  const result = await profileStore.uploadAvatar(file)
  avatarUploading.value = false

  if (result) {
    avatarPreview.value = cacheBust(result)
  } else if (profileStore.error) {
    avatarError.value = profileStore.error
  }
}

async function handleSubmit() {
  success.value = false
  profileStore.clearError()

  const data: Record<string, unknown> = {
    bio: bio.value || null,
    age: age.value,
    gender: gender.value,
    state: state.value || null,
    signature: signature.value || null,
    profileVisibility: profileVisibility.value,
    allowFriendRequestsFrom: allowFriendRequestsFrom.value,
  }

  const ok = await profileStore.updateProfile(data)
  if (ok) {
    success.value = true
    setTimeout(() => { success.value = false }, 3000)
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
      <span class="text-gray-900 font-medium">Bearbeiten</span>
    </nav>

    <h1 class="text-2xl font-bold text-gray-900 tracking-tight mb-6">Profil bearbeiten</h1>

    <!-- Success Message -->
    <div
      v-if="success"
      class="mb-6 bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl border border-emerald-200/60"
      role="alert"
    >
      Profil erfolgreich aktualisiert
    </div>

    <!-- Error -->
    <div
      v-if="profileStore.error"
      class="mb-6 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200/60"
      role="alert"
    >
      {{ profileStore.error }}
    </div>

    <!-- Loading Skeleton -->
    <div v-if="profileStore.isLoading" class="space-y-6">
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <div class="flex items-center gap-5">
          <div class="w-24 h-24 rounded-full skeleton flex-shrink-0"></div>
          <div class="space-y-2">
            <div class="h-4 w-24 skeleton rounded-lg"></div>
            <div class="h-3 w-40 skeleton rounded-lg"></div>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-2xl p-6 sm:p-8 space-y-4">
        <div v-for="i in 5" :key="i" class="h-12 skeleton rounded-xl"></div>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Avatar Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <h2 class="text-sm font-medium text-gray-900 mb-5">Profilbild</h2>
        <div class="flex items-center gap-5">
          <button
            type="button"
            @click="openFileInput"
            class="relative group flex-shrink-0"
            aria-label="Avatar ändern"
          >
            <div
              v-if="avatarPreview"
              class="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100"
            >
              <img :src="avatarPreview" alt="Avatar" class="w-full h-full object-cover" />
            </div>
            <div
              v-else
              class="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center ring-4 ring-gray-100"
            >
              <span class="text-2xl font-bold text-white">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </span>
            </div>
            <!-- Hover Overlay -->
            <div class="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera :size="20" class="text-white" />
            </div>
            <!-- Loading spinner -->
            <div v-if="avatarUploading" class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          </button>
          <div>
            <p class="text-sm font-medium text-gray-700">Bild ändern</p>
            <p class="text-xs text-gray-400 mt-0.5">JPG, PNG oder WebP. Max. 5 MB.</p>
            <p v-if="avatarError" class="text-xs text-red-500 mt-1" aria-live="polite">{{ avatarError }}</p>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="hidden"
            @change="handleFileSelected"
          />
        </div>
      </div>

      <!-- Personal Info Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <h2 class="text-sm font-medium text-gray-900 mb-5">Persönliche Informationen</h2>
        <div class="space-y-5">
          <!-- Bio -->
          <div>
            <label for="bio" class="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              id="bio"
              v-model="bio"
              maxlength="300"
              rows="3"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 resize-none"
              placeholder="Erzähle etwas über dich..."
            ></textarea>
            <p class="mt-1 text-xs text-gray-400 text-right">{{ bioCount }}/300</p>
          </div>

          <!-- Age -->
          <div>
            <label for="age" class="block text-sm font-medium text-gray-700 mb-1.5">Alter</label>
            <input
              id="age"
              v-model.number="age"
              type="number"
              min="13"
              max="120"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
              placeholder="Dein Alter"
            />
          </div>

          <!-- Gender -->
          <fieldset>
            <legend class="block text-sm font-medium text-gray-700 mb-2">Geschlecht</legend>
            <div class="flex gap-3">
              <label
                v-for="option in [
                  { value: 'male', label: 'Männlich' },
                  { value: 'female', label: 'Weiblich' },
                  { value: 'diverse', label: 'Divers' },
                ]"
                :key="option.value"
                class="flex-1 cursor-pointer"
              >
                <input
                  type="radio"
                  name="gender"
                  :value="option.value"
                  v-model="gender"
                  class="sr-only peer"
                />
                <div
                  class="text-center py-2.5 text-sm font-medium rounded-xl transition-all duration-200 peer-checked:bg-gray-900 peer-checked:text-white bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  {{ option.label }}
                </div>
              </label>
            </div>
          </fieldset>

          <!-- State -->
          <div>
            <label for="state" class="block text-sm font-medium text-gray-700 mb-1.5">Bundesland</label>
            <select
              id="state"
              v-model="state"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 appearance-none"
            >
              <option value="">Bitte wählen</option>
              <option v-for="s in GERMAN_STATES" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>

          <!-- Signature -->
          <div>
            <label for="signature" class="block text-sm font-medium text-gray-700 mb-1.5">Signatur</label>
            <input
              id="signature"
              v-model="signature"
              type="text"
              maxlength="150"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200"
              placeholder="Dein persönliches Motto"
            />
            <p class="mt-1 text-xs text-gray-400 text-right">{{ signatureCount }}/150</p>
          </div>
        </div>
      </div>

      <!-- Privacy Card -->
      <div class="bg-white rounded-2xl p-6 sm:p-8">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
            <component :is="visibilityIcon" :size="18" class="text-gray-500" />
          </div>
          <div>
            <h2 class="text-sm font-medium text-gray-900">Privatsphäre</h2>
            <p class="text-xs text-gray-400 mt-0.5">Dein Profil ist {{ visibilityLabel.toLowerCase() }}</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label for="profileVisibility" class="block text-sm font-medium text-gray-700 mb-1.5">Profilsichtbarkeit</label>
            <select
              id="profileVisibility"
              v-model="profileVisibility"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 appearance-none"
            >
              <option value="public">Öffentlich</option>
              <option value="friends_only">Nur Freunde</option>
              <option value="private">Privat</option>
            </select>
          </div>

          <div>
            <label for="friendRequests" class="block text-sm font-medium text-gray-700 mb-1.5">Freundschaftsanfragen von</label>
            <select
              id="friendRequests"
              v-model="allowFriendRequestsFrom"
              class="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all duration-200 appearance-none"
            >
              <option value="everyone">Alle</option>
              <option value="friends_of_friends">Freunde von Freunden</option>
              <option value="none">Niemand</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="profileStore.isLoading"
        class="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span v-if="profileStore.isLoading" class="flex items-center justify-center gap-2">
          <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Wird gespeichert...
        </span>
        <span v-else>Änderungen speichern</span>
      </button>
    </form>

    <!-- Avatar Cropper Modal -->
    <AvatarCropper
      v-if="showCropper && cropImageSource"
      :image-source="cropImageSource"
      @crop="handleCropDone"
      @cancel="handleCropCancel"
    />
  </div>
</template>
