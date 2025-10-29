<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useLocalStorage } from '../utils/storage'

// Routine state
const newRoutineName = ref('')
const newRoutineCategory = ref('health')
const newRoutineFrequency = ref('daily')

// Routines data with local storage persistence
const routines = useLocalStorage<Array<{
  id: number
  name: string
  category: string
  frequency: string
  streak: number
  totalCompletions: number
  lastCompleted: string | null
  isActive: boolean
}>>('routines', [])


// Computed properties
const activeRoutines = computed(() => routines.value.filter(r => r.isActive))
const totalRoutines = computed(() => routines.value.length)
const todayCompletions = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return routines.value.filter(r => r.lastCompleted === today).length
})
const weeklyCompletions = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split('T')[0] || ''
  return routines.value.filter(r => r.lastCompleted && r.lastCompleted >= weekAgoStr).length
})
const currentStreak = computed(() => {
  return Math.max(...routines.value.map(r => r.streak))
})

const totalCompletionsAll = computed(() => {
  return routines.value.reduce((sum, r) => sum + r.totalCompletions, 0)
})

// Routine actions
const addRoutine = () => {
  if (!newRoutineName.value.trim()) return
  
  const newRoutine = {
    id: Date.now(),
    name: newRoutineName.value.trim(),
    category: newRoutineCategory.value,
    frequency: newRoutineFrequency.value,
    streak: 0,
    totalCompletions: 0,
    lastCompleted: null,
    isActive: true
  }
  
  routines.value = [...routines.value, newRoutine]
  newRoutineName.value = ''
}

const toggleRoutine = (routineId: number) => {
  routines.value = routines.value.map(routine => 
    routine.id === routineId 
      ? { ...routine, isActive: !routine.isActive }
      : routine
  )
}

const completeRoutine = (routineId: number) => {
  const today = new Date().toISOString().split('T')[0] || ''
  routines.value = routines.value.map(routine => {
    if (routine.id === routineId) {
      const isAlreadyCompletedToday = routine.lastCompleted === today
      return {
        ...routine,
        lastCompleted: today,
        streak: isAlreadyCompletedToday ? routine.streak : routine.streak + 1,
        totalCompletions: routine.totalCompletions + 1
      }
    }
    return routine
  })
}

const deleteRoutine = (routineId: number) => {
  routines.value = routines.value.filter(r => r.id !== routineId)
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'health': return 'lucide:heart'
    case 'learning': return 'lucide:book-open'
    case 'mindfulness': return 'lucide:brain'
    case 'work': return 'lucide:briefcase'
    case 'personal': return 'lucide:user'
    default: return 'lucide:target'
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'health': return 'text-green-400 bg-green-400/20 border-green-400/30'
    case 'learning': return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
    case 'mindfulness': return 'text-purple-400 bg-purple-400/20 border-purple-400/30'
    case 'work': return 'text-orange-400 bg-orange-400/20 border-orange-400/30'
    case 'personal': return 'text-pink-400 bg-pink-400/20 border-pink-400/30'
    default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
  }
}

</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <!-- Header -->
    <div class="rounded-2xl border bg-card">
      <div class="flex items-center justify-between p-6 flex-wrap gap-4">
        <div>
          <h1 class="page-title">
            <Icon icon="lucide:refresh-cw" class="title-icon" />
            Routines
          </h1>
          <p class="text-muted-foreground text-sm">Track and build your daily and weekly habits.</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button @click="addRoutine" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            <Icon icon="lucide:plus" class="btn-icon" />
            Add Routine
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border bg-card p-6">
        <div class="stat-icon">
          <Icon icon="lucide:repeat" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalCompletionsAll }}</div>
          <div class="stat-label">Total Completions</div>
        </div>
      </div>
      <div class="rounded-2xl border bg-card p-6">
        <div class="stat-icon">
          <Icon icon="lucide:check-circle" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ todayCompletions }}</div>
          <div class="stat-label">Today's Completions</div>
        </div>
      </div>
      <div class="rounded-2xl border bg-card p-6">
        <div class="stat-icon">
          <Icon icon="lucide:trending-up" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ weeklyCompletions }}</div>
          <div class="stat-label">Weekly Completions</div>
        </div>
      </div>
      <div class="rounded-2xl border bg-card p-6">
        <div class="stat-icon">
          <Icon icon="lucide:sparkles" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ currentStreak }}</div>
          <div class="stat-label">Longest Streak</div>
        </div>
      </div>
    </div>


    <!-- Add Routine Form -->
    <div class="rounded-2xl border bg-card p-6">
      <h2 class="section-title">Add New Routine</h2>
      <div class="add-form">
        <input 
          v-model="newRoutineName"
          placeholder="Routine name..."
          class="rounded-md border bg-background px-3 py-2 text-sm flex-1 min-w-[200px]"
        />
        <select v-model="newRoutineCategory" class="rounded-md border bg-background px-3 py-2 text-sm min-w-[120px]">
          <option value="health">Health</option>
          <option value="learning">Learning</option>
          <option value="mindfulness">Mindfulness</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </select>
        <select v-model="newRoutineFrequency" class="rounded-md border bg-background px-3 py-2 text-sm min-w-[120px]">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button @click="addRoutine" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          <Icon icon="lucide:plus" class="inline h-4 w-4 mr-2" />
          Add Routine
        </button>
      </div>
    </div>

    <!-- Routines List -->
    <div class="grid gap-6">
      <div 
        v-for="routine in activeRoutines" 
        :key="routine.id"
        class="rounded-2xl border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between"
      >
        <div class="flex-1 mb-4 sm:mb-0">
          <h3 class="font-headline text-lg">{{ routine.name }}</h3>
          <div class="text-muted-foreground text-sm">{{ routine.category }} - {{ routine.frequency }}</div>
          <div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>Streak: {{ routine.streak }} days</span>
            <span>Total: {{ routine.totalCompletions }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="completeRoutine(routine.id)" class="rounded-md border px-3 py-2 text-sm hover:bg-secondary" :disabled="routine.lastCompleted === new Date().toISOString().split('T')[0]">
            Mark Complete
          </button>
          <button @click="toggleRoutine(routine.id)" class="rounded-md px-3 py-2 text-sm hover:bg-secondary">
            Toggle Active
          </button>
          <button @click="deleteRoutine(routine.id)" class="rounded-md px-3 py-2 text-sm text-red-500 hover:bg-secondary">
            Delete
          </button>
        </div>
      </div>
      <div v-if="activeRoutines.length === 0" class="p-12 text-center text-muted-foreground rounded-2xl border bg-card">
        <div class="font-medium text-foreground">No Routines Yet</div>
        <div class="text-sm">Create your first routine to start tracking your daily habits.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.routines-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.routines-header {
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
  color: #fff;
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

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
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
  color: hsl(var(--primary));
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
  color: hsl(var(--muted-foreground));
  font-weight: 500;
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
  color: hsl(var(--primary));
}

/* Add Routine Form */
.add-routine {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
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

.routine-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: hsl(var(--foreground));
  font-size: 14px;
}

.routine-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.category-select, .frequency-select {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: hsl(var(--foreground));
  font-size: 14px;
  min-width: 120px;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.add-icon {
  font-size: 16px;
}

/* Today's Routines */
.today-routines {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.routines-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.routine-item {
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  border: 1px solid color-mix(in oklab, var(--color-border), transparent 30%);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.routine-item:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: var(--color-border);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.routine-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.routine-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.routine-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.routine-icon {
  font-size: 24px;
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.routine-details {
  flex: 1;
}

.routine-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
}

.routine-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.routine-category {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid;
}

.routine-frequency {
  font-size: 0.9rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.routine-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
}

.stat-item .stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-item .stat-label {
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.routine-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.complete-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.complete-btn:disabled {
  background: rgba(107, 114, 128, 0.3);
  color: #9ca3af;
  cursor: not-allowed;
}

.complete-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.toggle-btn, .delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.toggle-btn {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: hsl(var(--primary));
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
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
  color: hsl(var(--muted-foreground));
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
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;
}

.empty-action:hover {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .routines-page {
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
  
  .heatmap-grid {
    grid-template-columns: repeat(15, 1fr);
  }
  
  .add-form {
    flex-direction: column;
    gap: 12px;
  }
  
  .routine-input {
    width: 100%;
  }
  
  .routine-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .routine-stats {
    width: 100%;
    justify-content: space-around;
  }
  
  .routine-actions {
    width: 100%;
    justify-content: center;
  }
  
  .complete-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>
