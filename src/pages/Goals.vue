<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@/utils/storage'
import { Icon } from '@iconify/vue'

// Goal state
const currentView = ref<'mini' | 'longterm'>('mini')
const newGoalText = ref('')
const newGoalCategory = ref('personal')
const newGoalDeadline = ref('')
const newGoalPriority = ref('medium')

// Goals data persisted locally
const goals = useLocalStorage<Array<{
  id: number
  text: string
  category: string
  priority: string
  deadline: string
  progress: number
  status: string
  type: string
  createdAt: string
  completedAt: string | null
}>>('goals:local', [])

// Computed properties
const miniGoals = computed(() => goals.value.filter(g => g.type === 'mini'))
const longtermGoals = computed(() => goals.value.filter(g => g.type === 'longterm'))
const activeGoals = computed(() => goals.value.filter(g => g.status === 'active'))
const completedGoals = computed(() => goals.value.filter(g => g.status === 'completed'))

const currentGoals = computed(() => {
  return currentView.value === 'mini' ? miniGoals.value : longtermGoals.value
})

const totalGoals = computed(() => goals.value.length)
const completedCount = computed(() => completedGoals.value.length)
const pendingCount = computed(() => activeGoals.value.length)
const completionRate = computed(() => {
  return totalGoals.value > 0 ? Math.round((completedCount.value / totalGoals.value) * 100) : 0
})

// Goal actions
const addGoal = () => {
  if (!newGoalText.value.trim()) return
  
  const newGoal = {
    id: Date.now(),
    text: newGoalText.value.trim(),
    category: newGoalCategory.value,
    priority: newGoalPriority.value,
    deadline: newGoalDeadline.value,
    progress: 0,
    status: 'active',
    type: currentView.value,
    createdAt: new Date().toISOString().split('T')[0] || '',
    completedAt: null
  }
  
  goals.value.push(newGoal)
  newGoalText.value = ''
  newGoalDeadline.value = ''
}

const updateProgress = (goalId: number, progress: number) => {
  const goal = goals.value.find(g => g.id === goalId)
  if (goal) {
    goal.progress = Math.max(0, Math.min(100, progress))
    if (goal.progress === 100 && goal.status === 'active') {
      goal.status = 'completed'
      goal.completedAt = new Date().toISOString().split('T')[0] || null
    }
  }
}

const deleteGoal = (goalId: number) => {
  const index = goals.value.findIndex(g => g.id === goalId)
  if (index > -1) {
    goals.value.splice(index, 1)
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'learning': return 'lucide:book-open'
    case 'health': return 'lucide:heart'
    case 'financial': return 'lucide:dollar-sign'
    case 'career': return 'lucide:briefcase'
    case 'personal': return 'lucide:user'
    case 'fitness': return 'lucide:dumbbell'
    default: return 'lucide:target'
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'learning': return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
    case 'health': return 'text-green-400 bg-green-400/20 border-green-400/30'
    case 'financial': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
    case 'career': return 'text-purple-400 bg-purple-400/20 border-purple-400/30'
    case 'personal': return 'text-pink-400 bg-pink-400/20 border-pink-400/30'
    case 'fitness': return 'text-orange-400 bg-orange-400/20 border-orange-400/30'
    default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-400/20 border-red-400/30'
    case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
    case 'low': return 'text-green-400 bg-green-400/20 border-green-400/30'
    default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
  }
}

const getDaysUntilDeadline = (deadline: string) => {
  if (!deadline) return null
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const isOverdue = (deadline: string) => {
  const days = getDaysUntilDeadline(deadline)
  return days !== null && days < 0
}
</script>

<template>
  <div class="goals-page">
    <!-- Header -->
    <div class="goals-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon icon="lucide:target" class="title-icon" />
          Goals & Milestones
        </h1>
        <div class="header-actions">
          <button @click="addGoal" class="action-btn primary">
            <Icon icon="lucide:plus" class="btn-icon" />
            Add Goal
          </button>
        </div>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <button 
        @click="currentView = 'mini'"
        :class="['toggle-btn', { active: currentView === 'mini' }]"
      >
        <Icon icon="lucide:zap" class="toggle-icon" />
        Mini Goals
      </button>
      <button 
        @click="currentView = 'longterm'"
        :class="['toggle-btn', { active: currentView === 'longterm' }]"
      >
        <Icon icon="lucide:flag" class="toggle-icon" />
        Long-term Goals
      </button>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:target" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalGoals }}</div>
          <div class="stat-label">Total Goals</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:check-circle" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ completedCount }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:clock" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ pendingCount }}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:trending-up" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ completionRate }}%</div>
          <div class="stat-label">Complete</div>
        </div>
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="progress-overview">
      <h2 class="section-title">Progress Overview</h2>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${completionRate}%` }"
        ></div>
      </div>
      <div class="progress-text">{{ completionRate }}% Complete</div>
    </div>

    <!-- Add Goal Form -->
    <div class="add-goal">
      <h2 class="section-title">Add New Goal</h2>
      <div class="add-form">
        <input 
          v-model="newGoalText"
          placeholder="What's your goal? e.g., Learn a new language"
          class="goal-input"
        />
        <select v-model="newGoalCategory" class="category-select">
          <option value="learning">Learning</option>
          <option value="health">Health</option>
          <option value="financial">Financial</option>
          <option value="career">Career</option>
          <option value="personal">Personal</option>
          <option value="fitness">Fitness</option>
        </select>
        <select v-model="newGoalPriority" class="priority-select">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input 
          v-model="newGoalDeadline"
          type="date"
          class="deadline-input"
        />
        <button @click="addGoal" class="add-btn">
          <Icon icon="lucide:plus" class="add-icon" />
          Add Goal
        </button>
      </div>
    </div>

    <!-- Goals List -->
    <div class="goals-list">
      <h2 class="section-title">
        {{ currentView === 'mini' ? 'Mini Goals' : 'Long-term Goals' }}
      </h2>
      
      <div class="goals-grid">
        <div 
          v-for="goal in currentGoals" 
          :key="goal.id"
          :class="['goal-item', { completed: goal.status === 'completed' }]"
        >
          <div class="goal-header">
            <div class="goal-info">
              <Icon :icon="getCategoryIcon(goal.category)" class="goal-icon" />
              <div class="goal-details">
                <h3 class="goal-title">{{ goal.text }}</h3>
                <div class="goal-meta">
                  <span :class="['goal-category', getCategoryColor(goal.category)]">
                    {{ goal.category }}
                  </span>
                  <span :class="['goal-priority', getPriorityColor(goal.priority)]">
                    {{ goal.priority }}
                  </span>
                  <span v-if="goal.deadline" class="goal-deadline">
                    <Icon icon="lucide:calendar" class="deadline-icon" />
                    {{ goal.deadline }}
                    <span v-if="isOverdue(goal.deadline)" class="overdue">Overdue</span>
                  </span>
                </div>
              </div>
            </div>
            
            <div class="goal-actions">
              <button @click="deleteGoal(goal.id)" class="delete-btn">
                <Icon icon="lucide:trash-2" class="action-icon" />
              </button>
            </div>
          </div>
          
          <div class="goal-progress">
            <div class="progress-header">
              <span class="progress-label">Progress</span>
              <span class="progress-percentage">{{ goal.progress }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${goal.progress}%` }"
              ></div>
            </div>
            <div class="progress-controls">
              <button 
                @click="updateProgress(goal.id, goal.progress - 10)"
                :disabled="goal.progress <= 0"
                class="progress-btn"
              >
                <Icon icon="lucide:minus" class="btn-icon" />
              </button>
              <input 
                type="range"
                :value="goal.progress"
                @input="updateProgress(goal.id, parseInt(($event.target as HTMLInputElement).value))"
                min="0"
                max="100"
                class="progress-slider"
              />
              <button 
                @click="updateProgress(goal.id, goal.progress + 10)"
                :disabled="goal.progress >= 100"
                class="progress-btn"
              >
                <Icon icon="lucide:plus" class="btn-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="currentGoals.length === 0" class="empty-state">
        <Icon icon="lucide:target" class="empty-icon" />
        <h3 class="empty-title">No {{ currentView === 'mini' ? 'Mini' : 'Long-term' }} Goals Yet</h3>
        <p class="empty-description">
          {{ currentView === 'mini' ? 'Start by adding your first mini goal to build momentum!' : 'Set your long-term vision and start working towards it.' }}
        </p>
        <button class="empty-action">
          <Icon icon="lucide:plus" class="action-icon" />
          Add Your First Goal
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.goals-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.goals-header {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.5rem;
  color: #8b5cf6;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
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

.action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.btn-icon {
  font-size: 16px;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 8px;
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(2px);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  flex: 1;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #e2e8f0;
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  color: #fff;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.toggle-icon {
  font-size: 16px;
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

/* Progress Overview */
.progress-overview {
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
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #8b5cf6;
  text-align: center;
}

/* Add Goal Form */
.add-goal {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.add-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.goal-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.goal-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.category-select, .priority-select, .deadline-input {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  min-width: 120px;
}

.add-btn {
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

.add-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.add-icon {
  font-size: 16px;
}

/* Goals List */
.goals-list {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.goal-item {
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  border: 1px solid color-mix(in oklab, var(--color-border), transparent 30%);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.goal-item:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: var(--color-border, rgba(139, 92, 246, 0.2));
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.goal-item.completed {
  opacity: 0.7;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.goal-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.goal-icon {
  font-size: 24px;
  color: #8b5cf6;
  flex-shrink: 0;
  margin-top: 4px;
}

.goal-details {
  flex: 1;
}

.goal-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.3;
}

.goal-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.goal-category, .goal-priority {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid;
}

.goal-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #94a3b8;
}

.deadline-icon {
  font-size: 14px;
}

.overdue {
  color: #ef4444;
  font-weight: 600;
}

.goal-actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.action-icon {
  font-size: 16px;
}

/* Goal Progress */
.goal-progress {
  margin-top: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

.progress-percentage {
  font-size: 0.9rem;
  color: #8b5cf6;
  font-weight: 600;
}

.progress-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.progress-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  color: #8b5cf6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.progress-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-slider {
  flex: 1;
  height: 6px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
}

.progress-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  color: #8b5cf6;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 1rem;
  color: #94a3b8;
  margin-bottom: 24px;
}

.empty-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;
}

.empty-action:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .goals-page {
    gap: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .add-form {
    flex-direction: column;
    gap: 12px;
  }
  
  .goal-input {
    width: 100%;
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .goal-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .progress-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .progress-slider {
    order: -1;
  }
}
</style>
