import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabase'
import { useAuthStore } from './auth'

export interface StreakData {
  id: string
  user_id: string
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
  // State
  const streaks = ref<StreakData[]>([])
  const loading = ref(false)
  const heatmapData = ref<Record<string, number>>({})

  // Getters
  const authStore = useAuthStore()

  const getStreakStats = computed(() => {
    const stats: Record<string, StreakStats> = {
      tasks: { current: 0, longest: 0, total: 0, last_activity: null },
      focus: { current: 0, longest: 0, total: 0, last_activity: null },
      journal: { current: 0, longest: 0, total: 0, last_activity: null },
      routines: { current: 0, longest: 0, total: 0, last_activity: null }
    }

    // Group by activity type and calculate stats
    const grouped = streaks.value.reduce((acc, streak) => {
      if (!acc[streak.activity_type]) {
        acc[streak.activity_type] = []
      }
      acc[streak.activity_type].push(streak)
      return acc
    }, {} as Record<string, StreakData[]>)

    Object.keys(stats).forEach(activityType => {
      const activityStreaks = grouped[activityType] || []
      if (activityStreaks.length === 0) return

      // Sort by date
      const sortedStreaks = activityStreaks.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Calculate current streak
      let currentStreak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = sortedStreaks.length - 1; i >= 0; i--) {
        const streakDate = new Date(sortedStreaks[i].date)
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
        last_activity: sortedStreaks.length > 0 ? sortedStreaks[sortedStreaks.length - 1].date : null
      }
    })

    return stats
  })

  const getHeatmapData = computed(() => {
    const data: Record<string, number> = {}
    const today = new Date()
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())

    // Initialize all dates with 0
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      data[dateStr] = 0
    }

    // Add actual streak data
    streaks.value.forEach(streak => {
      const dateStr = streak.date
      if (data.hasOwnProperty(dateStr)) {
        data[dateStr] = Math.max(data[dateStr], streak.value)
      }
    })

    return data
  })

  // Actions
  const fetchStreaks = async () => {
    if (!authStore.isAuthenticated) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', authStore.user?.id)
        .order('date', { ascending: false })

      if (error) throw error
      streaks.value = data || []
    } catch (error) {
      console.error('Error fetching streaks:', error)
    } finally {
      loading.value = false
    }
  }

  const recordActivity = async (activityType: 'tasks' | 'focus' | 'journal' | 'routines', value: number = 1) => {
    if (!authStore.isAuthenticated) return

    const today = new Date().toISOString().split('T')[0]

    try {
      // Check if streak already exists for today
      const { data: existingStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', authStore.user?.id)
        .eq('activity_type', activityType)
        .eq('date', today)
        .single()

      if (existingStreak) {
        // Update existing streak
        const { error } = await supabase
          .from('streaks')
          .update({ 
            value: Math.max(existingStreak.value, value),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStreak.id)

        if (error) throw error
      } else {
        // Create new streak
        const { error } = await supabase
          .from('streaks')
          .insert({
            user_id: authStore.user?.id,
            activity_type: activityType,
            date: today,
            value: value
          })

        if (error) throw error
      }

      // Refresh streaks
      await fetchStreaks()
    } catch (error) {
      console.error('Error recording activity:', error)
    }
  }

  const getStreakForDate = (date: string, activityType: 'tasks' | 'focus' | 'journal' | 'routines') => {
    return streaks.value.find(
      streak => streak.date === date && streak.activity_type === activityType
    )?.value || 0
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
