import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Theme {
  name: string
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  accent: string
}

export interface Background {
  name: string
  type: 'gradient' | 'image' | 'solid'
  value: string
  preview: string
}

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<string>('dark')
  const currentBackground = ref<string>('default')
  const customBackgrounds = ref<Background[]>([])

  // Predefined themes
  const themes: Record<string, Theme> = {
    dark: {
      name: 'Dark',
      primary: '#8b5cf6',
      secondary: '#a855f7',
      background: '#0f0f17',
      surface: 'rgba(15, 15, 25, 0.8)',
      text: '#e2e8f0',
      textSecondary: '#94a3b8',
      border: 'rgba(139, 92, 246, 0.2)',
      accent: '#8b5cf6'
    },
    light: {
      name: 'Light',
      primary: '#7c3aed',
      secondary: '#9333ea',
      background: '#ffffff',
      surface: 'rgba(255, 255, 255, 0.8)',
      text: '#1f2937',
      textSecondary: '#6b7280',
      border: 'rgba(124, 58, 237, 0.2)',
      accent: '#7c3aed'
    },
    purple: {
      name: 'Purple',
      primary: '#8b5cf6',
      secondary: '#a855f7',
      background: '#1a0b2e',
      surface: 'rgba(26, 11, 46, 0.8)',
      text: '#e2e8f0',
      textSecondary: '#c4b5fd',
      border: 'rgba(139, 92, 246, 0.3)',
      accent: '#8b5cf6'
    },
    blue: {
      name: 'Blue',
      primary: '#3b82f6',
      secondary: '#60a5fa',
      background: '#0f172a',
      surface: 'rgba(15, 23, 42, 0.8)',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: 'rgba(59, 130, 246, 0.2)',
      accent: '#3b82f6'
    },
    green: {
      name: 'Green',
      primary: '#10b981',
      secondary: '#34d399',
      background: '#064e3b',
      surface: 'rgba(6, 78, 59, 0.8)',
      text: '#ecfdf5',
      textSecondary: '#a7f3d0',
      border: 'rgba(16, 185, 129, 0.2)',
      accent: '#10b981'
    }
  }

  // Predefined backgrounds
  const backgrounds: Record<string, Background> = {
    default: {
      name: 'Default',
      type: 'gradient',
      value: 'radial-gradient(1200px 800px at 80% 20%, rgba(139, 92, 246, 0.1), transparent), linear-gradient(180deg, rgba(255,255,255,0.02), transparent), linear-gradient(45deg, rgba(139, 92, 246, 0.05), transparent)',
      preview: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1))'
    },
    aurora: {
      name: 'Aurora',
      type: 'gradient',
      value: 'linear-gradient(45deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      preview: 'linear-gradient(45deg, #667eea, #764ba2)'
    },
    sunset: {
      name: 'Sunset',
      type: 'gradient',
      value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      preview: 'linear-gradient(135deg, #ff9a9e, #fecfef)'
    },
    ocean: {
      name: 'Ocean',
      type: 'gradient',
      value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      preview: 'linear-gradient(135deg, #667eea, #764ba2)'
    },
    forest: {
      name: 'Forest',
      type: 'gradient',
      value: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      preview: 'linear-gradient(135deg, #134e5e, #71b280)'
    },
    space: {
      name: 'Space',
      type: 'gradient',
      value: 'radial-gradient(ellipse at center, #1e3c72 0%, #2a5298 100%)',
      preview: 'linear-gradient(135deg, #1e3c72, #2a5298)'
    }
  }

  // Computed
  const activeTheme = computed(() => themes[currentTheme.value] || themes.dark)
  const activeBackground = computed(() => {
    const bg = backgrounds[currentBackground.value] || backgrounds.default
    return customBackgrounds.value.find(cb => cb.name === currentBackground.value) || bg
  })

  const allThemes = computed(() => Object.values(themes))
  const allBackgrounds = computed(() => [
    ...Object.values(backgrounds),
    ...customBackgrounds.value
  ])

  // Actions
  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      currentTheme.value = themeName
      saveToStorage()
      applyTheme()
    }
  }

  const setBackground = (backgroundName: string) => {
    const bg = backgrounds[backgroundName] || customBackgrounds.value.find(cb => cb.name === backgroundName)
    if (bg) {
      currentBackground.value = backgroundName
      saveToStorage()
      applyBackground()
    }
  }

  const addCustomBackground = (background: Omit<Background, 'name'> & { name: string }) => {
    const newBackground: Background = {
      ...background,
      name: background.name || `Custom ${Date.now()}`
    }
    
    customBackgrounds.value.push(newBackground)
    saveToStorage()
  }

  const removeCustomBackground = (backgroundName: string) => {
    const index = customBackgrounds.value.findIndex(bg => bg.name === backgroundName)
    if (index > -1) {
      customBackgrounds.value.splice(index, 1)
      if (currentBackground.value === backgroundName) {
        currentBackground.value = 'default'
      }
      saveToStorage()
    }
  }

  const applyTheme = () => {
    const theme = activeTheme.value
    const root = document.documentElement
    
    root.style.setProperty('--color-primary', theme.primary)
    root.style.setProperty('--color-secondary', theme.secondary)
    root.style.setProperty('--color-background', theme.background)
    root.style.setProperty('--color-surface', theme.surface)
    root.style.setProperty('--color-text', theme.text)
    root.style.setProperty('--color-text-secondary', theme.textSecondary)
    root.style.setProperty('--color-border', theme.border)
    root.style.setProperty('--color-accent', theme.accent)
  }

  const applyBackground = () => {
    const background = activeBackground.value
    const root = document.documentElement
    
    if (background.type === 'image') {
      root.style.setProperty('--body-background', `url(${background.value}) center/cover no-repeat fixed`)
    } else {
      root.style.setProperty('--body-background', background.value)
    }
  }

  const saveToStorage = () => {
    const themeData = {
      currentTheme: currentTheme.value,
      currentBackground: currentBackground.value,
      customBackgrounds: customBackgrounds.value
    }
    localStorage.setItem('dreamer_theme', JSON.stringify(themeData))
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('dreamer_theme')
      if (stored) {
        const themeData = JSON.parse(stored)
        currentTheme.value = themeData.currentTheme || 'dark'
        currentBackground.value = themeData.currentBackground || 'default'
        customBackgrounds.value = themeData.customBackgrounds || []
      }
    } catch (error) {
      console.error('Error loading theme from storage:', error)
    }
  }

  const initializeTheme = () => {
    try {
      loadFromStorage()
      applyTheme()
      applyBackground()
    } catch (error) {
      console.error('Error initializing theme:', error)
      // Set defaults if initialization fails
      currentTheme.value = 'dark'
      currentBackground.value = 'default'
      applyTheme()
      applyBackground()
    }
  }

  const resetToDefault = () => {
    currentTheme.value = 'dark'
    currentBackground.value = 'default'
    customBackgrounds.value = []
    saveToStorage()
    applyTheme()
    applyBackground()
  }

  return {
    // State
    currentTheme,
    currentBackground,
    customBackgrounds,

    // Computed
    activeTheme,
    activeBackground,
    allThemes,
    allBackgrounds,

    // Actions
    setTheme,
    setBackground,
    addCustomBackground,
    removeCustomBackground,
    applyTheme,
    applyBackground,
    saveToStorage,
    loadFromStorage,
    initializeTheme,
    resetToDefault
  }
})
