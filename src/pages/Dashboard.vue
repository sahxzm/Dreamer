<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// User data - will be populated from auth store
const user = ref({
  name: 'User',
  avatar: null
})

// Stats will be computed from real data
const stats = ref({
  tasksCompleted: 0,
  focusHours: 0,
  weeklyPoints: 0,
  streak: 0
})

// Today's tasks will be loaded from real data
const todayTasks = ref<Array<{id: number, text: string, completed: boolean, priority: string}>>([])

const motivationalQuotes = [
  "Character is the finest beauty. — Swami Sivananda",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. — Winston Churchill",
  "The only way to do great work is to love what you do. — Steve Jobs",
  "Believe you can and you're halfway there. — Theodore Roosevelt"
]

const currentQuote = ref(motivationalQuotes[0])

const completedTasks = computed(() => todayTasks.value.filter(task => task.completed).length)
const totalTasks = computed(() => todayTasks.value.length)
const completionRate = computed(() => 
  totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0
)

const quickActions = [
  { label: 'Add Task', icon: 'lucide:plus', action: 'addTask' },
  { label: 'Start Focus', icon: 'lucide:play', action: 'startFocus' },
  { label: 'View Goals', icon: 'lucide:target', action: 'viewGoals' },
  { label: 'Journal Entry', icon: 'lucide:book-open', action: 'journal' }
]

const handleQuickAction = (action: string) => {
  switch (action) {
    case 'addTask':
      // Navigate to tasks page
      window.location.href = '/tasks'
      break
    case 'startFocus':
      // Navigate to focus page
      window.location.href = '/focus'
      break
    case 'viewGoals':
      // Navigate to goals page
      window.location.href = '/goals'
      break
    case 'journal':
      // Navigate to journal page
      window.location.href = '/journal'
      break
    default:
      console.log(`Quick action: ${action}`)
  }
}
></script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <!-- Welcome Section -->
    <div class="welcome-section">
      <div class="welcome-content">
        <h1 class="welcome-title">
          Welcome {{ user.name }}. Let's Achieve More!
        </h1>
        <p class="motivational-quote">
          {{ currentQuote }}
        </p>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:check-circle" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.tasksCompleted }}</div>
          <div class="stat-label">Tasks Completed</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:clock" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.focusHours }}h</div>
          <div class="stat-label">Focus Hours</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:trending-up" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.weeklyPoints }}</div>
          <div class="stat-label">Weekly Points</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:flame" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.streak }}</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <h2 class="section-title">Quick Actions</h2>
      <div class="actions-grid">
        <button 
          v-for="action in quickActions" 
          :key="action.label"
          @click="handleQuickAction(action.action)"
          class="action-btn"
        >
          <Icon :icon="action.icon" class="action-icon" />
          <span class="action-label">{{ action.label }}</span>
        </button>
      </div>
    </div>

    <!-- Today's Tasks -->
    <div class="today-tasks">
      <div class="section-header">
        <h2 class="section-title">
          <Icon icon="lucide:clipboard-list" class="section-icon" />
          Today's Tasks
        </h2>
        <div class="task-progress">
          <span class="progress-text">{{ completionRate }}% done {{ completedTasks }}/{{ totalTasks }}</span>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${completionRate}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="tasks-list">
        <div 
          v-for="task in todayTasks" 
          :key="task.id"
          :class="['task-item', { completed: task.completed }]"
        >
          <div class="task-checkbox">
            <Icon 
              :icon="task.completed ? 'lucide:check-circle' : 'lucide:circle'" 
              class="checkbox-icon"
            />
          </div>
          <div class="task-content">
            <span class="task-text">{{ task.text }}</span>
            <span :class="['task-priority', `priority-${task.priority}`]">
              {{ task.priority }}
            </span>
          </div>
        </div>
      </div>

      <div class="task-actions">
        <button @click="handleQuickAction('addTask')" class="btn-primary">
          <Icon icon="lucide:plus" class="btn-icon" />
          Add Task
        </button>
        <button class="btn-secondary">
          <Icon icon="lucide:arrow-right" class="btn-icon" />
          Move Tomorrow to Today
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
