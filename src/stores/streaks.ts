import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '../utils/storage'

export interface StreakData {
  id: string
  activity_type: 'tasks' | 'focus' | 'journal' | 'routines'
  date: string
  value: number
  created_at: string
  updated_at: string
}

export interface StreakStats {
  current: number
  longest: number
  total: number
  last_activity: string | null
}

export const useStreaksStore = defineStore('streaks', () => {
  // State with persistence
  const streaks = useLocalStorage<StreakData[]>('streaks:items', [])
  const loading = ref(false)
  const heatmapData = useLocalStorage<Record<string, number>>('streaks:heatmap', {})

  // Getters

  const getStreakStats = computed(() => {
    const stats: Record<string, StreakStats> = {
      tasks: { current: 0, longest: 0, total: 0, last_activity: null },
      focus: { current: 0, longest: 0, total: 0, last_activity: null },
      journal: { current: 0, longest: 0, total: 0, last_activity: null },
      routines: { current: 0, longest: 0, total: 0, last_activity: null }
    }

    // Group by activity type and calculate stats
    const grouped = streaks.value.reduce((acc, streak) => {
      const activityType = streak.activity_type
      if (activityType) {
        if (!acc[activityType]) {
          acc[activityType] = []
        }
        acc[activityType].push(streak)
      }
      return acc
    }, {} as Record<string, StreakData[]>)

    Object.entries(grouped).forEach(([activityType, activityStreaks]) => {
      if (!activityStreaks || activityStreaks.length === 0) return

      // Sort by date
      const sortedStreaks = [...activityStreaks].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Calculate current streak
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = sortedStreaks.length - 1; i >= 0; i--) {
        const streak = sortedStreaks[i]
        if (!streak) continue
        
        const streakDate = new Date(streak.date)
        streakDate.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((today.getTime() - streakDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === currentStreak) {
          currentStreak++
        } else if (daysDiff === currentStreak + 1) {
          // Check if there's a gap of exactly 1 day
          continue
        } else {
          break
        }
      }

      // Calculate longest streak
      let longestStreak = 0
      let tempStreak = 0
      let lastDate: Date | null = null

      for (const streak of sortedStreaks) {
        const streakDate = new Date(streak.date)
        streakDate.setHours(0, 0, 0, 0)

        if (lastDate) {
          const daysDiff = Math.floor((streakDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysDiff === 1) {
            tempStreak++
          } else {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        } else {
          tempStreak = 1
        }
        lastDate = streakDate
      }
      longestStreak = Math.max(longestStreak, tempStreak)

      stats[activityType] = {
        current: currentStreak,
        longest: longestStreak,
        total: activityStreaks.length,
        last_activity: sortedStreaks.length > 0 ? sortedStreaks[sortedStreaks.length - 1]?.date || null : null
      }
    })

    return stats
  })

  const updateHeatmapData = () => {
    const newHeatmapData: Record<string, number> = {}
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // Initialize all dates with 0
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      if (dateStr) {
        newHeatmapData[dateStr] = 0
      }
    }

    // Add actual streak data
    streaks.value.forEach(streak => {
      const dateStr = streak.date
      const value = streak.value ?? 0 // Ensure value is a number
      if (dateStr && newHeatmapData.hasOwnProperty(dateStr)) {
        newHeatmapData[dateStr] = Math.max(newHeatmapData[dateStr] ?? 0, value)
      }
    })

    heatmapData.value = newHeatmapData
  }

  const getHeatmapData = computed(() => {
    updateHeatmapData()
    return heatmapData.value
  })

  // Actions
  const fetchStreaks = async () => {
    // Streaks are already loaded from local storage via useLocalStorage
    // This function is kept for compatibility but doesn't need to do anything
    return
  }

  const recordActivity = async (
    activityType: 'tasks' | 'focus' | 'journal' | 'routines',
    value: number = 1
  ) => {
    const today = new Date().toISOString().split('T')[0]
    if (!today) {
      throw new Error('Unable to get current date')
    }
    
    try {
      console.log(`Recording activity: ${activityType} with value ${value}`)
      
      // Check if activity already exists for today
      const existingIndex = streaks.value.findIndex(
        streak => streak.activity_type === activityType && streak.date === today
      )

      if (existingIndex !== -1) {
        // Update existing record
        const existingStreak = streaks.value[existingIndex]
        if (existingStreak) {
          streaks.value[existingIndex] = {
            ...existingStreak,
            value: (existingStreak.value || 0) + value,
            updated_at: new Date().toISOString()
          }
        }
      } else {
        // Create new record
        const newStreak: StreakData = {
          id: `streak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          activity_type: activityType,
          date: today,
          value: value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        streaks.value.unshift(newStreak)
      }

      updateHeatmapData()
      console.log('Activity recorded successfully')
      return true
    } catch (error) {
      console.error('Error in recordActivity:', error)
      throw error // Re-throw to allow components to handle the error
    }
  }

  const getStreakForDate = (date: string, activityType: 'tasks' | 'focus' | 'journal' | 'routines'): number => {
    const streak = streaks.value.find(
      s => s.date === date && s.activity_type === activityType
    )
    return streak?.value ?? 0
  }

  const getStreakLevel = (value: number) => {
    if (value === 0) return 0
    if (value < 3) return 1
    if (value < 6) return 2
    if (value < 10) return 3
    return 4
  }

  const getStreakColor = (level: number) => {
    const colors = [
      'rgba(139, 92, 246, 0.1)', // Level 0 - no activity
      'rgba(139, 92, 246, 0.3)', // Level 1 - low activity
      'rgba(139, 92, 246, 0.5)', // Level 2 - medium activity
      'rgba(139, 92, 246, 0.7)', // Level 3 - high activity
      'rgba(139, 92, 246, 1)'     // Level 4 - maximum activity
    ]
    return colors[level] || colors[0]
  }

  return {
    // State
    streaks,
    loading,
    heatmapData,

    // Getters
    getStreakStats,
    getHeatmapData,

    // Actions
    fetchStreaks,
    recordActivity,
    getStreakForDate,
    getStreakLevel,
    getStreakColor
  }
})
