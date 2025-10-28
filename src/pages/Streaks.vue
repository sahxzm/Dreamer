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

// Activity tracking for today - computed from real data or local storage
const todayActivity = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  
  if (authStore.isAuthenticated) {
    // Get today's completed items from progress store
    const completedToday = progressStore.completedToday
    
    // Count by type
    const tasks = completedToday.filter(item => item.type === 'task').length
    const goals = completedToday.filter(item => item.type === 'goal').length
    const pomodoros = completedToday.filter(item => item.type === 'focus').length
    const notes = completedToday.filter(item => item.type === 'journal').length
    
    return { tasks, goals, pomodoros, notes }
  } else {
    // Use local tasks data
    const todayTasks = localTasks.value.filter(task => task.dueDate === today)
    const completedTasks = todayTasks.filter(task => task.completed).length
    
    // Generate some demo data for other activities
    const demoGoals = Math.floor(Math.random() * 3)
    const demoPomodoros = Math.floor(Math.random() * 5)
    const demoNotes = Math.floor(Math.random() * 2)
    
    return {
      tasks: completedTasks,
      goals: demoGoals,
      pomodoros: demoPomodoros,
      notes: demoNotes
    }
  }
})

// Activity data for heatmap - computed from real data or local storage
const activityData = computed(() => {
  const data: Array<{date: string, level: number, completions: number, tasks: number, goals: number, pomodoros: number, notes: number}> = []
  const today = new Date()
  
  // Initialize data for the past year
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0] || ''
    
    if (authStore.isAuthenticated) {
      // Get real data for this date from progress store
      const dayItems = progressStore.progressItems.filter(item => item.date === dateStr && item.status === 'completed')
      
      const tasks = dayItems.filter(item => item.type === 'task').length
      const goals = dayItems.filter(item => item.type === 'goal').length
      const pomodoros = dayItems.filter(item => item.type === 'focus').length
      const notes = dayItems.filter(item => item.type === 'journal').length
      
      const completions = tasks + goals + pomodoros + notes
      const level = Math.min(4, Math.floor(completions / 3))
      
      data.push({
        date: dateStr,
        level,
        completions,
        tasks,
        goals,
        pomodoros,
        notes
      })
    } else {
      // Generate demo data for local mode
      const dayTasks = localTasks.value.filter(task => task.dueDate === dateStr && task.completed)
      const tasks = dayTasks.length
      
      // Generate some demo activity for variety
      const randomValue = Math.random()
      let goals = 0, pomodoros = 0, notes = 0
      
      if (randomValue > 0.7) {
        goals = Math.floor(Math.random() * 2)
        pomodoros = Math.floor(Math.random() * 3)
        notes = Math.floor(Math.random() * 1)
      }
      
      const completions = tasks + goals + pomodoros + notes
      const level = Math.min(4, Math.floor(completions / 3))
      
      data.push({
        date: dateStr,
        level,
        completions,
        tasks,
        goals,
        pomodoros,
        notes
      })
    }
  }
  
  return data
})

// Activity options
const activities = [
  { value: 'tasks', label: 'Tasks', icon: 'lucide:clipboard-list', color: '#8b5cf6' },
  { value: 'focus', label: 'Focus', icon: 'lucide:clock', color: '#f59e0b' },
  { value: 'journal', label: 'Journal', icon: 'lucide:book-open', color: '#10b981' },
  { value: 'routines', label: 'Routines', icon: 'lucide:refresh-cw', color: '#ef4444' }
]

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
const toggleTask = (taskId: number) => {
  localTasks.value = localTasks.value.map(task => 
    task.id === taskId 
      ? { ...task, completed: !task.completed }
      : task
  )
}

// Real-time activity tracking functions
const addActivity = async (type: 'tasks' | 'goals' | 'pomodoros' | 'notes') => {
  try {
    // Map to progress item types
    const typeMap = {
      'tasks': 'task' as const,
      'goals': 'goal' as const,
      'pomodoros': 'focus' as const,
      'notes': 'journal' as const
    }
    
    const progressType = typeMap[type]
    const today = new Date().toISOString().split('T')[0]
    
    // Create a new progress item
    await progressStore.createProgressItem({
      type: progressType,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Activity`,
      description: `Manual ${type} activity added`,
      status: 'completed',
      priority: 'medium',
      category: 'general',
      value: 1,
      date: today,
      completed_at: new Date().toISOString()
    })
    
    // Also record in streaks for backward compatibility
    const streakTypeMap = {
      'tasks': 'tasks' as const,
      'goals': 'tasks' as const, // Map goals to tasks for now
      'pomodoros': 'focus' as const,
      'notes': 'journal' as const
    }
    
    const streakType = streakTypeMap[type]
    await streaksStore.recordActivity(streakType, 1)
    
    console.log(`Added ${type} activity`)
  } catch (error) {
    console.error('Error saving activity:', error)
    // Show error to user
    alert(`Failed to save activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const removeActivity = async (type: 'tasks' | 'goals' | 'pomodoros' | 'notes') => {
  const currentValue = todayActivity.value[type]
  if (currentValue > 0) {
    try {
      // Map to streak activity types
      const activityTypeMap = {
        'tasks': 'tasks' as const,
        'goals': 'tasks' as const, // Map goals to tasks for now
        'pomodoros': 'focus' as const,
        'notes': 'journal' as const
      }
      
      const streakType = activityTypeMap[type]
      // For now, we'll just log the removal - in a real app you might want to track negative values
      console.log(`Removed ${type} activity (current: ${currentValue})`)
      // Note: This is a simplified approach. In a real app, you'd want to track individual activity entries
      // and allow removal of specific entries rather than just decrementing
    } catch (error) {
      console.error('Error removing activity:', error)
      alert(`Failed to remove activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// No longer needed since activityData is computed from real data

// LeetCode-style heatmap colors
const getHeatmapColor = (level: number) => {
  switch (level) {
    case 0: return 'heatmap-none'
    case 1: return 'heatmap-low'
    case 2: return 'heatmap-medium'
    case 3: return 'heatmap-high'
    case 4: return 'heatmap-max'
    default: return 'heatmap-none'
  }
}

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  activity: '',
  tasks: 0,
  goals: 0,
  pomodoros: 0,
  notes: 0
})

// Helper functions
const getActiveDays = () => {
  return activityData.value.filter(day => day.level > 0).length
}

const getAveragePerDay = () => {
  const totalCompletions = activityData.value.reduce((sum, day) => sum + day.completions, 0)
  return (totalCompletions / activityData.value.length).toFixed(1)
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
watch(localTasks, () => {
  syncAllData()
}, { deep: true })

// Watch for changes in goals and sync
watch(() => goalsStore.goals, () => {
  syncAllData()
}, { deep: true })

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  const dayName = dayNames[date.getDay()]
  const monthName = monthNames[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  
  return `${dayName}, ${monthName} ${day}, ${year}`
}


// Get current date for display
const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
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
        <div v-if="!authStore.isAuthenticated" class="header-actions">
          <button class="action-btn" @click="$router.push('/auth')">
            <Icon icon="lucide:log-in" class="btn-icon" />
            Sign In
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <Icon icon="lucide:check-circle" class="summary-icon green" />
          <div class="summary-content">
            <span class="summary-number">{{ todayActivity.tasks + todayActivity.goals + todayActivity.pomodoros + todayActivity.notes }}</span>
            <span class="summary-label">TODAY'S COMPLETIONS</span>
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

    <!-- Activity Controls -->
    <div class="activity-controls">
      <h3 class="controls-title">
        <Icon icon="lucide:plus-circle" class="title-icon" />
        Track Today's Activities
      </h3>
      <div class="controls-grid">
        <div class="control-item">
          <Icon icon="lucide:clipboard-list" class="control-icon" />
          <span class="control-label">Tasks</span>
          <div class="control-buttons">
            <button class="control-btn minus" @click="removeActivity('tasks')" :disabled="todayActivity.tasks === 0">-</button>
            <span class="control-count">{{ todayActivity.tasks }}</span>
            <button class="control-btn plus" @click="addActivity('tasks')">+</button>
          </div>
        </div>
        <div class="control-item">
          <Icon icon="lucide:target" class="control-icon" />
          <span class="control-label">Goals</span>
          <div class="control-buttons">
            <button class="control-btn minus" @click="removeActivity('goals')" :disabled="todayActivity.goals === 0">-</button>
            <span class="control-count">{{ todayActivity.goals }}</span>
            <button class="control-btn plus" @click="addActivity('goals')">+</button>
          </div>
        </div>
        <div class="control-item">
          <Icon icon="lucide:clock" class="control-icon" />
          <span class="control-label">Focus Sessions</span>
          <div class="control-buttons">
            <button class="control-btn minus" @click="removeActivity('pomodoros')" :disabled="todayActivity.pomodoros === 0">-</button>
            <span class="control-count">{{ todayActivity.pomodoros }}</span>
            <button class="control-btn plus" @click="addActivity('pomodoros')">+</button>
          </div>
        </div>
        <div class="control-item">
          <Icon icon="lucide:book-open" class="control-icon" />
          <span class="control-label">Journal Entries</span>
          <div class="control-buttons">
            <button class="control-btn minus" @click="removeActivity('notes')" :disabled="todayActivity.notes === 0">-</button>
            <span class="control-count">{{ todayActivity.notes }}</span>
            <button class="control-btn plus" @click="addActivity('notes')">+</button>
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
          <div class="month-labels">
            <div class="month-label">Jan</div>
            <div class="month-label">Feb</div>
            <div class="month-label">Mar</div>
            <div class="month-label">Apr</div>
            <div class="month-label">May</div>
            <div class="month-label">Jun</div>
            <div class="month-label">Jul</div>
            <div class="month-label">Aug</div>
            <div class="month-label">Sep</div>
            <div class="month-label">Oct</div>
            <div class="month-label">Nov</div>
            <div class="month-label">Dec</div>
          </div>
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
            <div class="heatmap-grid">
              <div
                v-for="(day, index) in activityData"
                :key="index"
                class="heatmap-day"
                :class="getHeatmapColor(day.level)"
                :title="`${formatDate(day.date)}: ${day.completions} completions`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- All Activities Overview -->
    <div class="all-activities">
      <div class="section-header">
        <h3 class="section-title">All Activities Overview</h3>
        <p class="section-subtitle">Track your progress across all productivity areas</p>
      </div>
      
      <div class="activities-grid">
        <div
          v-for="activity in activities"
          :key="activity.value"
          class="activity-card"
          :style="{ '--activity-color': activity.color }"
        >
          <div class="activity-header">
            <div class="activity-info">
              <Icon :icon="activity.icon" class="activity-icon" />
              <span class="activity-name">{{ activity.label }}</span>
            </div>
            <div class="activity-streak">
              <span class="streak-number">{{ currentStats.current }}</span>
              <span class="streak-label">day streak</span>
            </div>
          </div>
          
          <div class="activity-stats">
            <div class="stat-item">
              <span class="stat-label">Longest</span>
              <span class="stat-value">{{ currentStats.longest }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total</span>
              <span class="stat-value">{{ currentStats.total }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Last</span>
              <span class="stat-value">
                {{ currentStats.last_activity ? 
                   new Date(currentStats.last_activity).toLocaleDateString() : 
                   'Never' }}
              </span>
            </div>
          </div>
          
          <div class="activity-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                :style="{ 
                  width: `${Math.min((currentStats.current / 30) * 100, 100)}%`,
                  backgroundColor: activity.color
                }"
              ></div>
            </div>
            <span class="progress-text">
              {{ Math.min(currentStats.current, 30) }}/30 days
            </span>
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
}

.month-labels {
  position: relative;
  height: 20px;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 800px;
}

.month-label {
  font-size: 0.8rem;
  color: #fff;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.calendar-grid {
  display: flex;
  gap: 2px;
  min-width: 800px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  grid-template-columns: repeat(53, 1fr);
  gap: 2px;
  flex: 1;
}

.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.heatmap-day:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.4);
  z-index: 10;
  position: relative;
}

/* LeetCode-style heatmap colors */
.heatmap-none {
  background: #161b22;
  border-color: rgba(255, 255, 255, 0.1);
}

.heatmap-low {
  background: #0e4429;
  border-color: rgba(34, 197, 94, 0.3);
}

.heatmap-medium {
  background: #006d32;
  border-color: rgba(34, 197, 94, 0.5);
}

.heatmap-high {
  background: #26a641;
  border-color: rgba(34, 197, 94, 0.7);
}

.heatmap-max {
  background: #39d353;
  border-color: rgba(34, 197, 94, 0.9);
  box-shadow: 0 0 4px rgba(34, 197, 94, 0.3);
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
</style>

