import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabase'
import { useAuthStore } from './auth'
import { useLocalStorage } from '../utils/storage'

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string
  category: 'health' | 'work' | 'learning' | 'personal' | 'fitness' | 'creative'
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  target_value: number
  current_value: number
  unit: string
  target_date: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface GoalProgress {
  goal_id: string
  date: string
  value: number
  notes?: string
  created_at: string
}

export const useGoalsStore = defineStore('goals', () => {
  // State with persistence
  const goals = useLocalStorage<Goal[]>('goals:items', [])
  const goalProgress = useLocalStorage<GoalProgress[]>('goals:progress', [])
  const loading = ref(false)

  // Getters
  const authStore = useAuthStore()

  const activeGoals = computed(() => 
    goals.value.filter(goal => goal.status === 'active')
  )

  const completedGoals = computed(() => 
    goals.value.filter(goal => goal.status === 'completed')
  )

  const goalsByCategory = computed(() => {
    const categories = {
      health: [] as Goal[],
      work: [] as Goal[],
      learning: [] as Goal[],
      personal: [] as Goal[],
      fitness: [] as Goal[],
      creative: [] as Goal[]
    }

    goals.value.forEach(goal => {
      if (categories[goal.category]) {
        categories[goal.category].push(goal)
      }
    })

    return categories
  })

  const goalsByPriority = computed(() => {
    const priorities = {
      high: [] as Goal[],
      medium: [] as Goal[],
      low: [] as Goal[]
    }

    goals.value.forEach(goal => {
      priorities[goal.priority].push(goal)
    })

    return priorities
  })

  const getGoalProgress = computed(() => {
    const progressMap: Record<string, GoalProgress[]> = {}
    
    goalProgress.value.forEach(progress => {
      const goalId = progress?.goal_id
      if (goalId) {
        if (!progressMap[goalId]) {
          progressMap[goalId] = []
        }
        progressMap[goalId].push(progress)
      }
    })

    return progressMap
  })

  const getGoalStats = computed(() => {
    const total = goals.value.length
    const active = activeGoals.value.length
    const completed = completedGoals.value.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      active,
      completed,
      completionRate
    }
  })

  // Actions
  const fetchGoals = async () => {
    if (!authStore.user) {
      // If no user, try to load from local storage
      const storedGoals = localStorage.getItem('goals:items')
      if (storedGoals) {
        try {
          goals.value = JSON.parse(storedGoals)
        } catch (error) {
          console.error('Error parsing stored goals:', error)
        }
      }
      return
    }
    
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      goals.value = data || []
    } catch (error) {
      console.error('Error fetching goals:', error)
      // Fallback to local storage if online fetch fails
      const storedGoals = localStorage.getItem('goals:items')
      if (storedGoals) {
        try {
          goals.value = JSON.parse(storedGoals)
        } catch (parseError) {
          console.error('Error parsing stored goals:', parseError)
        }
      }
    } finally {
      loading.value = false
    }
  }

  const fetchGoalProgress = async () => {
    if (!authStore.isAuthenticated) return

    try {
      const { data, error } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('user_id', authStore.user?.id)
        .order('date', { ascending: false })

      if (error) throw error
      goalProgress.value = data || []
    } catch (error) {
      console.error('Error fetching goal progress:', error)
    }
  }

  const createGoal = async (goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!authStore.isAuthenticated) return { data: null, error: new Error('Not authenticated') }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          ...goalData,
          user_id: authStore.user?.id
        })
        .select()
        .single()

      if (error) throw error
      
      goals.value.unshift(data)
      return { data, error: null }
    } catch (error) {
      console.error('Error creating goal:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    if (!authStore.isAuthenticated) return { data: null, error: new Error('Not authenticated') }

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .eq('user_id', authStore.user?.id)
        .select()
        .single()

      if (error) throw error

      const index = goals.value.findIndex(goal => goal.id === goalId)
      if (index !== -1) {
        goals.value[index] = data
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating goal:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const deleteGoal = async (goalId: string) => {
    if (!authStore.isAuthenticated) return { data: null, error: new Error('Not authenticated') }

    loading.value = true
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', authStore.user?.id)

      if (error) throw error

      goals.value = goals.value.filter(goal => goal.id !== goalId)
      return { data: null, error: null }
    } catch (error) {
      console.error('Error deleting goal:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const recordProgress = async (goalId: string, value: number, notes?: string) => {
    if (!authStore.isAuthenticated) return { data: null, error: new Error('Not authenticated') }

    try {
      const today = new Date().toISOString().split('T')[0]

      // Check if progress already exists for today
      const { data: existingProgress } = await supabase
        .from('goal_progress')
        .select('*')
        .eq('goal_id', goalId)
        .eq('date', today)
        .single()

      let progressData
      if (existingProgress) {
        // Update existing progress
        const { data, error } = await supabase
          .from('goal_progress')
          .update({
            value: existingProgress.value + value,
            notes: notes || existingProgress.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id)
          .select()
          .single()

        if (error) throw error
        progressData = data
      } else {
        // Create new progress
        const { data, error } = await supabase
          .from('goal_progress')
          .insert({
            goal_id: goalId,
            user_id: authStore.user?.id,
            date: today,
            value,
            notes
          })
          .select()
          .single()

        if (error) throw error
        progressData = data
      }

      // Update goal current value
      const goal = goals.value.find(g => g.id === goalId)
      if (goal) {
        const newCurrentValue = Math.min(goal.current_value + value, goal.target_value)
        await updateGoal(goalId, { current_value: newCurrentValue })

        // Check if goal is completed
        if (newCurrentValue >= goal.target_value && goal.status === 'active') {
          await updateGoal(goalId, { 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
        }
      }

      // Refresh data
      await fetchGoalProgress()
      await fetchGoals()

      return { data: progressData, error: null }
    } catch (error) {
      console.error('Error recording progress:', error)
      return { data: null, error }
    }
  }

  const getGoalProgressHistory = (goalId: string) => {
    return goalProgress.value
      .filter(progress => progress.goal_id === goalId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const getGoalProgressPercentage = (goal: Goal) => {
    return Math.round((goal.current_value / goal.target_value) * 100)
  }

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate)
    const today = new Date()
    const diffTime = target.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      health: 'lucide:heart',
      work: 'lucide:briefcase',
      learning: 'lucide:book-open',
      personal: 'lucide:user',
      fitness: 'lucide:dumbbell',
      creative: 'lucide:palette'
    }
    return icons[category as keyof typeof icons] || 'lucide:target'
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      health: '#ef4444',
      work: '#3b82f6',
      learning: '#10b981',
      personal: '#8b5cf6',
      fitness: '#f59e0b',
      creative: '#ec4899'
    }
    return colors[category as keyof typeof colors] || '#8b5cf6'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: '#ef4444',
      medium: '#f59e0b',
      low: '#10b981'
    }
    return colors[priority as keyof typeof colors] || '#8b5cf6'
  }

  return {
    // State
    goals,
    goalProgress,
    loading,

    // Getters
    activeGoals,
    completedGoals,
    goalsByCategory,
    goalsByPriority,
    getGoalProgress,
    getGoalStats,

    // Actions
    fetchGoals,
    fetchGoalProgress,
    createGoal,
    updateGoal,
    deleteGoal,
    recordProgress,
    getGoalProgressHistory,
    getGoalProgressPercentage,
    getDaysRemaining,
    getCategoryIcon,
    getCategoryColor,
    getPriorityColor
  }
})
