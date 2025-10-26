import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabase'
import { useAuthStore } from './auth'
import { useLocalStorage } from '../utils/storage'

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
  // State with persistence
  const streaks = useLocalStorage<StreakData[]>('streaks:items', [])
  const loading = ref(false)
  const heatmapData = useLocalStorage<Record<string, number>>('streaks:heatmap', {})

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
        last_activity: sortedStreaks.length > 0 ? sortedStreaks[sortedStreaks.length - 1].date : null
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
    // Check if user is authenticated
    if (!authStore.user?.id) {
      console.warn('Cannot fetch streaks: User not authenticated')
      return
    }

    loading.value = true
    try {
      console.log('Fetching streaks for user:', authStore.user.id)
      
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('date', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to fetch streaks: ${error.message}`)
      }
      
      console.log('Fetched streaks:', data)
      
      if (data) {
        streaks.value = data
        updateHeatmapData()
      }
    } catch (error) {
      console.error('Error in fetchStreaks:', error)
      // Optionally show error to user
      throw error // Re-throw to allow components to handle the error
    } finally {
      loading.value = false
    }
  }

  const recordActivity = async (
    activityType: 'tasks' | 'focus' | 'journal' | 'routines',
    value: number = 1
  ) => {
    // Verify user is authenticated
    if (!authStore.user?.id) {
      const error = new Error('Cannot record activity: User not authenticated')
      console.warn(error.message)
      throw error
    }

    const today = new Date().toISOString().split('T')[0]
    
    try {
      console.log(`Recording activity: ${activityType} with value ${value} for user ${authStore.user.id}`)
      
      // Check if activity already exists for today
      const { data: existing, error: fetchError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', authStore.user.id)
        .eq('activity_type', activityType)
        .eq('date', today)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking for existing activity:', fetchError)
        throw new Error(`Failed to check existing activity: ${fetchError.message}`)
      }

      if (existing) {
        // Update existing record
        console.log('Updating existing activity record:', existing.id)
        const { data, error: updateError } = await supabase
          .from('streaks')
          .update({ 
            value: (existing.value || 0) + value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          console.error('Update error:', updateError)
          throw new Error(`Failed to update activity: ${updateError.message}`)
        }
        
        if (data) {
          const index = streaks.value.findIndex(s => s.id === data.id)
          if (index !== -1) {
            streaks.value[index] = data
          } else {
            streaks.value = [data, ...streaks.value]
          }
        }
      } else {
        // Create new record
        console.log('Creating new activity record')
        const { data, error: insertError } = await supabase
          .from('streaks')
          .insert([
            {
              user_id: authStore.user.id,
              activity_type: activityType,
              date: today,
              value: value
            }
          ])
          .select()
          .single()

        if (insertError) {
          console.error('Insert error:', insertError)
          throw new Error(`Failed to create activity: ${insertError.message}`)
        }
        
        if (data) {
          streaks.value = [data, ...streaks.value]
        }
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
