import { createPersistPlugin } from '../utils/storage'

// Configuration for persisting each store
export const persistConfig = {
  // Persist all state for auth store
  auth: {
    key: 'dreamer-auth',
    paths: ['user', 'session']
  },
  // Persist all state for goals store
  goals: {
    key: 'dreamer-goals',
    paths: ['goals', 'goalProgress']
  },
  // Persist all state for streaks store
  streaks: {
    key: 'dreamer-streaks',
    paths: ['streaks', 'heatmapData']
  },
  // Persist theme preferences
  theme: {
    key: 'dreamer-theme',
    paths: ['theme', 'isDark']
  }
}

export function persistPlugin({ store }) {
  const config = persistConfig[store.$id]
  if (config) {
    createPersistPlugin({
      key: config.key,
      paths: config.paths
    })({ store })
  }
}

// Helper to check if a store should be persisted
export function shouldPersist(storeId: string): boolean {
  return !!persistConfig[storeId]
}
