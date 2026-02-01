<template>
  <div class="min-h-screen bg-[#fafafa] flex flex-col">
    <!-- Header -->
    <header class="glass sticky top-0 z-50 border-b border-gray-200/60">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16 gap-4">
          <!-- Logo -->
          <router-link
            to="/"
            class="text-xl font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors duration-300 flex-shrink-0"
          >
            Product Platform
          </router-link>

          <!-- Search (hidden on mobile) -->
          <div class="hidden md:block flex-1 max-w-lg">
            <SearchBar />
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1 flex-shrink-0">
            <router-link
              to="/"
              class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              active-class="!text-gray-900 !bg-gray-100"
            >
              Home
            </router-link>
            <router-link
              to="/products"
              class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              active-class="!text-gray-900 !bg-gray-100"
            >
              Produkte
            </router-link>

            <template v-if="!authStore.isAuthenticated">
              <router-link
                to="/login"
                class="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
                active-class="!text-gray-900 !bg-gray-100"
              >
                Login
              </router-link>
              <router-link
                to="/register"
                class="ml-1 px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-full hover:bg-red-900 transition-all duration-200"
              >
                Registrieren
              </router-link>
            </template>

            <template v-else>
              <NotificationDropdown />
              <div class="relative ml-2" ref="userDropdownRef">
                <button
                  @click="userDropdownOpen = !userDropdownOpen"
                  class="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-all duration-200"
                  :aria-expanded="userDropdownOpen"
                  aria-label="Benutzermenü"
                >
                  <div
                    v-if="authStore.user?.avatarUrl"
                    class="w-8 h-8 rounded-full overflow-hidden ring-2 ring-red-800"
                  >
                    <img
                      :src="authStore.user.avatarUrl"
                      :alt="authStore.user.username"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div v-else class="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center">
                    <span class="text-xs font-semibold text-white">
                      {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                  <ChevronDown :size="14" class="text-gray-400" />
                </button>

                <!-- Dropdown -->
                <div
                  v-if="userDropdownOpen"
                  class="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 animate-slide-down z-50"
                >
                  <!-- User Info -->
                  <div class="px-4 py-3 flex items-center gap-3">
                    <div
                      v-if="authStore.user?.avatarUrl"
                      class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                    >
                      <img
                        :src="authStore.user.avatarUrl"
                        :alt="authStore.user.username"
                        class="w-full h-full object-cover"
                      />
                    </div>
                    <div v-else class="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-semibold text-white">
                        {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                      </span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ authStore.user?.username }}</p>
                      <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email }}</p>
                    </div>
                  </div>

                  <div class="border-t border-gray-100 my-1"></div>

                  <router-link
                    :to="`/profile/${authStore.user?.id}`"
                    @click="userDropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <UserIcon :size="16" class="text-gray-400" />
                    Mein Profil
                  </router-link>
                  <router-link
                    to="/profile/edit"
                    @click="userDropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <SettingsIcon :size="16" class="text-gray-400" />
                    Profil bearbeiten
                  </router-link>
                  <router-link
                    to="/friends"
                    @click="userDropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <UsersIcon :size="16" class="text-gray-400" />
                    Freunde
                  </router-link>
                  <router-link
                    to="/my-posts"
                    @click="userDropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <FileText :size="16" class="text-gray-400" />
                    Meine Beiträge
                  </router-link>
                  <router-link
                    to="/account/settings"
                    @click="userDropdownOpen = false"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200"
                  >
                    <ShieldIcon :size="16" class="text-gray-400" />
                    Account-Einstellungen
                  </router-link>

                  <div class="border-t border-gray-100 my-1"></div>

                  <button
                    @click="handleLogout(); userDropdownOpen = false"
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut :size="16" />
                    Abmelden
                  </button>
                </div>
              </div>
            </template>
          </nav>

          <!-- Mobile Hamburger -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-200"
            :aria-label="mobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'"
            :aria-expanded="mobileMenuOpen"
          >
            <X v-if="mobileMenuOpen" :size="22" />
            <MenuIcon v-else :size="22" />
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden border-t border-gray-100 animate-slide-down"
      >
        <div class="max-w-7xl mx-auto px-4 py-4 space-y-3">
          <SearchBar />
          <nav class="flex flex-col gap-1 pt-2">
            <router-link
              to="/"
              @click="mobileMenuOpen = false"
              class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
            >
              Home
            </router-link>
            <router-link
              to="/products"
              @click="mobileMenuOpen = false"
              class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
            >
              Produkte
            </router-link>

            <template v-if="!authStore.isAuthenticated">
              <router-link
                to="/login"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              >
                Login
              </router-link>
              <router-link
                to="/register"
                @click="mobileMenuOpen = false"
                class="mt-1 px-4 py-2.5 text-sm font-medium text-white bg-red-800 rounded-xl hover:bg-red-900 transition-all duration-200 text-center"
              >
                Registrieren
              </router-link>
            </template>

            <template v-else>
              <router-link
                to="/notifications"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200 flex items-center gap-2"
              >
                <Bell :size="16" class="text-gray-400" />
                Benachrichtigungen
                <span
                  v-if="notificationStore.unreadCount > 0"
                  class="ml-auto min-w-[20px] h-5 px-1.5 inline-flex items-center justify-center text-xs font-semibold text-white bg-red-800 rounded-full"
                >
                  {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
                </span>
              </router-link>
              <div class="flex items-center gap-3 px-3 py-2.5">
                <div
                  v-if="authStore.user?.avatarUrl"
                  class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                >
                  <img
                    :src="authStore.user.avatarUrl"
                    :alt="authStore.user.username"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div v-else class="w-8 h-8 rounded-full bg-red-800 flex items-center justify-center">
                  <span class="text-xs font-semibold text-white">
                    {{ authStore.user?.username?.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <span class="text-sm font-medium text-gray-700">{{ authStore.user?.username }}</span>
              </div>
              <router-link
                :to="`/profile/${authStore.user?.id}`"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              >
                Mein Profil
              </router-link>
              <router-link
                to="/profile/edit"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              >
                Profil bearbeiten
              </router-link>
              <router-link
                to="/friends"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              >
                Freunde
              </router-link>
              <router-link
                to="/my-posts"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              >
                Meine Beiträge
              </router-link>
              <router-link
                to="/account/settings"
                @click="mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200"
              >
                Account-Einstellungen
              </router-link>
              <button
                @click="handleLogout(); mobileMenuOpen = false"
                class="px-3 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100/80 transition-all duration-200 text-left flex items-center gap-2"
              >
                <LogOut :size="16" />
                Abmelden
              </button>
            </template>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <RouterView />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-200/60 bg-white mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="md:col-span-2">
            <p class="text-lg font-bold text-gray-900 tracking-tight mb-3">Product Platform</p>
            <p class="text-sm text-gray-400 leading-relaxed max-w-sm">
              Sorgfältig ausgewählte Premium-Produkte der besten Marken weltweit.
            </p>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navigation</p>
            <ul class="space-y-2.5">
              <li><router-link to="/" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Home</router-link></li>
              <li><router-link to="/products" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Alle Produkte</router-link></li>
            </ul>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Konto</p>
            <ul class="space-y-2.5">
              <template v-if="authStore.isAuthenticated">
                <li><router-link :to="`/profile/${authStore.user?.id}`" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Mein Profil</router-link></li>
                <li><router-link to="/friends" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Freunde</router-link></li>
                <li><router-link to="/my-posts" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Meine Beiträge</router-link></li>
                <li><router-link to="/account/settings" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Einstellungen</router-link></li>
              </template>
              <template v-else>
                <li><router-link to="/login" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Anmelden</router-link></li>
                <li><router-link to="/register" class="text-sm text-gray-500 hover:text-gray-900 transition-colors duration-200">Registrieren</router-link></li>
              </template>
            </ul>
          </div>
        </div>
        <div class="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p class="text-xs text-gray-400">&copy; {{ currentYear }} Product Platform. Alle Rechte vorbehalten.</p>
          <p class="text-xs text-gray-300">Mit Sorgfalt gestaltet.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  Users as UsersIcon,
  Bell,
  FileText,
} from 'lucide-vue-next'
import SearchBar from './components/SearchBar.vue'
import NotificationDropdown from './components/NotificationDropdown.vue'
import { useAuthStore } from './stores/auth.store'
import { useNotificationStore } from './stores/notification.store'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const mobileMenuOpen = ref(false)
const userDropdownOpen = ref(false)
const userDropdownRef = ref<HTMLElement | null>(null)
const currentYear = new Date().getFullYear()

watch(() => route.path, () => {
  mobileMenuOpen.value = false
  userDropdownOpen.value = false
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    notificationStore.startPolling()
  } else {
    notificationStore.clearNotifications()
  }
}, { immediate: true })

function handleClickOutside(event: MouseEvent) {
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target as Node)) {
    userDropdownOpen.value = false
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    userDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
  notificationStore.stopPolling()
})

const handleLogout = async () => {
  notificationStore.clearNotifications()
  await authStore.logout()
  router.push('/')
}
</script>
