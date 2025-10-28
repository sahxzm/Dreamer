<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useStreaksStore } from '@/stores/streaks'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useGoalsStore } from '@/stores/goals'
import { useLocalStorage } from '@/utils/storage'

const streaksStore = useStreaksStore()
const authStore = useAuthStore()
const progressStore = useProgressStore()
const goalsStore = useGoalsStore()

// Local tasks data for real-time sync
const localTasks = useLocalStorage<Array<{
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  category: string
}>>('tasks', [])

// Historical completion data by date
const dailyCompletions = useLocalStorage<Record<string, number>>('daily_completions', {})

// Function to update today's completion count
const updateTodayCompletion = () => {
  const today = new Date().toISOString().split('T')[0]
  if (!today) return
  const todayTasksList = localTasks.value.filter(task => task.dueDate === today)
  const completedTasksCount = todayTasksList.filter(task => task.completed).length
  dailyCompletions.value = { ...dailyCompletions.value, [today]: completedTasksCount }
}

// Activity tracking for today - computed from real data or local storage
const todayActivity = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  
  // Always use local tasks for today's completed tasks count
  const todayTasksList = localTasks.value.filter(task => task.dueDate === today)
  const completedTasks = todayTasksList.filter(task => task.completed).length
  
  // For unauthenticated users, only return tasks
  if (!authStore.isAuthenticated) {
    return {
      tasks: completedTasks,
      goals: 0,
      pomodoros: 0,
      notes: 0
    }
  }
  
  // For authenticated users, combine local tasks with progress store
  const completedToday = progressStore.completedToday
  
  // Count by type (tasks come from localTasks, others from progress store)
  const tasks = completedTasks
  const goals = completedToday.filter(item => item.type === 'goal').length
  const pomodoros = completedToday.filter(item => item.type === 'focus').length
  const notes = completedToday.filter(item => item.type === 'journal').length
  
  return { tasks, goals, pomodoros, notes }
})

// Activity data for heatmap - computed from real data or local storage
const activityData = computed(() => {
  const data: Array<{date: string, level: number, completions: number, tasks: number, goals: number, pomodoros: number, notes: number}> = []
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day
  
  // Calculate dates for the last year
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] || ''
    
    // Initialize with default values
    let tasks = 0
    let goals = 0
    let pomodoros = 0
    let notes = 0
    
    // Get local task completions for this date
    const dayTasks = localTasks.value.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === date.getTime() && task.completed
    })
    
    tasks = dayTasks.length
    
    if (authStore.isAuthenticated) {
      // Get completed items from progress store
      const dayItems = progressStore.progressItems.filter(item => {
        if (!item.date) return false
        const itemDate = new Date(item.date)
        itemDate.setHours(0, 0, 0, 0)
        return itemDate.getTime() === date.getTime() && item.status === 'completed'
      })
      
      // Count different types of activities
      goals = dayItems.filter(item => item.type === 'goal').length
      pomodoros = dayItems.filter(item => item.type === 'focus').length
      notes = dayItems.filter(item => item.type === 'journal').length
      
      // Get task completions from streaks store
      const streakData = streaksStore.streaks.filter(streak => {
        if (!streak.date) return false
        const streakDate = new Date(streak.date)
        streakDate.setHours(0, 0, 0, 0)
        return streakDate.getTime() === date.getTime() && streak.activity_type === 'tasks'
      })
      
      // Sum up streak values
      const streakCompletions = streakData.reduce((sum, streak) => sum + (streak.value || 0), 0)
      
      // Use the maximum value between local tasks and streak data
      tasks = Math.max(tasks, streakCompletions)
    }
    
    // For today, update the completion count in storage
    if (dateStr === today.toISOString().split('T')[0]) {
      dailyCompletions.value = {
        ...dailyCompletions.value,
        [dateStr]: tasks
      }
    } else {
      // For past days, use saved completion count if available
      tasks = dailyCompletions.value[dateStr] !== undefined ? dailyCompletions.value[dateStr] : tasks
    }
    
    // Calculate level based on task completions (0-4 scale)
    let level = 0
    if (tasks > 0) {
      level = Math.min(4, Math.max(1, Math.ceil(tasks / 2)))
    }
    
    // Add to data array in chronological order
    data.unshift({
      date: dateStr,
      level,
      completions: tasks,
      tasks,
      goals,
      pomodoros,
      notes
    })
  }
  
  return data
})

// Build last 8 months heatmap weeks aligned to Sundays and exclude future dates
const heatmapWeeks = computed(() => {
  const today = new Date()
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  // Start from the first day of the month 7 months ago (inclusive makes 8 months including current)
  const startMonth = new Date(endDate)
  startMonth.setMonth(startMonth.getMonth() - 7)
  startMonth.setDate(1)
  // Align start to previous Sunday
  const startDate = new Date(startMonth)
  const dayOfWeek = startDate.getDay() // 0 = Sun
  startDate.setDate(startDate.getDate() - dayOfWeek)

  // Collect completions per date in visible range first
  const completionMap = new Map<string, number>()
  const addCompletions = (d: Date) => {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const dd = d.getDate()
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
    const comp = activityData.value.find(x => x.date === iso)?.completions ?? 0
    completionMap.set(iso, comp)
  }

  const weeks: Array<Array<string | null>> = []
  let cursor = new Date(startDate)
  while (cursor <= endDate || cursor.getDay() !== 0) {
    const week: Array<string | null> = []
    for (let i = 0; i < 7; i++) {
      const isFuture = cursor > endDate
      if (!isFuture) addCompletions(cursor)
      const y = cursor.getFullYear()
      const m = cursor.getMonth() + 1
      const dd = cursor.getDate()
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
      week.push(isFuture ? null : iso)
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    if (cursor > endDate && cursor.getDay() === 0) break
    if (weeks.length > 60) break
  }

  // Build quantile thresholds from completions distribution
  const values = Array.from(completionMap.values()).sort((a, b) => a - b)
  const quantile = (p: number): number => {
    if (values.length === 0) return 0
    const idx = Math.floor((values.length - 1) * p)
    const v = values[idx]
    return typeof v === 'number' && isFinite(v) ? v : 0
  }
  const q1: number = quantile(0.25)
  const q2: number = quantile(0.5)
  const q3: number = quantile(0.75)
  const max: number = values.length ? Number(values[values.length - 1]) : 0

  const levelMap = new Map<string, number>()
  completionMap.forEach((comp, iso) => {
    const c = typeof comp === 'number' ? comp : 0
    let level = 0
    if (c <= 0) level = 0
    else if (c <= q1) level = 1
    else if (c <= q2) level = 2
    else if (c <= q3) level = 3
    else level = 4
    // If all values are the same non-zero, put them at mid-level for visibility
    if (max > 0 && q1 === q2 && q2 === q3) level = 3
    levelMap.set(iso, level)
  })

  return { weeks, levelMap, startDate, endDate }
})

const levelToClass = ['heatmap-none', 'heatmap-low', 'heatmap-medium', 'heatmap-high', 'heatmap-max']

// defineExpose moved to the end of the script setup

const formatDateOrEmpty = (iso?: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

const getLevelOrZero = (iso?: string | null): number => {
  if (!iso) return 0
  return heatmapWeeks.value.levelMap.get(iso) || 0
}

// Group weeks by month into contiguous buckets for boxed layout
const monthGroups = computed(() => {
  const groups: Array<{ label: string; weeks: Array<Array<string | null>> }> = []
  const allWeeks = heatmapWeeks.value.weeks
  let currentLabel = ''
  let currentWeeks: Array<Array<string | null>> = []

  const getWeekMonthLabel = (week: Array<string | null>): string => {
    const isoMaybe = week.find(d => d != null) as string | undefined
    if (!isoMaybe) return ''
    const iso = String(isoMaybe)
    const [ys, ms] = iso.split('-')
    const yy = parseInt(ys || '1970')
    const mm = (parseInt(ms || '1') - 1)
    return new Date(yy, mm, 1).toLocaleString(undefined, { month: 'short' })
  }

  for (const week of allWeeks) {
    const label = getWeekMonthLabel(week)
    if (currentLabel === '') {
      currentLabel = label
      currentWeeks = [week]
    } else if (label === currentLabel || label === '') {
      currentWeeks.push(week)
    } else {
      groups.push({ label: currentLabel, weeks: currentWeeks })
      currentLabel = label
      currentWeeks = [week]
    }
  }
  if (currentWeeks.length) groups.push({ label: currentLabel, weeks: currentWeeks })
  return groups
})

// Selected activity used for stats display
const selectedActivity = ref<'tasks' | 'focus' | 'journal' | 'routines'>('tasks')

// Activity stats computed from real data
const currentStats = computed(() => {
  const defaultStats = {
    current: 0,
    longest: 0,
    total: 0,
    last_activity: null
  }
  
  try {
    // Get the latest streak data from the store
    const stats = streaksStore.getStreakStats[selectedActivity.value] || defaultStats
    return stats
  } catch (error) {
    console.error('Error calculating stats:', error)
    return defaultStats
  }
})

// Local data computed properties
const todayTasks = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return localTasks.value.filter(task => task.dueDate === today)
})

// Loading state
const loading = computed(() => 
  authStore.isAuthenticated ? (
    streaksStore.loading || 
    progressStore.loading || 
    goalsStore.loading ||
    authStore.loading
  ) : false
)

// Task management functions
const toggleTask = async (taskId: number) => {
  localTasks.value = localTasks.value.map(task => 
    task.id === taskId 
      ? { ...task, completed: !task.completed }
      : task
  )
  // Update today's completion count
  updateTodayCompletion()
  // Immediately sync with progress store
  if (authStore.isAuthenticated) {
    await progressStore.syncWithTasks(localTasks.value)
  }
}

// Removed manual add/remove controls

// No longer needed since activityData is computed from real data

// LeetCode-style heatmap colors

// Tooltip state

// Helper functions
const getActiveDays = () => {
  return activityData.value.filter(day => day.level > 0).length
}

// Load real data from all stores
const loadRealData = async () => {
  try {
    // Load progress data first
    await progressStore.fetchProgress()
    
    // Load goals data
    await goalsStore.fetchGoals()
    await goalsStore.fetchGoalProgress()
    
    // Load streak data
    await streaksStore.fetchStreaks()
    
    // Sync data between stores
    syncAllData()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

// Sync data between different stores
const syncAllData = () => {
  // Sync tasks with progress store
  progressStore.syncWithTasks(localTasks.value)
  
  // Sync goals with progress store
  progressStore.syncWithGoals(goalsStore.goals)
}

// Real-time sync interval
let syncInterval: NodeJS.Timeout | null = null

// Initialize data on mount
onMounted(async () => {
  // Initialize auth first
  await authStore.initializeAuth()
  
  // Initialize today's completion
  updateTodayCompletion()
  
  // Load data based on authentication status
  if (authStore.isAuthenticated) {
    await loadRealData()
    
    // Start real-time sync for authenticated users
    syncInterval = setInterval(async () => {
      await loadRealData()
    }, 30000) // Sync every 30 seconds
  } else {
    // For non-authenticated users, just sync local data
    syncAllData()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  if (syncInterval) {
    clearInterval(syncInterval)
  }
})

// Watch for auth changes and load data accordingly
watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
  if (isAuthenticated) {
    await loadRealData()
  }
})

// Watch for changes in local tasks and sync
watch(localTasks, async () => {
  // Update today's completion count when tasks change
  updateTodayCompletion()
  
  if (authStore.isAuthenticated) {
    await progressStore.syncWithTasks(localTasks.value)
  }
}, { deep: true })

// Watch for changes in goals and sync
watch(() => goalsStore.goals, async () => {
  if (authStore.isAuthenticated) {
    await progressStore.syncWithGoals(goalsStore.goals)
  }
}, { deep: true })

// Removed journal sync - handled separately in Journal page

// Namespace object for template access
</script>

<template>
  <div class="streaks-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <Icon icon="lucide:loader-2" class="spinner-icon" />
        <p>Loading your streak data...</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <Icon icon="lucide:flame" class="title-icon" />
            Streaks & Progress
          </h1>
          <p class="page-subtitle">
            Track your consistency and build lasting habits
            <span v-if="!authStore.isAuthenticated" class="demo-badge">
              <Icon icon="lucide:monitor" />
              Demo Mode
            </span>
          </p>
        </div>
        <div class="header-actions">
          <button v-if="!authStore.isAuthenticated" class="action-btn" @click="$router.push('/auth')">
            <Icon icon="lucide:log-in" class="btn-icon" />
            Sign In
          </button>
          <button v-else class="action-btn danger" @click="authStore.signOut()">
            <Icon icon="lucide:log-out" class="btn-icon" />
            Sign Out
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <Icon icon="lucide:check-circle" class="summary-icon green" />
          <div class="summary-content">
            <span class="summary-number">{{ todayActivity.tasks }}</span>
            <span class="summary-label">TODAY'S COMPLETED TASKS</span>
          </div>
        </div>
        
        <div class="summary-card">
          <Icon icon="lucide:bar-chart" class="summary-icon blue" />
          <div class="summary-content">
            <span class="summary-number">{{ getActiveDays() }}</span>
            <span class="summary-label">ACTIVE DAYS</span>
          </div>
        </div>
        
        <div class="summary-card">
          <Icon icon="lucide:flame" class="summary-icon orange" />
          <div class="summary-content">
            <span class="summary-number">{{ currentStats.current }}</span>
            <span class="summary-label">CURRENT STREAK</span>
          </div>
        </div>
        
        <div class="summary-card">
          <Icon icon="lucide:target" class="summary-icon purple" />
          <div class="summary-content">
            <span class="summary-number">{{ localTasks.length }}</span>
            <span class="summary-label">TOTAL TASKS</span>
          </div>
        </div>
      </div>

    <!-- Real-time Progress Section -->
    <div class="realtime-progress">
      <div class="section-header">
        <h3 class="section-title">
          <Icon icon="lucide:activity" class="title-icon" />
          Real-time Progress
        </h3>
        <p class="section-subtitle">Current tasks and activities in progress</p>
      </div>
      
      <div class="progress-grid">
        <!-- Today's Tasks -->
        <div class="progress-card">
          <div class="progress-header">
            <Icon icon="lucide:clipboard-list" class="progress-icon" />
            <h4>Today's Tasks</h4>
            <span class="progress-count">{{ todayTasks.filter(task => !task.completed).length }}</span>
          </div>
          <div class="progress-list">
            <div 
              v-for="task in todayTasks.filter(task => !task.completed).slice(0, 3)"
              :key="task.id"
              class="progress-item"
            >
              <div class="item-info">
                <span class="item-title">{{ task.text }}</span>
                <span class="item-priority" :class="`priority-${task.priority}`">{{ task.priority }}</span>
              </div>
              <button 
                class="complete-btn"
                @click="toggleTask(task.id)"
                title="Mark as complete"
              >
                <Icon icon="lucide:check" />
              </button>
            </div>
            <div v-if="todayTasks.filter(task => !task.completed).length === 0" class="empty-state">
              <Icon icon="lucide:check-circle" />
              <span>All tasks completed!</span>
            </div>
          </div>
        </div>

        <!-- Completed Tasks -->
        <div class="progress-card">
          <div class="progress-header">
            <Icon icon="lucide:check-circle" class="progress-icon" />
            <h4>Completed Today</h4>
            <span class="progress-count">{{ todayTasks.filter(task => task.completed).length }}</span>
          </div>
          <div class="progress-list">
            <div 
              v-for="task in todayTasks.filter(task => task.completed).slice(0, 3)"
              :key="task.id"
              class="progress-item completed"
            >
              <div class="item-info">
                <span class="item-title">{{ task.text }}</span>
                <span class="item-priority" :class="`priority-${task.priority}`">{{ task.priority }}</span>
              </div>
              <Icon icon="lucide:check-circle" class="completed-icon" />
            </div>
            <div v-if="todayTasks.filter(task => task.completed).length === 0" class="empty-state">
              <Icon icon="lucide:clock" />
              <span>No completions yet today</span>
            </div>
          </div>
        </div>

        <!-- Activity Summary -->
        <div class="progress-card">
          <div class="progress-header">
            <Icon icon="lucide:bar-chart" class="progress-icon" />
            <h4>Activity Summary</h4>
            <span class="progress-count">{{ getActiveDays() }}</span>
          </div>
          <div class="progress-list">
            <div class="progress-item">
              <div class="item-info">
                <span class="item-title">Tasks Completed</span>
                <span class="progress-text">{{ todayActivity.tasks }} today</span>
              </div>
            </div>
            <div class="progress-item">
              <div class="item-info">
                <span class="item-title">Focus Sessions</span>
                <span class="progress-text">{{ todayActivity.pomodoros }} today</span>
              </div>
            </div>
            <div class="progress-item">
              <div class="item-info">
                <span class="item-title">Journal Entries</span>
                <span class="progress-text">{{ todayActivity.notes }} today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    

    <!-- Heatmap Section -->
    <div class="heatmap-section">
      <div class="heatmap-header">
        <h2 class="section-title">
          <Icon icon="lucide:calendar" class="title-icon" />
          Activity Heatmap
        </h2>
      </div>
      
      <!-- Heatmap will be rendered here -->
      <div class="heatmap-container">
        <div class="calendar-heatmap">
          <div class="calendar-grid">
            <div class="day-labels">
              <div class="day-label">S</div>
              <div class="day-label">M</div>
              <div class="day-label">T</div>
              <div class="day-label">W</div>
              <div class="day-label">T</div>
              <div class="day-label">F</div>
              <div class="day-label">S</div>
            </div>
            <div class="months-wrap">
              <div
                v-for="(group, gIdx) in monthGroups"
                :key="String(`g-${gIdx}`)"
                class="month-group"
              >
                <div class="month-grid">
                  <div 
                    v-for="(week, wIdx) in group.weeks" 
                    :key="String(`gw-${gIdx}-${wIdx}`)" 
                    class="heatmap-week"
                  >
                    <div
                      v-for="(iso, dIdx) in week"
                      :key="String(`gd-${gIdx}-${wIdx}-${dIdx}`)"
                      class="heatmap-day"
                      :class="[levelToClass[getLevelOrZero(iso)], { 'is-future': iso === null }]"
                      :title="iso ? `${formatDateOrEmpty(iso)}: ${getLevelOrZero(iso)} completions` : ''"
                    ></div>
                  </div>
                </div>
                <div class="month-title">{{ group.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    
    </div> <!-- End main content -->
  </div>
</template>

<style scoped>
.streaks-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), transparent 90%), color-mix(in oklab, var(--color-secondary), transparent 90%));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 2rem;
  color: #8b5cf6;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #cbd5e1;
  margin: 0;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 12px;
}

.demo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 6px;
  font-size: 0.8rem;
  color: #f59e0b;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
}

.action-btn.danger:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
}

.btn-icon {
  font-size: 16px;
}

/* Activity Selector */
.activity-selector {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.selector-header {
  margin-bottom: 20px;
}

.selector-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.activity-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.activity-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, var(--activity-color, #8b5cf6), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.activity-btn:hover::before {
  opacity: 0.1;
}

.activity-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: var(--activity-color, #8b5cf6);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.activity-btn.active::before {
  opacity: 0.2;
}

.activity-icon {
  font-size: 24px;
  color: var(--activity-color, #8b5cf6);
  z-index: 1;
}

.activity-label {
  font-size: 1rem;
  font-weight: 600;
  z-index: 1;
}

.activity-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-text {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Time Range Selector */
.time-range-selector {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.time-range-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.time-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.time-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
}

.time-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.5);
  color: #fff;
}

.time-icon {
  font-size: 16px;
}

/* Stats Overview */
.stats-overview {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  background: rgba(15, 15, 25, 0.9);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-radius: 12px;
  color: #8b5cf6;
}

.icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Heatmap Section */
.heatmap-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
}

.title-icon {
  font-size: 1.25rem;
  color: #8b5cf6;
}

.activity-level-legend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-level-legend .legend-label {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

.legend-colors {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-text {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.legend-squares {
  display: flex;
  gap: 2px;
}

.legend-square {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.heatmap-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.heatmap-stats .stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 16px 20px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  min-width: 80px;
  text-align: center;
}

.heatmap-stats .stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 2px;
}

.heatmap-stats .stat-label {
  font-size: 0.7rem;
  color: #fff;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.calendar-heatmap {
  position: relative;
  overflow-x: auto;
  padding: 0;
  /* Shared sizing variables for alignment */
  --hm-cell: 12px;
  --hm-gap: 2px;
}

.month-labels {
  position: relative;
  height: 20px;
  margin-bottom: 8px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--hm-cell);
  column-gap: var(--hm-gap);
}

.month-label {
  font-size: 0.8rem;
  color: #fff;
  font-weight: 500;
  text-align: left;
}

.calendar-grid {
  display: flex;
  gap: var(--hm-gap);
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: var(--hm-gap);
  margin-right: 8px;
  padding-top: 0;
  width: 16px;
}

.day-label {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #fff;
  font-weight: 500;
}

.heatmap-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--hm-cell);
  gap: var(--hm-gap);
}

.heatmap-week {
  display: grid;
  grid-template-rows: repeat(7, var(--hm-cell));
  gap: var(--hm-gap);
}

.heatmap-day {
  width: var(--hm-cell);
  height: var(--hm-cell);
  border-radius: 2px;
  transition: transform 0.1s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.heatmap-day.is-future {
  visibility: hidden; /* don't render future cells */
  pointer-events: none;
}

.heatmap-day:hover {
  transform: scale(1.15);
}

/* LeetCode-style heatmap colors */
.heatmap-none {
  background: #161b22;
  border-color: rgba(255, 255, 255, 0.06);
}

.heatmap-low {
  background: #0e4429;
  border-color: rgba(34, 197, 94, 0.25);
}

.heatmap-medium {
  background: #006d32;
  border-color: rgba(34, 197, 94, 0.45);
}

.heatmap-high {
  background: #26a641;
  border-color: rgba(34, 197, 94, 0.65);
}

.heatmap-max {
  background: #39d353;
  border-color: rgba(34, 197, 94, 0.85);
  box-shadow: 0 0 2px rgba(34, 197, 94, 0.3);
}

.heatmap-tooltip {
  position: fixed;
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 12px 16px;
  backdrop-filter: blur(2px);
  z-index: 1000;
  pointer-events: none;
  transform: translateX(-50%);
  min-width: 200px;
}

.tooltip-date {
  font-size: 0.9rem;
  color: #8b5cf6;
  font-weight: 600;
  margin-bottom: 4px;
}

.tooltip-activity {
  font-size: 0.8rem;
  color: #fff;
  margin-bottom: 8px;
}

.tooltip-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-item {
  font-size: 0.8rem;
  color: #cbd5e1;
}

/* Summary Cards */
.summary-cards {
  display: flex;
  gap: 16px;
  margin-top: 24px;
  flex-wrap: wrap;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  backdrop-filter: blur(2px);
  flex: 1;
  min-width: 200px;
  transition: all 0.3s ease;
}

.summary-card:hover {
  background: rgba(15, 15, 25, 0.8);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.summary-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.summary-icon.purple {
  color: #8b5cf6;
}

.summary-icon.green {
  color: #10b981;
}

.summary-icon.blue {
  color: #3b82f6;
}

.summary-icon.orange {
  color: #f59e0b;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.summary-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Activity Controls */
.activity-controls {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
  margin-bottom: 24px;
}

.controls-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls-title::before {
  content: "⚡";
  font-size: 1.5rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.control-item:hover {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.control-icon {
  font-size: 20px;
  color: #8b5cf6;
  flex-shrink: 0;
}

.control-label {
  font-size: 0.9rem;
  color: #fff;
  font-weight: 500;
  flex: 1;
}

.control-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.control-btn.plus {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.control-btn.plus:hover {
  background: rgba(34, 197, 94, 0.3);
  transform: scale(1.05);
}

.control-btn.minus {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.control-btn.minus:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  transform: scale(1.05);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.control-count {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  min-width: 24px;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .heatmap-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .heatmap-stats {
    width: 100%;
    justify-content: space-between;
  }
  
  .heatmap-stats .stat-item {
    flex: 1;
    min-width: 60px;
  }
  
  .calendar-heatmap {
    overflow-x: scroll;
  }
  
  .calendar-grid {
    min-width: 600px;
  }
  
  .summary-cards {
    flex-direction: column;
  }
  
  .summary-card {
    min-width: auto;
  }
}

/* Real-time Progress */
.realtime-progress {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.progress-card {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.progress-card:hover {
  background: rgba(15, 15, 25, 0.9);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.progress-icon {
  font-size: 20px;
  color: #8b5cf6;
}

.progress-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  flex: 1;
}

.progress-count {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.progress-item:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.2);
}

.progress-item.completed {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.item-title {
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 500;
}

.item-priority {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.priority-medium {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.priority-low {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.item-type {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-bar-mini {
  width: 100%;
  height: 4px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin: 4px 0;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.7rem;
  color: #94a3b8;
}

.complete-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: rgba(34, 197, 94, 0.3);
  transform: scale(1.05);
}

.completed-icon {
  font-size: 16px;
  color: #22c55e;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.empty-state .icon {
  font-size: 20px;
}

/* All Activities */
.all-activities {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 1rem;
  color: #94a3b8;
  margin: 0;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.activity-card {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.activity-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--activity-color, #8b5cf6);
}

.activity-card:hover {
  background: rgba(15, 15, 25, 0.9);
  border-color: var(--activity-color, #8b5cf6);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.activity-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.activity-icon {
  font-size: 20px;
  color: var(--activity-color, #8b5cf6);
}

.activity-name {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.activity-streak {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.streak-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.streak-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.activity-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 0.9rem;
  color: #e2e8f0;
  font-weight: 600;
}

.activity-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
}

/* Empty state styles */
.empty-heatmap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: rgba(15, 15, 25, 0.5);
  border-radius: 16px;
  border: 1px solid rgba(139, 92, 246, 0.1);
  margin-top: 20px;
}

.empty-icon {
  font-size: 48px;
  color: var(--color-primary, #8b5cf6);
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #e2e8f0);
  margin: 0 0 8px 0;
}

.empty-message {
  font-size: 1rem;
  color: var(--color-text-secondary, #94a3b8);
  margin: 0 0 24px 0;
  max-width: 400px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.empty-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 10px;
  color: var(--color-text, #e2e8f0);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 16px;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #94a3b8;
}

.spinner-icon {
  font-size: 2rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Not Authenticated State */
.not-authenticated {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.auth-prompt {
  text-align: center;
  max-width: 400px;
  padding: 40px;
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(2px);
}

.auth-icon {
  font-size: 3rem;
  color: #8b5cf6;
  margin-bottom: 20px;
}

.auth-prompt h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 12px 0;
}

.auth-prompt p {
  color: #94a3b8;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.auth-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.auth-btn.primary {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
}

.auth-btn.primary:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.auth-btn.secondary {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #e2e8f0;
}

.auth-btn.secondary:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .streaks-page {
    gap: 24px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .activity-grid {
    grid-template-columns: 1fr;
  }
  
  .time-range-buttons {
    flex-direction: column;
  }
  
  .time-btn {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .activities-grid {
    grid-template-columns: 1fr;
  }

  .auth-actions {
    flex-direction: column;
  }

  .auth-btn {
    justify-content: center;
  }
}

.months-wrap {
  display: flex;
  gap: 12px;
}

.month-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.month-grid {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: var(--hm-cell);
  gap: var(--hm-gap);
  padding: 6px;
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 8px;
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  backdrop-filter: blur(2px);
}

.month-title {
  font-size: 0.9rem;
  color: var(--color-text, #e2e8f0);
  font-weight: 600;
}

/* Green palette like GitHub/LeetCode */
.heatmap-none { background: #161b22; border-color: rgba(255, 255, 255, 0.06); }
.heatmap-low { background: #0e4429; border-color: rgba(34, 197, 94, 0.25); }
.heatmap-medium { background: #006d32; border-color: rgba(34, 197, 94, 0.45); }
.heatmap-high { background: #26a641; border-color: rgba(34, 197, 94, 0.65); }
.heatmap-max { background: #39d353; border-color: rgba(34, 197, 94, 0.85); box-shadow: 0 0 2px rgba(34, 197, 94, 0.3); }
</style>

