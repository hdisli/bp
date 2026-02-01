<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { X, ZoomIn, ZoomOut, Move } from 'lucide-vue-next'

const props = defineProps<{
  imageSource: string
}>()

const emit = defineEmits<{
  crop: [file: File]
  cancel: []
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const img = ref<HTMLImageElement | null>(null)
const imgLoaded = ref(false)

// Transform state
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

// Drag state
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragOffsetX = ref(0)
const dragOffsetY = ref(0)

const CANVAS_SIZE = 300
const MIN_SCALE = 0.1
const MAX_SCALE = 5

function loadImage() {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.onload = () => {
    img.value = image
    imgLoaded.value = true

    // Fit image to cover the canvas area
    const scaleX = CANVAS_SIZE / image.width
    const scaleY = CANVAS_SIZE / image.height
    scale.value = Math.max(scaleX, scaleY)

    // Center image
    offsetX.value = (CANVAS_SIZE - image.width * scale.value) / 2
    offsetY.value = (CANVAS_SIZE - image.height * scale.value) / 2

    nextTick(() => draw())
  }
  image.src = props.imageSource
}

function draw() {
  const canvas = canvasRef.value
  const image = img.value
  if (!canvas || !image) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = CANVAS_SIZE
  canvas.height = CANVAS_SIZE

  // Clear
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  // 1) Draw blurred background (full canvas, image fills entire area)
  ctx.save()
  ctx.filter = 'blur(20px) brightness(0.6)'
  ctx.drawImage(
    image,
    offsetX.value - 40,
    offsetY.value - 40,
    image.width * scale.value + 80,
    image.height * scale.value + 80,
  )
  ctx.restore()

  // 2) Draw sharp image clipped to circle
  ctx.save()
  ctx.beginPath()
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0, Math.PI * 2)
  ctx.clip()

  ctx.drawImage(
    image,
    offsetX.value,
    offsetY.value,
    image.width * scale.value,
    image.height * scale.value,
  )
  ctx.restore()

  // 3) Draw circle border
  ctx.beginPath()
  ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 1, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.lineWidth = 2
  ctx.stroke()
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  dragOffsetX.value = offsetX.value
  dragOffsetY.value = offsetY.value
  e.preventDefault()
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  offsetX.value = dragOffsetX.value + (e.clientX - dragStartX.value)
  offsetY.value = dragOffsetY.value + (e.clientY - dragStartY.value)
  draw()
}

function handleMouseUp() {
  isDragging.value = false
}

function handleWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.05 : 0.05
  adjustZoom(delta)
}

function adjustZoom(delta: number) {
  const oldScale = scale.value
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale + delta))

  // Zoom toward center
  const centerX = CANVAS_SIZE / 2
  const centerY = CANVAS_SIZE / 2
  offsetX.value = centerX - ((centerX - offsetX.value) / oldScale) * newScale
  offsetY.value = centerY - ((centerY - offsetY.value) / oldScale) * newScale
  scale.value = newScale

  draw()
}

function zoomIn() {
  adjustZoom(0.15)
}

function zoomOut() {
  adjustZoom(-0.15)
}

// Touch support
let lastTouchDist = 0
let lastTouchX = 0
let lastTouchY = 0

function handleTouchStart(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length === 1) {
    isDragging.value = true
    dragStartX.value = e.touches[0].clientX
    dragStartY.value = e.touches[0].clientY
    dragOffsetX.value = offsetX.value
    dragOffsetY.value = offsetY.value
  } else if (e.touches.length === 2) {
    isDragging.value = false
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    lastTouchDist = Math.sqrt(dx * dx + dy * dy)
    lastTouchX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    lastTouchY = (e.touches[0].clientY + e.touches[1].clientY) / 2
  }
}

function handleTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (e.touches.length === 1 && isDragging.value) {
    offsetX.value = dragOffsetX.value + (e.touches[0].clientX - dragStartX.value)
    offsetY.value = dragOffsetY.value + (e.touches[0].clientY - dragStartY.value)
    draw()
  } else if (e.touches.length === 2) {
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const dist = Math.sqrt(dx * dx + dy * dy)
    const delta = (dist - lastTouchDist) * 0.005
    lastTouchDist = dist
    adjustZoom(delta)
  }
}

function handleTouchEnd() {
  isDragging.value = false
}

async function handleCrop() {
  const image = img.value
  if (!image) return

  // Create output canvas at 400x400
  const outputSize = 400
  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = outputSize
  outputCanvas.height = outputSize
  const ctx = outputCanvas.getContext('2d')
  if (!ctx) return

  // Scale factor from preview to output
  const factor = outputSize / CANVAS_SIZE

  // Clip to circle
  ctx.beginPath()
  ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
  ctx.clip()

  // Draw at scaled coordinates
  ctx.drawImage(
    image,
    offsetX.value * factor,
    offsetY.value * factor,
    image.width * scale.value * factor,
    image.height * scale.value * factor,
  )

  // Convert to blob
  outputCanvas.toBlob(
    (blob) => {
      if (!blob) return
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' })
      emit('crop', file)
    },
    'image/webp',
    0.9,
  )
}

// Keyboard: Escape to cancel
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

onMounted(() => {
  loadImage()
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.removeEventListener('keydown', handleKeydown)
})

watch(() => props.imageSource, () => {
  imgLoaded.value = false
  loadImage()
})
</script>

<template>
  <!-- Modal Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    @click.self="emit('cancel')"
  >
    <div
      class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in"
      role="dialog"
      aria-label="Bildausschnitt wählen"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 pt-5 pb-3">
        <h3 class="text-sm font-medium text-gray-900">Bildausschnitt wählen</h3>
        <button
          type="button"
          @click="emit('cancel')"
          class="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
          aria-label="Schließen"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Canvas Area -->
      <div class="flex justify-center px-6 pb-4">
        <div
          ref="containerRef"
          class="relative bg-gray-950 rounded-2xl overflow-hidden"
          :style="{ width: CANVAS_SIZE + 'px', height: CANVAS_SIZE + 'px' }"
          :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        >
          <canvas
            ref="canvasRef"
            :width="CANVAS_SIZE"
            :height="CANVAS_SIZE"
            @mousedown="handleMouseDown"
            @wheel="handleWheel"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          />
          <!-- Loading state -->
          <div
            v-if="!imgLoaded"
            class="absolute inset-0 flex items-center justify-center"
          >
            <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>

      <!-- Hint -->
      <div class="flex items-center justify-center gap-1.5 px-6 pb-3">
        <Move :size="12" class="text-gray-300" />
        <p class="text-[11px] text-gray-400">Ziehen zum Verschieben, Scrollen zum Zoomen</p>
      </div>

      <!-- Zoom Controls -->
      <div class="flex items-center justify-center gap-3 px-6 pb-4">
        <button
          type="button"
          @click="zoomOut"
          class="p-2 text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
          aria-label="Verkleinern"
        >
          <ZoomOut :size="16" />
        </button>
        <div class="w-32 h-1.5 bg-gray-100 rounded-full relative">
          <div
            class="absolute inset-y-0 left-0 bg-gray-400 rounded-full transition-all duration-150"
            :style="{ width: ((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100 + '%' }"
          ></div>
        </div>
        <button
          type="button"
          @click="zoomIn"
          class="p-2 text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200"
          aria-label="Vergrößern"
        >
          <ZoomIn :size="16" />
        </button>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 px-6 pb-6">
        <button
          type="button"
          @click="emit('cancel')"
          class="flex-1 py-3 bg-gray-100 text-gray-600 text-sm font-medium rounded-full hover:bg-gray-200 transition-all duration-200"
        >
          Abbrechen
        </button>
        <button
          type="button"
          @click="handleCrop"
          :disabled="!imgLoaded"
          class="flex-1 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Übernehmen
        </button>
      </div>
    </div>
  </div>
</template>
