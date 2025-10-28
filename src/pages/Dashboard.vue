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
</script>

<template>
  <div class="dashboard">
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
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Welcome Section */
.welcome-section {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), transparent 90%), color-mix(in oklab, var(--color-secondary), transparent 80%));
  border: 1px solid var(--color-border, rgba(225, 215, 249, 0.2));
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(2px);
  position: relative;
  overflow: hidden;
}

.welcome-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(95, 95, 95, 0.1), transparent);
  border-radius: 50%;
}

.welcome-content {
  position: relative;
  z-index: 1;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  line-height: 1.2;
}

.motivational-quote {
  font-size: 1.1rem;
  color: #cbd5e1;
  font-style: italic;
  margin: 0;
  opacity: 0.9;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  font-size: 24px;
  color: #8b5cf6;
  flex-shrink: 0;
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

/* Quick Actions */
.quick-actions {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-icon {
  font-size: 20px;
  color: #8b5cf6;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.action-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.action-icon {
  font-size: 24px;
  color: #8b5cf6;
}

.action-label {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Today's Tasks */
.today-tasks {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.task-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.progress-text {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  border: 1px solid color-mix(in oklab, var(--color-border), transparent 30%);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.task-item:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: var(--color-border, rgba(139, 92, 246, 0.2));
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-text {
  text-decoration: line-through;
  color: #94a3b8;
}

.task-checkbox {
  flex-shrink: 0;
}

.checkbox-icon {
  font-size: 20px;
  color: #8b5cf6;
  cursor: pointer;
  transition: color 0.2s ease;
}

.checkbox-icon:hover {
  color: #a855f7;
}

.task-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.task-text {
  color: #e2e8f0;
  font-weight: 500;
}

.task-priority {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
}

.priority-high {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.priority-medium {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.priority-low {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.task-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.btn-secondary {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #e2e8f0;
}

.btn-secondary:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    gap: 24px;
  }
  
  .welcome-title {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-actions {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
