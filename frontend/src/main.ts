import { createApp } from 'vue'
import { createPinia } from 'pinia'
import axios from 'axios'
import router from './router'
import App from './App.vue'
import './index.css'
import { useAuthStore } from './stores/auth.store'

axios.defaults.xsrfCookieName = 'XSRF-TOKEN'
axios.defaults.xsrfHeaderName = 'x-xsrf-token'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Global error handler to prevent full-app crashes
app.config.errorHandler = (err, instance, info) => {
  if (import.meta.env.DEV) {
    console.error(`[Vue Error] ${info}:`, err)
  }
}

// Initialize auth store and load tokens from storage
const authStore = useAuthStore()
authStore.loadFromStorage()

app.mount('#app')
