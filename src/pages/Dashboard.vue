<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useFocusStore } from '@/stores/focus'
import { useProgressStore } from '@/stores/progress'
import { getFromStorage, useLocalStorage } from '@/utils/storage'

const user = ref({
  name: 'Dreamer'
})

const focusStore = useFocusStore()
const progressStore = useProgressStore()
const focusHours = computed(() => focusStore.totalFocusHoursRounded)

const tasksCompleted = computed(() => {
  const tasks = getFromStorage<any[]>('tasks', [])
  return Array.isArray(tasks) ? tasks.filter(t => t && t.completed === true).length : 0
})

const currentStreak = computed(() => {
  // Build map of date -> completed tasks count
  const map = new Map<string, number>()
  for (const item of progressStore.progressItems) {
    if (item.type !== 'task') continue
    const date = item.date
    if (!date) continue
    const val = map.get(date) || 0
    map.set(date, val + (item.status === 'completed' ? 1 : 0))
  }
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const iso = `${y}-${m}-${dd}`
    const count = map.get(iso) || 0
    if (count > 0) streak++
    else break
  }
  return streak
})

const tasks = useLocalStorage<any[]>('tasks', [])
const recentTodoTasks = computed(() => {
  const arr = Array.isArray(tasks.value) ? tasks.value : []
  return arr
    .filter(t => t && t.completed === false)
    .slice()
    .sort((a, b) => {
      const ad = typeof a.dueDate === 'string' ? a.dueDate : ''
      const bd = typeof b.dueDate === 'string' ? b.dueDate : ''
      if (ad === bd) return (b.id || 0) - (a.id || 0)
      return ad > bd ? -1 : 1
    })
})

const quickActions = [
  { label: 'Add Task', icon: 'lucide:check-circle', href: '/tasks' },
  { label: 'Start Focus', icon: 'lucide:timer', href: '/focus' },
  { label: 'View Goals', icon: 'lucide:target', href: '/goals' },
  { label: 'Journal Entry', icon: 'lucide:book', href: '/journal' },
]

// simple placeholder chart heights
const chartHeights = ref([20, 45, 60, 35, 70, 50, 80, 40, 65, 30, 55, 75])

const monthlyCompletions = computed(() => {
  // Last 8 months including current, to match heatmap window
  const result: Array<{ label: string; count: number }> = []
  const now = new Date()
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() // 0-11
    const start = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const endDate = new Date(y, m + 1, 1)
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01`
    const label = d.toLocaleString(undefined, { month: 'short' })
    const tasks = getFromStorage<any[]>('tasks', [])
    const count = Array.isArray(tasks)
      ? tasks.filter(t => {
          if (!t) return false
          if (!t.completed) return false
          const due = t.dueDate
          return typeof due === 'string' && due >= start && due < end
        }).length
      : 0
    result.push({ label, count })
  }
  return result
})

const monthlyMax = computed(() => Math.max(1, ...monthlyCompletions.value.map(m => m.count)))
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div class="relative flex min-h-[12rem] w-full flex-col justify-end overflow-hidden rounded-2xl bg-card">
      <div class="p-6">
        <h1 class="font-headline text-3xl font-bold text-foreground md:text-4xl">Welcome back, {{ user.name }}!</h1>
        <p class="text-muted-foreground">"The secret of getting ahead is getting started." — Mark Twain</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <div class="rounded-2xl bg-card border p-4">
        <div class="flex items-center justify-between pb-2">
          <div class="text-sm font-medium">Total Completions</div>
          <Icon icon="lucide:check-circle-2" class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold">{{ tasksCompleted }}</div>
        <p class="text-xs text-muted-foreground">All-time</p>
      </div>
      <div class="rounded-2xl bg-card border p-4">
        <div class="flex items-center justify-between pb-2">
          <div class="text-sm font-medium">Focus Hours</div>
          <Icon icon="lucide:timer" class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold">{{ focusHours }}h</div>
        <p class="text-xs text-muted-foreground">+20% from yesterday</p>
      </div>
      
      <div class="rounded-2xl bg-card border p-4">
        <div class="flex items-center justify-between pb-2">
          <div class="text-sm font-medium">Current Streak</div>
          <Icon icon="lucide:sparkles" class="h-4 w-4 text-muted-foreground" />
        </div>
        <div class="text-2xl font-bold">{{ currentStreak }} days</div>
        <p class="text-xs text-muted-foreground">Keep it going!</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <a
        v-for="action in quickActions"
        :key="action.label"
        :href="action.href"
        class="w-full h-full rounded-2xl border bg-card p-4 flex flex-col items-center justify-center gap-2 hover:bg-secondary transition-colors"
      >
        <Icon :icon="action.icon" class="w-6 h-6" />
        <span>{{ action.label }}</span>
      </a>
    </div>

    <div class="grid gap-4 md:gap-8 lg:grid-cols-2">
      <div class="rounded-2xl bg-card border">
        <div class="p-4 border-b">
          <div class="text-lg font-semibold">Recent Tasks</div>
          <div class="text-sm text-muted-foreground">Most recent to-dos from your Tasks.</div>
        </div>
        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <div
              v-for="task in recentTodoTasks.slice(0, 5)"
              :key="task.id ?? task.text"
              class="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary"
            >
              <div class="flex items-center gap-2 flex-1 justify-between">
                <div class="flex items-center gap-2 min-w-0">
                  <div
                    class="flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0"
                    :class="task.completed ? 'bg-primary text-primary-foreground' : 'bg-secondary'"
                  >
                    <Icon v-if="task.completed" icon="lucide:check-circle-2" class="h-4 w-4" />
                  </div>
                  <span :class="task.completed ? 'line-through text-muted-foreground' : ''" class="truncate">
                    {{ task.text || task.title }}
                  </span>
                </div>
                <span
                  class="ml-2 text-[11px] px-2 py-0.5 rounded border"
                  :class="task.completed ? 'bg-primary text-primary-foreground border-transparent' : 'bg-card text-muted-foreground border-border'"
                >
                  {{ task.completed ? 'completed' : 'not completed' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl bg-card border">
        <div class="p-4 border-b">
          <div class="text-lg font-semibold">Monthly Task Completions</div>
          <div class="text-sm text-muted-foreground">A look at your productivity over the past few months.</div>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-8 gap-2 h-40 items-end">
            <div
              v-for="(m, idx) in monthlyCompletions"
              :key="idx"
              class="bg-primary rounded relative"
              :title="`${m.label}: ${m.count} completed`"
              :style="{ height: (m.count > 0 ? Math.max(6, Math.round((m.count / monthlyMax) * 100)) : 0) + '%' }"
            >
            </div>
          </div>
          <div class="grid grid-cols-8 gap-2 mt-2 text-[10px] text-muted-foreground">
            <div v-for="(m, idx) in monthlyCompletions" :key="'lbl-' + idx" class="text-center truncate">
              {{ m.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
