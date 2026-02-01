<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Averages {
  pricePerformance: number
  quality: number
  ingredients: number
  packaging: number
  productRating: number
  overall: number
}

const props = defineProps<{
  averages: Averages | null
  count: number
}>()

const animated = ref(false)

watch(
  () => props.averages,
  (val) => {
    if (val && props.count > 0) {
      animated.value = false
      nextTick(() => {
        requestAnimationFrame(() => {
          animated.value = true
        })
      })
    }
  },
  { immediate: true },
)

const criteria = [
  { key: 'productRating' as const, label: 'Produktbewertung', weight: '40%' },
  { key: 'pricePerformance' as const, label: 'Preis-Leistung', weight: '15%' },
  { key: 'quality' as const, label: 'Qualität', weight: '15%' },
  { key: 'ingredients' as const, label: 'Inhaltsstoffe', weight: '15%' },
  { key: 'packaging' as const, label: 'Verpackung', weight: '15%' },
]

function barColor(value: number): string {
  if (value < 5.0) return 'bg-red-500'
  if (value <= 7.0) return 'bg-orange-400'
  return 'bg-emerald-500'
}

function barWidth(value: number): string {
  if (!animated.value) return '0%'
  return `${(value / 10) * 100}%`
}
</script>

<template>
  <div v-if="averages && count > 0">
    <div class="space-y-3">
      <div v-for="(c, i) in criteria" :key="c.key" class="flex items-center gap-3">
        <div class="w-32 sm:w-36 shrink-0 flex items-center gap-1.5">
          <span class="text-sm text-gray-500">{{ c.label }}</span>
          <span class="text-[10px] text-gray-300 font-medium">{{ c.weight }}</span>
        </div>
        <div class="flex-1 h-2.5 bg-gray-200/60 rounded-full overflow-hidden">
          <div
            :class="['h-full rounded-full', barColor(averages[c.key])]"
            :style="{
              width: barWidth(averages[c.key]),
              transition: `width 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 100}ms`,
            }"
          />
        </div>
        <span class="text-sm font-medium text-gray-900 w-9 text-right">{{ averages[c.key].toFixed(1) }}</span>
      </div>
    </div>
  </div>
</template>
