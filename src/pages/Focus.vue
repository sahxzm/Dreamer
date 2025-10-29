<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useFocusStore } from '@/stores/focus'
import { useLocalStorage } from '@/utils/storage'

const focusDurations = [
  { label: 'Pomodoro', minutes: 25 },
  { label: 'Short Break', minutes: 5 },
  { label: 'Long Focus', minutes: 50 },
  { label: 'Long Break', minutes: 15 },
]

const focusStore = useFocusStore()
const duration = useLocalStorage<number>('focus:duration', 25)
const timeLeft = useLocalStorage<number>('focus:timeLeft', duration.value * 60)
const isActive = useLocalStorage<boolean>('focus:isActive', false)
let interval: number | null = null
const currentLabel = useLocalStorage<string>('focus:label', 'Pomodoro')
const lastTickAt = useLocalStorage<number>('focus:lastTickAt', 0)
const isFocusMode = computed(() => currentLabel.value === 'Pomodoro' || currentLabel.value.includes('Focus'))

const progress = computed(() => (timeLeft.value / (duration.value * 60)) * 100)

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const toggleTimer = () => {
  isActive.value = !isActive.value
  if (isActive.value) startInterval()
  else stopInterval()
}

const startInterval = () => {
  stopInterval()
  interval = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value -= 1
      if (isFocusMode.value) {
        focusStore.addSeconds(1)
      }
      lastTickAt.value = Date.now()
    } else {
      isActive.value = false
    }
  }, 1000)
}

const stopInterval = () => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

const resetTimer = () => {
  isActive.value = false
  stopInterval()
  timeLeft.value = duration.value * 60
}

const selectDuration = (minutes: number) => {
  const selected = focusDurations.find(d => d.minutes === minutes)
  currentLabel.value = selected ? selected.label : `${minutes}m`
  duration.value = minutes
  isActive.value = false
  stopInterval()
  timeLeft.value = minutes * 60
}

const reconcileElapsed = () => {
  if (!isActive.value) return
  const now = Date.now()
  const last = lastTickAt.value || now
  const delta = Math.floor((now - last) / 1000)
  if (delta > 0) {
    const decrement = Math.min(delta, timeLeft.value)
    timeLeft.value = Math.max(0, timeLeft.value - decrement)
    if (isFocusMode.value) focusStore.addSeconds(decrement)
    lastTickAt.value = now
    if (timeLeft.value === 0) {
      isActive.value = false
      stopInterval()
    }
  }
}

const handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    reconcileElapsed()
    if (isActive.value && !interval) startInterval()
  } else {
    // going hidden, just mark the last tick time
    lastTickAt.value = Date.now()
    stopInterval()
  }
}

onMounted(() => {
  // If we have a stored last tick, reconcile elapsed time
  reconcileElapsed()
  if (isActive.value) {
    if (!lastTickAt.value) lastTickAt.value = Date.now()
    startInterval()
  }
  window.addEventListener('visibilitychange', handleVisibility)
  window.addEventListener('beforeunload', () => { lastTickAt.value = Date.now() })
  window.addEventListener('pagehide', () => { lastTickAt.value = Date.now() })
})

onUnmounted(() => {
  reconcileElapsed()
  stopInterval()
  window.removeEventListener('visibilitychange', handleVisibility)
  window.removeEventListener('beforeunload', () => { lastTickAt.value = Date.now() })
  window.removeEventListener('pagehide', () => { lastTickAt.value = Date.now() })
})
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] items-center justify-center p-4">
    <div class="rounded-2xl border bg-card w-full max-w-md shadow-xl">
      <div class="text-center p-6 border-b">
        <div class="font-headline text-3xl">Focus Session</div>
        <div class="text-muted-foreground">Minimize distractions. Maximize productivity.</div>
      </div>
      <div class="flex flex-col items-center gap-8 p-6">
        <div class="relative h-64 w-64">
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="font-mono text-6xl font-bold text-foreground">{{ formatTime(timeLeft) }}</span>
          </div>
          <svg class="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle class="text-secondary" stroke="currentColor" stroke-width="8" fill="transparent" r="56" cx="60" cy="60" />
            <circle
              class="text-primary transition-all duration-1000 ease-linear"
              stroke="currentColor"
              stroke-width="8"
              :stroke-dasharray="2 * Math.PI * 56"
              :stroke-dashoffset="2 * Math.PI * 56 * (1 - progress / 100)"
              stroke-linecap="round"
              fill="transparent"
              r="56"
              cx="60"
              cy="60"
            />
          </svg>
        </div>

        <div class="flex w-full justify-center gap-2 flex-wrap">
          <button
            v-for="opt in focusDurations"
            :key="opt.label"
            @click="selectDuration(opt.minutes)"
            :class="['rounded-full px-3 py-1.5 text-sm border', duration === opt.minutes ? 'bg-primary text-primary-foreground border-transparent' : 'hover:bg-secondary']"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="flex items-center gap-4">
          <button class="rounded-full w-32 bg-primary text-primary-foreground px-4 py-2 text-sm" @click="toggleTimer">
            <Icon :icon="isActive ? 'lucide:pause' : 'lucide:play'" class="mr-2 h-5 w-5 inline" />
            {{ isActive ? 'Pause' : 'Start' }}
          </button>
          <button class="rounded-full px-3 py-2 text-sm hover:bg-secondary" @click="resetTimer" aria-label="Reset Timer">
            <Icon icon="lucide:rotate-ccw" class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
