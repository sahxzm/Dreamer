import { ref, watch } from 'vue'
import type { Ref } from 'vue'

/**
 * Creates a reactive reference that persists to localStorage
 */
export function useLocalStorage<T>(
  key: string, 
  initialValue: T,
  options: { storage?: Storage } = {}
) {
  const storage = options.storage || localStorage
  
  // Get from storage by key
  const storedValue = storage.getItem(key)
  // Parse stored json or use initial value
  const data = ref<T>(
    storedValue !== null ? JSON.parse(storedValue) : initialValue
  ) as Ref<T>

  // Watch for changes to the data and save to storage
  watch(
    data,
    (newValue) => {
      try {
        storage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Error saving to storage (${key}):`, error)
      }
    },
    { deep: true }
  )

  return data
}

/**
 * Creates a Pinia plugin that persists the store state to localStorage
 */
export function createPersistPlugin(options: {
  key?: string
  storage?: Storage
  paths?: string[]
} = {}) {
  return ({ store }) => {
    const storage = options.storage || localStorage
    const key = options.key || `pinia-${store.$id}`
    
    // Load saved state
    const savedState = storage.getItem(key)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        store.$patch(parsed)
      } catch (error) {
        console.error(`Error loading state for ${key}:`, error)
      }
    }
    
    // Subscribe to store changes
    store.$subscribe((_, state) => {
      try {
        const stateToPersist = options.paths
          ? options.paths.reduce((obj, path) => {
              const pathParts = path.split('.')
              const value = pathParts.reduce((o, p) => o?.[p], state)
              if (value !== undefined) {
                obj[path] = value
              }
              return obj
            }, {} as Record<string, any>)
          : state
        
        storage.setItem(key, JSON.stringify(stateToPersist))
      } catch (error) {
        console.error(`Error persisting state for ${key}:`, error)
      }
    })
  }
}

/**
 * Helper to get a value from storage with a default
 */
export function getFromStorage<T>(
  key: string, 
  defaultValue: T, 
  storage: Storage = localStorage
): T {
  try {
    const item = storage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from storage (${key}):`, error)
    return defaultValue
  }
}

/**
 * Helper to save a value to storage
 */
export function saveToStorage<T>(
  key: string, 
  value: T, 
  storage: Storage = localStorage
): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving to storage (${key}):`, error)
  }
}

/**
 * Creates a persisted ref that syncs with storage
 */
export function usePersistedRef<T>(
  key: string, 
  initialValue: T,
  options: { storage?: Storage } = {}
) {
  const storage = options.storage || localStorage
  const data = ref<T>(initialValue)
  
  // Load initial value from storage
  const stored = storage.getItem(key)
  if (stored !== null) {
    try {
      data.value = JSON.parse(stored)
    } catch (error) {
      console.error(`Error parsing stored value for ${key}:`, error)
    }
  }
  
  // Save to storage when value changes
  watch(data, (newValue) => {
    saveToStorage(key, newValue, storage)
  }, { deep: true })
  
  return data
}
