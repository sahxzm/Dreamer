import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ThemePreview {
  name: string
  primary: string
  secondary: string
}

export interface Background {
  name: string
  type: 'image'
  value: string
  preview: string
}

type Mode = 'light' | 'dark'
type ThemeClass = 'default' | 'batman' | 'hello-kitty' | 'spiderman'

export const useThemeStore = defineStore('theme', () => {
  // State (class-based theming)
  const currentMode = ref<Mode>('dark')
  const currentThemeClass = ref<ThemeClass>('default')
  const currentBackground = ref<string>('default')
  const customBackgrounds = ref<Background[]>([])

  // Previews for Settings UI (visual only)
  const themes: Record<string, ThemePreview> = {
    light: { name: 'Light', primary: '#f472b6', secondary: '#c4b5fd' },
    dark: { name: 'Dark', primary: '#f472b6', secondary: '#1f2937' },
    batman: { name: 'Batman', primary: '#f59e0b', secondary: '#111827' },
    'hello-kitty': { name: 'Hello Kitty', primary: '#fb7185', secondary: '#fde68a' },
    spiderman: { name: 'Spiderman', primary: '#ef4444', secondary: '#3b82f6' },
  }

  // Only image backgrounds apply in new mechanic (matches todoref)
  const backgrounds: Record<string, Background> = {
    default: {
      name: 'Default',
      type: 'image',
      value: '',
      preview: ''
    }
  }

  // Computed
  const allThemes = computed(() => Object.values(themes))
  const activeBackground = computed(() => {
    return customBackgrounds.value.find(cb => cb.name === currentBackground.value)
  })
  const allBackgrounds = computed(() => [
    ...customBackgrounds.value
  ])

  // Compatibility for existing Settings.vue highlighting
  const currentTheme = computed(() => {
    if (currentThemeClass.value !== 'default') return currentThemeClass.value
    return currentMode.value
  })

  // Actions
  const setTheme = (themeKey: string) => {
    // Accept legacy keys (e.g., 'light'/'dark') and variant keys
    if (themeKey === 'light' || themeKey === 'dark') {
      currentMode.value = themeKey
      currentThemeClass.value = 'default'
    } else if (themeKey === 'batman' || themeKey === 'hello kitty' || themeKey === 'hello-kitty' || themeKey === 'spiderman') {
      currentThemeClass.value = (themeKey.replace(' ', '-') as ThemeClass)
      // Variants are designed for dark base unless explicitly light
      currentMode.value = 'dark'
    }
    saveToStorage()
    applyTheme()
  }

  const setBackground = (backgroundName: string) => {
    const bg = customBackgrounds.value.find(cb => cb.name === backgroundName)
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
    const root = document.documentElement

    // Reset theme classes
    root.classList.remove('dark', 'theme-light', 'theme-batman', 'theme-hello-kitty', 'theme-spiderman')

    // Apply mode
    if (currentMode.value === 'dark') {
      root.classList.add('dark')
    } else {
      // Optionally allow explicit theme-light
      root.classList.add('theme-light')
    }

    // Apply variant class if selected
    if (currentThemeClass.value !== 'default') {
      root.classList.add(`theme-${currentThemeClass.value}`)
    }

    // Form controls and UA styling
    root.style.setProperty('color-scheme', currentMode.value === 'dark' ? 'dark' : 'light')
  }

  const applyBackground = () => {
    const root = document.documentElement
    const bg = activeBackground.value
    if (bg && bg.type === 'image' && bg.value) {
      localStorage.setItem('custom-background', bg.value)
      root.style.setProperty('--custom-background-image', `url(${bg.value})`)
      root.style.setProperty('--background-opacity', '0.8')
    } else {
      localStorage.removeItem('custom-background')
      root.style.removeProperty('--custom-background-image')
      root.style.setProperty('--background-opacity', '1')
    }
  }

  const saveToStorage = () => {
    const themeData = {
      currentMode: currentMode.value,
      currentThemeClass: currentThemeClass.value,
      currentBackground: currentBackground.value,
      customBackgrounds: customBackgrounds.value
    }
    localStorage.setItem('dreamer_theme_v2', JSON.stringify(themeData))
  }

  const loadFromStorage = () => {
    try {
      const storedV2 = localStorage.getItem('dreamer_theme_v2')
      if (storedV2) {
        const data = JSON.parse(storedV2)
        currentMode.value = (data.currentMode as Mode) || 'dark'
        currentThemeClass.value = (data.currentThemeClass as ThemeClass) || 'default'
        currentBackground.value = data.currentBackground || 'default'
        customBackgrounds.value = data.customBackgrounds || []
        return
      }
      // Fallback: infer from legacy storage
      const storedLegacy = localStorage.getItem('dreamer_theme')
      if (storedLegacy) {
        const legacy = JSON.parse(storedLegacy)
        currentMode.value = legacy.currentTheme === 'light' ? 'light' : 'dark'
        currentThemeClass.value = 'default'
        currentBackground.value = legacy.currentBackground || 'default'
        customBackgrounds.value = legacy.customBackgrounds || []
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
      currentMode.value = 'dark'
      currentThemeClass.value = 'default'
      currentBackground.value = 'default'
      applyTheme()
      applyBackground()
    }
  }

  const resetToDefault = () => {
    currentMode.value = 'dark'
    currentThemeClass.value = 'default'
    currentBackground.value = 'default'
    customBackgrounds.value = []
    localStorage.removeItem('custom-background')
    saveToStorage()
    applyTheme()
    applyBackground()
  }

  return {
    // State
    currentMode,
    currentThemeClass,
    currentBackground,
    customBackgrounds,

    // Computed
    currentTheme,
    allThemes,
    activeBackground,
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
