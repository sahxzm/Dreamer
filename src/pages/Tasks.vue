<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '../utils/storage'

// Task state
const currentView = ref<'today' | 'backlog'>('today')
const currentFilter = ref<'all' | 'todo' | 'inprogress' | 'notdone' | 'done'>('all')
const showCompleted = ref(false)
const newTaskText = ref('')
const newTaskPriority = ref<'high' | 'medium' | 'low'>('medium')

// Tasks data with local storage persistence
type TaskStatus = 'todo' | 'inprogress' | 'done'
const tasks = useLocalStorage<Array<{
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  category: string
  status?: TaskStatus
}>>('tasks', [])

// Function to get the correct current date in local timezone
const getCurrentDate = () => {
  const now = new Date()
  // Use local timezone instead of UTC
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Ensure existing tasks have a status
const ensureStatuses = () => {
  tasks.value = tasks.value.map(t => {
    const status: TaskStatus = t.status ?? (t.completed ? 'done' : 'todo')
    return { ...t, status }
  })
}
ensureStatuses()

// Computed properties
const todayTasks = computed(() => {
  const today = getCurrentDate()
  return tasks.value.filter(task => task.dueDate === today)
})

const backlogTasks = computed(() => {
  const today = getCurrentDate()
  return tasks.value.filter(task => task.dueDate !== today)
})

const filteredTasks = computed(() => {
  const taskList = (currentFilter.value === 'notdone' ? tasks.value : (currentView.value === 'today' ? todayTasks.value : backlogTasks.value))
  const withStatus = taskList.map(t => ({ ...t, status: (t.status ?? (t.completed ? 'done' : 'todo')) as TaskStatus }))
  let byFilter = withStatus
  switch (currentFilter.value) {
    case 'todo':
      byFilter = withStatus.filter(t => t.status === 'todo')
      break
    case 'inprogress':
      byFilter = withStatus.filter(t => t.status === 'inprogress')
      break
    case 'notdone':
      byFilter = withStatus.filter(t => !t.completed)
      break
    case 'done':
      byFilter = withStatus.filter(t => t.status === 'done')
      break
    case 'all':
    default:
      byFilter = withStatus
  }
  // Hide completed in non-done views unless explicitly shown
  if (currentFilter.value !== 'done' && !showCompleted.value) {
    byFilter = byFilter.filter(t => !t.completed)
  }
  // For Not Done view, sort by due date ascending (past to current)
  if (currentFilter.value === 'notdone') {
    byFilter = [...byFilter].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }
  return byFilter
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
      ? { ...task, completed: !task.completed, status: (!task.completed ? 'done' : (task.status === 'done' ? 'todo' : (task.status ?? 'todo'))) as TaskStatus }
      : task
  )
}

const addTask = () => {
  if (!newTaskText.value.trim()) return
  
  const today = getCurrentDate()
  
  const newTask = {
    id: Date.now(),
    text: newTaskText.value.trim(),
    completed: false,
    priority: newTaskPriority.value,
    dueDate: today,
    category: 'general',
    status: 'todo' as TaskStatus
  }
  
  tasks.value = [...tasks.value, newTask]
  newTaskText.value = ''
  newTaskPriority.value = 'medium'
  console.log('Task created for today:', today, newTask)
}

// Removed backlog UI: function no longer used

const deleteTask = (taskId: number) => {
  tasks.value = tasks.value.filter(task => task.id !== taskId)
}

const setStatus = (taskId: number, status: TaskStatus) => {
  tasks.value = tasks.value.map(task => task.id === taskId ? { ...task, status, completed: status === 'done' ? true : task.completed } : task)
}

const onStatusChange = (taskId: number, e: Event) => {
  const target = e.target as HTMLSelectElement | null
  if (!target) return
  const value = (target.value as TaskStatus)
  setStatus(taskId, value)
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
  <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    

    <!-- Kanban Filters + Progress Card -->
    <div class="rounded-2xl border bg-card">
      <div class="flex flex-col gap-4 p-6">
        <div class="flex flex-wrap items-center gap-2">
          <button @click="currentFilter = 'all'" :class="['rounded-md px-3 py-1.5 text-sm border', currentFilter==='all' ? 'bg-secondary' : '']">All</button>
          <button @click="currentFilter = 'todo'" :class="['rounded-md px-3 py-1.5 text-sm border', currentFilter==='todo' ? 'bg-secondary' : '']">To Do</button>
          <button @click="currentFilter = 'inprogress'" :class="['rounded-md px-3 py-1.5 text-sm border', currentFilter==='inprogress' ? 'bg-secondary' : '']">In Progress</button>
          <button @click="currentFilter = 'notdone'" :class="['rounded-md px-3 py-1.5 text-sm border', currentFilter==='notdone' ? 'bg-secondary' : '']">Not Done</button>
          <button @click="currentFilter = 'done'" :class="['rounded-md px-3 py-1.5 text-sm border', currentFilter==='done' ? 'bg-secondary' : '']">Done</button>
          <label class="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" v-model="showCompleted" class="h-4 w-4" />
            Show completed
          </label>
        </div>
        <div class="grid grid-cols-3 gap-4 text-center">
        <div>
          <div class="text-2xl font-bold">{{ completedTasks }}</div>
          <div class="text-xs text-muted-foreground">Completed</div>
        </div>
        <div>
          <div class="text-2xl font-bold">{{ totalTasks - completedTasks }}</div>
          <div class="text-xs text-muted-foreground">Pending</div>
        </div>
        <div>
          <div class="text-2xl font-bold">{{ completionRate }}%</div>
          <div class="text-xs text-muted-foreground">Complete</div>
        </div>
        </div>
        <div>
        <div class="w-full h-2 rounded bg-secondary overflow-hidden">
          <div class="h-2 bg-primary" :style="{ width: `${completionRate}%` }"></div>
        </div>
        </div>
    </div>
    </div>

    <!-- Quick Add Card -->
    <div class="rounded-2xl border bg-card p-4">
      <div class="flex flex-col md:flex-row gap-3 items-stretch">
        <input v-model="newTaskText" @keyup.enter="addTask" placeholder="Quick add task..." class="flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select v-model="newTaskPriority" class="rounded-md border bg-background px-3 py-2 text-sm md:w-40">
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button @click="addTask" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground md:w-32">Add</button>
      </div>
    </div>

    <!-- Tasks List Card -->
    <div class="rounded-2xl border bg-card">
      <div class="divide-y">
        <div v-for="task in filteredTasks" :key="task.id" class="flex items-center gap-3 p-4">
          <button @click="toggleTask(task.id)" class="grid h-5 w-5 place-items-center rounded-full" :class="task.completed ? 'bg-primary text-primary-foreground' : 'bg-secondary'">
            <Icon v-if="task.completed" icon="lucide:check-circle-2" class="h-4 w-4" />
          </button>
          <div class="flex-1">
            <div :class="['text-sm', task.completed ? 'line-through text-muted-foreground' : '']">{{ task.text }}</div>
            <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span :class="['rounded border px-2 py-0.5', getPriorityColor(task.priority)]">{{ task.priority }}</span>
              <span>{{ task.dueDate }}</span>
            </div>
          </div>
          <select class="rounded-md border bg-background px-2 py-1 text-xs" :value="(task.status ?? (task.completed ? 'done' : 'todo'))" @change="onStatusChange(task.id, $event)">
            <option value="todo">To Do</option>
            <option value="inprogress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button @click="deleteTask(task.id)" class="rounded-md border px-2 py-1 text-xs hover:bg-secondary">
            <Icon icon="lucide:trash-2" class="h-4 w-4" />
          </button>
        </div>
      </div>
      <div v-if="filteredTasks.length === 0" class="p-12 text-center text-muted-foreground">
        <Icon icon="lucide:clipboard-x" class="mx-auto mb-2 h-10 w-10 text-primary" />
        <div class="font-medium text-foreground">No tasks yet</div>
        <div class="text-sm">{{ currentView === 'today' ? 'Add some tasks for today!' : 'Your backlog is empty.' }}</div>
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
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
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.5rem;
  color: hsl(var(--primary));
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
  color: hsl(var(--foreground));
}

.action-btn.primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
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
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  flex: 1;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: hsl(var(--foreground));
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
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
  color: hsl(var(--muted-foreground));
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
  background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)));
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
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.filter-checkbox {
  width: 16px;
  height: 16px;
  accent-color: hsl(var(--primary));
}

.filter-label {
  font-size: 14px;
}

/* Quick Add */
.quick-add {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(2px);
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
  color: hsl(var(--foreground));
  font-size: 14px;
}

.task-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.priority-select {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: hsl(var(--foreground));
  font-size: 14px;
  min-width: 100px;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
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
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  border: 1px solid color-mix(in oklab, var(--color-border), transparent 30%);
  border-radius: 12px;
  backdrop-filter: blur(2px);
  transition: all 0.2s ease;
}

.task-item:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: var(--color-border, rgba(139, 92, 246, 0.2));
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
