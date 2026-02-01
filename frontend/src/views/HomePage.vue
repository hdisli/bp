<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductsStore } from '../stores/products.store'
import ProductCard from '../components/ProductCard.vue'
import { ArrowRight, Sparkles, Shield, Globe } from 'lucide-vue-next'

const router = useRouter()
const store = useProductsStore()

onMounted(() => {
  store.fetchFeaturedProducts(6)
})

const goToProducts = () => {
  router.push('/products')
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden bg-gray-950">
      <!-- Animated gradient mesh -->
      <div class="absolute inset-0">
        <div class="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style="background: radial-gradient(circle, #991b1b 0%, transparent 70%);"></div>
        <div class="absolute bottom-[-30%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style="background: radial-gradient(circle, #fbbf24 0%, transparent 70%);"></div>
        <div class="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
          style="background: radial-gradient(circle, #ffffff 0%, transparent 70%);"></div>
      </div>

      <!-- Noise texture overlay -->
      <div class="absolute inset-0 opacity-[0.04]" style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%221%22/%3E%3C/svg%3E');"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
        <div class="max-w-2xl">
          <!-- Eyebrow -->
          <div class="inline-flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm text-gray-300 text-xs font-medium px-4 py-2 rounded-full mb-8 animate-fade-in border border-white/[0.06]">
            <Sparkles :size="13" class="text-amber-400" />
            Premium Kollektion 2025
          </div>

          <h1 class="text-4xl sm:text-5xl md:text-[64px] font-extrabold text-white leading-[1.05] mb-7 tracking-tight animate-fade-in-up">
            Produkte, die
            <br />
            <span class="text-transparent bg-clip-text" style="background-image: linear-gradient(135deg, #fca5a5, #fbbf24, #ffffff);">
              begeistern.
            </span>
          </h1>

          <p class="text-gray-400 text-lg md:text-xl leading-relaxed mb-12 max-w-lg animate-fade-in-up text-balance">
            Kuratiert aus den besten Marken. Handverlesen für höchste Ansprüche.
          </p>

          <div class="flex flex-col sm:flex-row gap-4 animate-fade-in-up">
            <button
              @click="goToProducts"
              class="group inline-flex items-center justify-center gap-2.5 bg-white text-gray-900 font-semibold text-sm px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300"
            >
              Kollektion entdecken
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        <!-- Trust signals -->
        <div class="mt-20 pt-10 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
              <Shield :size="18" class="text-gray-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-white">Geprüfte Qualität</p>
              <p class="text-xs text-gray-500">Jedes Produkt verifiziert</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
              <Globe :size="18" class="text-gray-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-white">Weltweite Marken</p>
              <p class="text-xs text-gray-500">Die besten Hersteller</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
              <Sparkles :size="18" class="text-gray-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-white">Handverlesen</p>
              <p class="text-xs text-gray-500">Kuratierte Auswahl</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
      <div class="flex items-end justify-between mb-12">
        <div>
          <p class="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Empfohlen</p>
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Featured Produkte</h2>
        </div>
        <button
          @click="goToProducts"
          class="hidden md:flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200"
        >
          Alle ansehen
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Skeleton Loading -->
      <div v-if="store.featuredLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        <div v-for="i in 6" :key="i" class="animate-fade-in">
          <div class="skeleton aspect-[4/3] mb-4"></div>
          <div class="space-y-2.5">
            <div class="skeleton h-3 w-16"></div>
            <div class="skeleton h-4 w-3/4"></div>
            <div class="skeleton h-3 w-24"></div>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <div v-else-if="store.featuredProducts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        <ProductCard
          v-for="(product, index) in store.featuredProducts"
          :key="product.id"
          :product="product"
          variant="featured"
          :index="index"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <p class="text-gray-500 mb-6">Noch keine Featured-Produkte verfügbar.</p>
        <button
          @click="goToProducts"
          class="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-800 transition-colors duration-200"
        >
          Alle Produkte ansehen
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Mobile CTA -->
      <div class="md:hidden mt-10 text-center">
        <button
          @click="goToProducts"
          class="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Alle Produkte ansehen
          <ArrowRight class="w-4 h-4" />
        </button>
      </div>
    </section>
  </div>
</template>
