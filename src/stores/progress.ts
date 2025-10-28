import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '../utils/storage'

export interface ProgressItem {
  id: string
  type: 'task' | 'goal' | 'focus' | 'journal' | 'routine'
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  category: string
  value: number
  target_value?: number
  date: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface ProgressStats {
  total: number
  completed: number
  pending: number
  in_progress: number
  completionRate: number
  todayCompleted: number
  weekCompleted: number
  monthCompleted: number
}

export const useProgressStore = defineStore('progress', () => {
  // State with persistence
  const progressItems = useLocalStorage<ProgressItem[]>('progress:items', [])
  const loading = ref(false)
  const lastSync = useLocalStorage<string>('progress:lastSync', '')

  // Getters

  const today = computed(() => new Date().toISOString().split('T')[0])
  const thisWeek = computed(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    return startOfWeek.toISOString().split('T')[0]
  })
  const thisMonth = computed(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  })

  const todayItems = computed(() => 
    progressItems.value.filter(item => item.date === today.value)
  )

  const completedToday = computed(() => 
    todayItems.value.filter(item => item.status === 'completed')
  )

  const pendingToday = computed(() => 
    todayItems.value.filter(item => item.status === 'pending')
  )

  const inProgressToday = computed(() => 
    todayItems.value.filter(item => item.status === 'in_progress')
  )

  const progressStats = computed((): ProgressStats => {
    const total = progressItems.value.length
    const completed = progressItems.value.filter(item => item.status === 'completed').length
    const pending = progressItems.value.filter(item => item.status === 'pending').length
    const in_progress = progressItems.value.filter(item => item.status === 'in_progress').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    const todayCompleted = completedToday.value.length
    const thisWeekVal = thisWeek.value
    const thisMonthVal = thisMonth.value
    const weekCompleted = progressItems.value.filter(item => 
      item.status === 'completed' && thisWeekVal && item.date >= thisWeekVal
    ).length
    const monthCompleted = progressItems.value.filter(item => 
      item.status === 'completed' && thisMonthVal && item.date >= thisMonthVal
    ).length

    return {
      total,
      completed,
      pending,
      in_progress,
      completionRate,
      todayCompleted,
      weekCompleted,
      monthCompleted
    }
  })

  const itemsByType = computed(() => {
    const types = {
      task: [] as ProgressItem[],
      goal: [] as ProgressItem[],
      focus: [] as ProgressItem[],
      journal: [] as ProgressItem[],
      routine: [] as ProgressItem[]
    }

    progressItems.value.forEach(item => {
      if (types[item.type]) {
        types[item.type].push(item)
      }
    })

    return types
  })

  const itemsByCategory = computed(() => {
    const categories: Record<string, ProgressItem[]> = {}
    
    progressItems.value.forEach(item => {
      const category = item.category || 'general'
      if (!categories[category]) {
        categories[category] = []
      }
      categories[category].push(item)
    })

    return categories
  })

  // Actions
  const fetchProgress = async () => {
    // Progress items are already loaded from local storage via useLocalStorage
    // This function is kept for compatibility but doesn't need to do anything
    return
  }

  const createProgressItem = async (itemData: Omit<ProgressItem, 'id' | 'created_at' | 'updated_at'>) => {
    loading.value = true
    try {
      const newItem: ProgressItem = {
        ...itemData,
        id: `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      progressItems.value.unshift(newItem)
      return { data: newItem, error: null }
    } catch (error) {
      console.error('Error creating progress item:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const updateProgressItem = async (itemId: string, updates: Partial<ProgressItem>) => {
    loading.value = true
    try {
      const index = progressItems.value.findIndex(item => item.id === itemId)
      if (index !== -1 && progressItems.value[index]) {
        progressItems.value[index] = {
          ...progressItems.value[index],
          ...updates,
          updated_at: new Date().toISOString()
        } as ProgressItem
        return { data: progressItems.value[index], error: null }
      }
      return { data: null, error: new Error('Item not found') }
    } catch (error) {
      console.error('Error updating progress item:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const completeProgressItem = async (itemId: string) => {
    return await updateProgressItem(itemId, {
      status: 'completed',
      completed_at: new Date().toISOString()
    })
  }

  const deleteProgressItem = async (itemId: string) => {
    loading.value = true
    try {
      progressItems.value = progressItems.value.filter(item => item.id !== itemId)
      return { data: null, error: null }
    } catch (error) {
      console.error('Error deleting progress item:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Real-time sync functions
  const syncWithTasks = async (tasks: any[]) => {
    const today = new Date().toISOString().split('T')[0]
    
    for (const task of tasks) {
      const existingItem = progressItems.value.find(item => 
        item.type === 'task' && 
        item.title === task.text && 
        item.date === task.dueDate
      )

      if (!existingItem && task.dueDate === today) {
        // Create new progress item for today's tasks
        await createProgressItem({
          type: 'task',
          title: task.text,
          description: `Task: ${task.text}`,
          status: task.completed ? 'completed' : 'pending',
          priority: task.priority,
          category: task.category || 'general',
          value: task.completed ? 1 : 0,
          date: task.dueDate,
          completed_at: task.completed ? new Date().toISOString() : undefined
        })
      } else if (existingItem && existingItem.status !== (task.completed ? 'completed' : 'pending')) {
        // Update existing item status
        await updateProgressItem(existingItem.id, {
          status: task.completed ? 'completed' : 'pending',
          completed_at: task.completed ? new Date().toISOString() : undefined
        })
      }
    }
  }

  const syncWithGoals = async (goals: any[]) => {
    for (const goal of goals) {
      const existingItem = progressItems.value.find(item => 
        item.type === 'goal' && 
        item.title === goal.title
      )

      if (!existingItem) {
        // Create new progress item for goal
        const goalData: Omit<ProgressItem, 'id' | 'created_at' | 'updated_at'> = {
          type: 'goal',
          title: goal.title,
          description: goal.description,
          status: goal.status === 'completed' ? 'completed' : 'pending',
          priority: goal.priority,
          category: goal.category,
          value: goal.current_value,
          target_value: goal.target_value,
          date: new Date().toISOString().split('T')[0] || new Date().toISOString()
        }
        if (goal.completed_at) {
          goalData.completed_at = goal.completed_at
        }
        await createProgressItem(goalData)
      } else if (existingItem.value !== goal.current_value || existingItem.status !== (goal.status === 'completed' ? 'completed' : 'pending')) {
        // Update existing goal progress
        await updateProgressItem(existingItem.id, {
          value: goal.current_value,
          status: goal.status === 'completed' ? 'completed' : 'pending',
          completed_at: goal.completed_at || undefined
        })
      }
    }
  }

  // Auto-sync when data changes
  const startAutoSync = () => {
    // No longer needed since we're using local storage only
    // This function is kept for compatibility but doesn't do anything
    return () => {}
  }

  return {
    // State
    progressItems,
    loading,
    lastSync,

    // Getters
    today,
    thisWeek,
    thisMonth,
    todayItems,
    completedToday,
    pendingToday,
    inProgressToday,
    progressStats,
    itemsByType,
    itemsByCategory,

    // Actions
    fetchProgress,
    createProgressItem,
    updateProgressItem,
    completeProgressItem,
    deleteProgressItem,
    syncWithTasks,
    syncWithGoals,
    startAutoSync
  }
})
