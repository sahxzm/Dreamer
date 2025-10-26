<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '../utils/storage'

// Task state
const currentView = ref<'today' | 'backlog'>('today')
const showCompleted = ref(false)
const newTaskText = ref('')
const newTaskPriority = ref<'high' | 'medium' | 'low'>('medium')

// Tasks data with local storage persistence
const tasks = useLocalStorage<Array<{
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  category: string
}>>('tasks', [])

// Computed properties
const todayTasks = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return tasks.value.filter(task => task.dueDate === today)
})

const backlogTasks = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return tasks.value.filter(task => task.dueDate !== today)
})

const filteredTasks = computed(() => {
  const taskList = currentView.value === 'today' ? todayTasks.value : backlogTasks.value
  return showCompleted.value ? taskList : taskList.filter(task => !task.completed)
})

const completedTasks = computed(() => {
  const taskList = currentView.value === 'today' ? todayTasks.value : backlogTasks.value
  return taskList.filter(task => task.completed).length
})

const totalTasks = computed(() => {
  const taskList = currentView.value === 'today' ? todayTasks.value : backlogTasks.value
  return taskList.length
})

const completionRate = computed(() => {
  return totalTasks.value > 0 ? Math.round((completedTasks.value / totalTasks.value) * 100) : 0
})

// Task actions
const toggleTask = (taskId: number) => {
  tasks.value = tasks.value.map(task => 
    task.id === taskId 
      ? { ...task, completed: !task.completed }
      : task
  )
}

const addTask = () => {
  if (!newTaskText.value.trim()) return
  
  const today = new Date().toISOString().split('T')[0] || ''
  
  const newTask = {
    id: Date.now(),
    text: newTaskText.value.trim(),
    completed: false,
    priority: newTaskPriority.value,
    dueDate: today,
    category: 'general'
  }
  
  tasks.value = [...tasks.value, newTask]
  newTaskText.value = ''
  newTaskPriority.value = 'medium'
}

const moveAllToToday = () => {
  const today = new Date().toISOString().split('T')[0] || ''
  tasks.value = tasks.value.map(task => ({
    ...task,
    dueDate: today
  }))
}

const deleteTask = (taskId: number) => {
  tasks.value = tasks.value.filter(task => task.id !== taskId)
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'text-red-400 bg-red-400/20 border-red-400/30'
    case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
    case 'low': return 'text-green-400 bg-green-400/20 border-green-400/30'
    default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
  }
}
</script>

<template>
  <div class="tasks-page">
    <!-- Header -->
    <div class="tasks-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon icon="lucide:clipboard-list" class="title-icon" />
          {{ currentView === 'today' ? 'Today\'s Tasks' : 'Backlog' }}
        </h1>
        <div class="header-actions">
          <button 
            @click="moveAllToToday"
            v-if="currentView === 'backlog'"
            class="action-btn"
          >
            <Icon icon="lucide:arrow-right" class="btn-icon" />
            Move All to Today
          </button>
          <button @click="addTask" class="action-btn primary">
            <Icon icon="lucide:plus" class="btn-icon" />
            Add Task
          </button>
        </div>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <button 
        @click="currentView = 'today'"
        :class="['toggle-btn', { active: currentView === 'today' }]"
      >
        <Icon icon="lucide:calendar" class="toggle-icon" />
        Today
      </button>
      <button 
        @click="currentView = 'backlog'"
        :class="['toggle-btn', { active: currentView === 'backlog' }]"
      >
        <Icon icon="lucide:archive" class="toggle-icon" />
        Backlog
      </button>
    </div>

    <!-- Progress Stats -->
    <div class="progress-section">
      <div class="progress-stats">
        <div class="stat">
          <span class="stat-number">{{ completedTasks }}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ totalTasks - completedTasks }}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat">
          <span class="stat-number">{{ completionRate }}%</span>
          <span class="stat-label">Complete</span>
        </div>
      </div>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: `${completionRate}%` }"
        ></div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <label class="filter-item">
        <input 
          type="checkbox" 
          v-model="showCompleted"
          class="filter-checkbox"
        />
        <span class="filter-label">Show completed</span>
      </label>
    </div>

    <!-- Quick Add Task -->
    <div class="quick-add">
      <div class="add-form">
        <input 
          v-model="newTaskText"
          @keyup.enter="addTask"
          placeholder="Quick add task..."
          class="task-input"
        />
        <select v-model="newTaskPriority" class="priority-select">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button @click="addTask" class="add-btn">
          <Icon icon="lucide:plus" class="add-icon" />
        </button>
      </div>
    </div>

    <!-- Tasks List -->
    <div class="tasks-list">
      <div 
        v-for="task in filteredTasks" 
        :key="task.id"
        :class="['task-item', { completed: task.completed }]"
      >
        <div class="task-checkbox" @click="toggleTask(task.id)">
          <Icon 
            :icon="task.completed ? 'lucide:check-circle' : 'lucide:circle'" 
            class="checkbox-icon"
          />
        </div>
        
        <div class="task-content">
          <div class="task-main">
            <span class="task-text">{{ task.text }}</span>
            <div class="task-meta">
              <span :class="['task-priority', getPriorityColor(task.priority)]">
                {{ task.priority }}
              </span>
              <span class="task-date">{{ task.dueDate }}</span>
            </div>
          </div>
          
          <div class="task-actions">
            <button @click="deleteTask(task.id)" class="delete-btn">
              <Icon icon="lucide:trash-2" class="action-icon" />
            </button>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <Icon icon="lucide:clipboard-x" class="empty-icon" />
        <h3 class="empty-title">No tasks yet</h3>
        <p class="empty-description">
          {{ currentView === 'today' ? 'Add some tasks for today!' : 'Your backlog is empty.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.tasks-header {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
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

.action-btn:not(.primary) {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #e2e8f0;
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
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(20px);
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

/* Progress Section */
.progress-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat {
  text-align: center;
}

.stat-number {
  display: block;
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

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Filters */
.filters {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #94a3b8;
  font-weight: 500;
}

.filter-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #8b5cf6;
}

.filter-label {
  font-size: 14px;
}

/* Quick Add */
.quick-add {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(20px);
}

.add-form {
  display: flex;
  gap: 12px;
  align-items: center;
}

.task-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.task-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.priority-select {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  min-width: 100px;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.add-icon {
  font-size: 20px;
}

/* Tasks List */
.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(20px);
  transition: all 0.2s ease;
}

.task-item:hover {
  background: rgba(15, 15, 25, 0.8);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
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
  cursor: pointer;
}

.checkbox-icon {
  font-size: 24px;
  color: #8b5cf6;
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
  gap: 16px;
}

.task-main {
  flex: 1;
}

.task-text {
  display: block;
  color: #e2e8f0;
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 8px;
}

.task-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.task-priority {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid;
}

.task-date {
  font-size: 0.9rem;
  color: #94a3b8;
}

.task-actions {
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
}

/* Responsive Design */
@media (max-width: 768px) {
  .tasks-page {
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
  
  .progress-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  
  .add-form {
    flex-direction: column;
    gap: 12px;
  }
  
  .task-input {
    width: 100%;
  }
  
  .task-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .task-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
