import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@/utils/storage'

export const useFocusStore = defineStore('focus', () => {
  const totalFocusSeconds = useLocalStorage<number>('focus:totalSeconds', 0)
  const todayKey = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `focus:todaySeconds:${y}-${m}-${day}`
  }
  const todayFocusSeconds = useLocalStorage<number>(todayKey(), 0)

  const totalFocusHours = computed(() => totalFocusSeconds.value / 3600)
  const totalFocusHoursRounded = computed(() => Math.round(totalFocusHours.value * 10) / 10)

  function addSeconds(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return
    totalFocusSeconds.value += seconds
    todayFocusSeconds.value += seconds
  }

  function resetToday() {
    todayFocusSeconds.value = 0
  }

  return {
    totalFocusSeconds,
    todayFocusSeconds,
    totalFocusHours,
    totalFocusHoursRounded,
    addSeconds,
    resetToday,
  }
})


