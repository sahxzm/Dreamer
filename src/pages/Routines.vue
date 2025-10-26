<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// Routine state
const showHeatmap = ref(false)
const newRoutineName = ref('')
const newRoutineCategory = ref('health')
const newRoutineFrequency = ref('daily')

// Mock routines data
const routines = ref([
  { 
    id: 1, 
    name: 'Morning Workout', 
    category: 'health', 
    frequency: 'daily',
    streak: 7,
    totalCompletions: 45,
    lastCompleted: '2024-01-15',
    isActive: true
  },
  { 
    id: 2, 
    name: 'Read 30 minutes', 
    category: 'learning', 
    frequency: 'daily',
    streak: 12,
    totalCompletions: 78,
    lastCompleted: '2024-01-15',
    isActive: true
  },
  { 
    id: 3, 
    name: 'Meditation', 
    category: 'mindfulness', 
    frequency: 'daily',
    streak: 3,
    totalCompletions: 15,
    lastCompleted: '2024-01-14',
    isActive: true
  },
  { 
    id: 4, 
    name: 'Code Practice', 
    category: 'learning', 
    frequency: 'daily',
    streak: 0,
    totalCompletions: 23,
    lastCompleted: '2024-01-10',
    isActive: false
  }
])

// Mock activity data for heatmap (last 30 days)
const activityData = ref(() => {
  const data = []
  const today = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Generate random activity levels (0-4)
    const level = Math.floor(Math.random() * 5)
    data.push({
      date: dateStr,
      level: level,
      completions: level > 0 ? Math.floor(Math.random() * 3) + 1 : 0
    })
  }
  return data
})

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
  const weekAgoStr = weekAgo.toISOString().split('T')[0]
  return routines.value.filter(r => r.lastCompleted >= weekAgoStr).length
})
const currentStreak = computed(() => {
  return Math.max(...routines.value.map(r => r.streak))
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
  
  routines.value.push(newRoutine)
  newRoutineName.value = ''
}

const toggleRoutine = (routineId: number) => {
  const routine = routines.value.find(r => r.id === routineId)
  if (routine) {
    routine.isActive = !routine.isActive
  }
}

const completeRoutine = (routineId: number) => {
  const routine = routines.value.find(r => r.id === routineId)
  if (routine) {
    const today = new Date().toISOString().split('T')[0]
    routine.lastCompleted = today
    routine.streak += 1
    routine.totalCompletions += 1
  }
}

const deleteRoutine = (routineId: number) => {
  const index = routines.value.findIndex(r => r.id === routineId)
  if (index > -1) {
    routines.value.splice(index, 1)
  }
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

const getHeatmapColor = (level: number) => {
  switch (level) {
    case 0: return 'bg-gray-800'
    case 1: return 'bg-green-900'
    case 2: return 'bg-green-700'
    case 3: return 'bg-green-500'
    case 4: return 'bg-green-300'
    default: return 'bg-gray-800'
  }
}
</script>

<template>
  <div class="routines-page">
    <!-- Header -->
    <div class="routines-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon icon="lucide:refresh-cw" class="title-icon" />
          Routine Tracker
        </h1>
        <div class="header-actions">
          <button 
            @click="showHeatmap = !showHeatmap"
            class="action-btn"
          >
            <Icon icon="lucide:grid-3x3" class="btn-icon" />
            {{ showHeatmap ? 'Hide' : 'Show' }} Heatmap
          </button>
          <button class="action-btn primary">
            <Icon icon="lucide:plus" class="btn-icon" />
            Add Routine
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:clock" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ totalRoutines }}</div>
          <div class="stat-label">Total Routines</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:check-circle" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ todayCompletions }}</div>
          <div class="stat-label">Today's Completions</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:bar-chart" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ weeklyCompletions }}</div>
          <div class="stat-label">This Week</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:flame" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ currentStreak }}</div>
          <div class="stat-label">Current Streak</div>
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <div v-if="showHeatmap" class="heatmap-section">
      <h2 class="section-title">Activity Heatmap</h2>
      <div class="heatmap-container">
        <div class="heatmap-grid">
          <div 
            v-for="day in activityData" 
            :key="day.date"
            :class="['heatmap-day', getHeatmapColor(day.level)]"
            :title="`${day.date}: ${day.completions} completions`"
          ></div>
        </div>
        <div class="heatmap-legend">
          <span class="legend-label">Less</span>
          <div class="legend-colors">
            <div class="legend-color bg-gray-800"></div>
            <div class="legend-color bg-green-900"></div>
            <div class="legend-color bg-green-700"></div>
            <div class="legend-color bg-green-500"></div>
            <div class="legend-color bg-green-300"></div>
          </div>
          <span class="legend-label">More</span>
        </div>
      </div>
    </div>

    <!-- Add Routine Form -->
    <div class="add-routine">
      <h2 class="section-title">Add New Routine</h2>
      <div class="add-form">
        <input 
          v-model="newRoutineName"
          placeholder="Routine name..."
          class="routine-input"
        />
        <select v-model="newRoutineCategory" class="category-select">
          <option value="health">Health</option>
          <option value="learning">Learning</option>
          <option value="mindfulness">Mindfulness</option>
          <option value="work">Work</option>
          <option value="personal">Personal</option>
        </select>
        <select v-model="newRoutineFrequency" class="frequency-select">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <button @click="addRoutine" class="add-btn">
          <Icon icon="lucide:plus" class="add-icon" />
          Add Routine
        </button>
      </div>
    </div>

    <!-- Today's Routines -->
    <div class="today-routines">
      <h2 class="section-title">
        <Icon icon="lucide:calendar" class="section-icon" />
        Today's Routines
      </h2>
      
      <div class="routines-list">
        <div 
          v-for="routine in activeRoutines" 
          :key="routine.id"
          class="routine-item"
        >
          <div class="routine-main">
            <div class="routine-header">
              <div class="routine-info">
                <Icon :icon="getCategoryIcon(routine.category)" class="routine-icon" />
                <div class="routine-details">
                  <h3 class="routine-name">{{ routine.name }}</h3>
                  <div class="routine-meta">
                    <span :class="['routine-category', getCategoryColor(routine.category)]">
                      {{ routine.category }}
                    </span>
                    <span class="routine-frequency">{{ routine.frequency }}</span>
                  </div>
                </div>
              </div>
              
              <div class="routine-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ routine.streak }}</span>
                  <span class="stat-label">Streak</span>
                </div>
                <div class="stat-item">
                  <span class="stat-number">{{ routine.totalCompletions }}</span>
                  <span class="stat-label">Total</span>
                </div>
              </div>
            </div>
            
            <div class="routine-actions">
              <button 
                @click="completeRoutine(routine.id)"
                class="complete-btn"
                :disabled="routine.lastCompleted === new Date().toISOString().split('T')[0]"
              >
                <Icon icon="lucide:check" class="action-icon" />
                {{ routine.lastCompleted === new Date().toISOString().split('T')[0] ? 'Completed' : 'Complete' }}
              </button>
              
              <button @click="toggleRoutine(routine.id)" class="toggle-btn">
                <Icon :icon="routine.isActive ? 'lucide:pause' : 'lucide:play'" class="action-icon" />
              </button>
              
              <button @click="deleteRoutine(routine.id)" class="delete-btn">
                <Icon icon="lucide:trash-2" class="action-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="activeRoutines.length === 0" class="empty-state">
        <Icon icon="lucide:target" class="empty-icon" />
        <h3 class="empty-title">No Routines Yet</h3>
        <p class="empty-description">Create your first routine to start tracking your daily habits.</p>
        <button class="empty-action">
          <Icon icon="lucide:plus" class="action-icon" />
          Add Routine
        </button>
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

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
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

/* Heatmap Section */
.heatmap-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
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

.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 2px;
  max-width: 100%;
  overflow-x: auto;
}

.heatmap-day {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.heatmap-day:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}

.legend-label {
  font-size: 0.8rem;
  color: #94a3b8;
  font-weight: 500;
}

.legend-colors {
  display: flex;
  gap: 2px;
}

.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* Add Routine Form */
.add-routine {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
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
  color: #e2e8f0;
  font-size: 14px;
}

.routine-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.category-select, .frequency-select {
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

/* Today's Routines */
.today-routines {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.routines-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.routine-item {
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.routine-item:hover {
  background: rgba(15, 15, 25, 0.6);
  border-color: rgba(139, 92, 246, 0.2);
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
  color: #8b5cf6;
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
  color: #94a3b8;
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
  color: #94a3b8;
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
  color: #8b5cf6;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
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
