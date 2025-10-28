<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { useStreaksStore } from '../stores/streaks'

const props = defineProps<{
  activityType: 'tasks' | 'focus' | 'journal' | 'routines'
  title?: string
  showStats?: boolean
}>()

const streaksStore = useStreaksStore()

// State
const selectedYear = ref(new Date().getFullYear())
const hoveredDate = ref<string | null>(null)
const hoveredValue = ref(0)

// Computed
const heatmapData = computed(() => {
  const data = streaksStore.getHeatmapDataForActivity(props.activityType)
  const yearData: Record<string, number> = {}
  
  // Filter data for selected year
  Object.keys(data).forEach(date => {
    const year = new Date(date).getFullYear()
    if (year === selectedYear.value) {
      yearData[date] = data[date]
    }
  })
  
  return yearData
})

const calendarDays = computed(() => {
  const days: Array<{
    date: string
    value: number
    level: number
    isToday: boolean
    isFuture: boolean
    dayOfWeek: number
    weekOfYear: number
  }> = []

  const startOfYear = new Date(selectedYear.value, 0, 1)
  const endOfYear = new Date(selectedYear.value, 11, 31)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the first Sunday of the year
  const firstSunday = new Date(startOfYear)
  firstSunday.setDate(startOfYear.getDate() - startOfYear.getDay())

  for (let d = new Date(firstSunday); d <= endOfYear; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const value = heatmapData.value[dateStr] || 0
    const level = streaksStore.getStreakLevel(value)
    const isToday = d.getTime() === today.getTime()
    const isFuture = d > today

    days.push({
      date: dateStr,
      value,
      level,
      isToday,
      isFuture,
      dayOfWeek: d.getDay(),
      weekOfYear: getWeekOfYear(d)
    })
  }

  return days
})

const weeks = computed(() => {
  const weekMap: Record<number, typeof calendarDays.value> = {}
  
  calendarDays.value.forEach(day => {
    if (!weekMap[day.weekOfYear]) {
      weekMap[day.weekOfYear] = []
    }
    weekMap[day.weekOfYear].push(day)
  })

  return Object.values(weekMap)
})

const stats = computed(() => {
  if (!props.showStats) return null
  return streaksStore.getStreakStats[props.activityType]
})

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= currentYear - 4; year--) {
    years.push(year)
  }
  return years
})

// Methods
const getWeekOfYear = (date: Date) => {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const getActivityDescription = (value: number) => {
  if (value === 0) return 'No activity'
  if (value < 3) return 'Low activity'
  if (value < 6) return 'Medium activity'
  if (value < 10) return 'High activity'
  return 'Maximum activity'
}

const handleDayHover = (day: typeof calendarDays.value[0]) => {
  hoveredDate.value = day.date
  hoveredValue.value = day.value
}

const handleDayLeave = () => {
  hoveredDate.value = null
  hoveredValue.value = 0
}

const getDayStyle = (day: typeof calendarDays.value[0]) => {
  const baseStyle = {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const
  }

  if (day.isFuture) {
    return {
      ...baseStyle,
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
      border: '1px solid rgba(139, 92, 246, 0.1)'
    }
  }

  if (day.isToday) {
    return {
      ...baseStyle,
      backgroundColor: streaksStore.getStreakColor(day.level),
      border: '2px solid #a855f7',
      boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.3)'
    }
  }

  return {
    ...baseStyle,
    backgroundColor: streaksStore.getStreakColor(day.level),
    border: '1px solid rgba(139, 92, 246, 0.1)'
  }
}

// Lifecycle
onMounted(async () => {
  await streaksStore.fetchStreaks()
})
</script>

<template>
  <div class="streak-heatmap">
    <!-- Header -->
    <div class="heatmap-header">
      <div class="header-content">
        <h3 class="heatmap-title">
          <Icon :icon="getActivityIcon(activityType)" class="title-icon" />
          {{ title || `${activityType.charAt(0).toUpperCase() + activityType.slice(1)} Streak` }}
        </h3>
        
        <div class="year-selector">
          <select v-model="selectedYear" class="year-select">
            <option v-for="year in availableYears" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>
      </div>

      <!-- Stats -->
      <div v-if="stats" class="heatmap-stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.current }}</span>
          <span class="stat-label">Current</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.longest }}</span>
          <span class="stat-label">Longest</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
      </div>
    </div>

    <!-- Heatmap -->
    <div class="heatmap-container">
      <!-- Day labels -->
      <div class="day-labels">
        <div class="day-label">S</div>
        <div class="day-label">M</div>
        <div class="day-label">T</div>
        <div class="day-label">W</div>
        <div class="day-label">T</div>
        <div class="day-label">F</div>
        <div class="day-label">S</div>
      </div>

      <!-- Calendar grid -->
      <div class="calendar-grid">
        <div v-for="week in weeks" :key="week[0].weekOfYear" class="week">
          <div
            v-for="day in week"
            :key="day.date"
            :style="getDayStyle(day)"
            @mouseenter="handleDayHover(day)"
            @mouseleave="handleDayLeave"
            :title="`${formatDate(day.date)}: ${getActivityDescription(day.value)}`"
            class="day-cell"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="heatmap-legend">
      <span class="legend-text">Less</span>
      <div class="legend-colors">
        <div
          v-for="level in [0, 1, 2, 3, 4]"
          :key="level"
          class="legend-color"
          :style="{ backgroundColor: streaksStore.getStreakColor(level) }"
        />
      </div>
      <span class="legend-text">More</span>
    </div>

    <!-- Tooltip -->
    <div v-if="hoveredDate" class="heatmap-tooltip">
      <div class="tooltip-content">
        <div class="tooltip-date">{{ formatDate(hoveredDate) }}</div>
        <div class="tooltip-value">
          {{ getActivityDescription(hoveredValue) }}: {{ hoveredValue }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Helper function to get activity icon
const getActivityIcon = (activityType: string) => {
  const icons = {
    tasks: 'lucide:clipboard-list',
    focus: 'lucide:clock',
    journal: 'lucide:book-open',
    routines: 'lucide:refresh-cw'
  }
  return icons[activityType as keyof typeof icons] || 'lucide:activity'
}
</script>

<style scoped>
.streak-heatmap {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
  position: relative;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.heatmap-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-icon {
  font-size: 1.125rem;
  color: #8b5cf6;
}

.year-selector {
  display: flex;
  align-items: center;
}

.year-select {
  padding: 8px 12px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
}

.year-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.heatmap-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.heatmap-container {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.day-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 20px;
}

.day-label {
  width: 12px;
  height: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.week {
  display: flex;
  gap: 2px;
}

.day-cell {
  position: relative;
}

.day-cell:hover {
  transform: scale(1.1);
  z-index: 10;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.legend-text {
  font-size: 12px;
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
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.heatmap-tooltip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 8px 12px;
  backdrop-filter: blur(2px);
  z-index: 1000;
  pointer-events: none;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-date {
  font-size: 12px;
  color: #e2e8f0;
  font-weight: 500;
}

.tooltip-value {
  font-size: 11px;
  color: #8b5cf6;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .heatmap-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .heatmap-stats {
    gap: 16px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .heatmap-container {
    overflow-x: auto;
  }
  
  .calendar-grid {
    min-width: 300px;
  }
}
</style>
