<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useThemeStore } from '../stores/theme'
import { useAuthStore } from '../stores/auth'
// import type { Background } from '../stores/theme'

const themeStore = useThemeStore()
const authStore = useAuthStore()

// State
type TabType = 'appearance' | 'account' | 'notifications' | 'data' | 'about'
const activeTab = ref<TabType>('appearance')
const showImageUpload = ref(false)
const newCustomBackground = ref({
  name: '',
  type: 'image' as const,
  value: '',
  preview: ''
})

// Computed
const user = computed(() => authStore.user)
const userMetadata = computed(() => user.value?.user_metadata || {})

// Tabs
const tabs: Array<{ id: TabType; label: string; icon: string }> = [
  { id: 'appearance', label: 'Appearance', icon: 'lucide:palette' },
  { id: 'account', label: 'Account', icon: 'lucide:user' },
  { id: 'notifications', label: 'Notifications', icon: 'lucide:bell' },
  { id: 'data', label: 'Data', icon: 'lucide:database' },
  { id: 'about', label: 'About', icon: 'lucide:info' }
]

// Methods
const handleImageUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      newCustomBackground.value.value = result
      newCustomBackground.value.preview = result
    }
    reader.readAsDataURL(file)
  }
}

const addCustomBackground = () => {
  if (newCustomBackground.value.name && newCustomBackground.value.value) {
    themeStore.addCustomBackground(newCustomBackground.value)
    newCustomBackground.value = {
      name: '',
      type: 'image',
      value: '',
      preview: ''
    }
    showImageUpload.value = false
  }
}

const removeCustomBackground = (backgroundName: string) => {
  themeStore.removeCustomBackground(backgroundName)
}

const exportData = () => {
  // Export user data
  const data = {
    user: user.value,
    settings: {
      theme: themeStore.currentTheme,
      background: themeStore.currentBackground
    },
    exportDate: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dreamer-data-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const clearData = () => {
  if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    localStorage.clear()
    window.location.reload()
  }
}

// Lifecycle
onMounted(() => {
  themeStore.initializeTheme()
})
</script>

<template>
  <div class="settings-page">
    <!-- Header -->
    <div class="settings-header">
      <h1 class="page-title">
        <Icon icon="lucide:settings" class="title-icon" />
        Settings
      </h1>
      <p class="page-subtitle">
        Customize your Dreamer experience
      </p>
    </div>

    <div class="settings-container">
      <!-- Sidebar -->
      <div class="settings-sidebar">
        <nav class="settings-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['nav-item', { active: activeTab === tab.id }]"
          >
            <Icon :icon="tab.icon" class="nav-icon" />
            <span class="nav-label">{{ tab.label }}</span>
          </button>
        </nav>
      </div>

      <!-- Content -->
      <div class="settings-content">
        <!-- Appearance Tab -->
        <div v-if="activeTab === 'appearance'" class="settings-section">
          <h2 class="section-title">Appearance</h2>
          
          <!-- Theme Selection -->
          <div class="setting-group">
            <h3 class="setting-title">Theme</h3>
            <div class="theme-grid">
              <button
                v-for="theme in themeStore.allThemes"
                :key="theme.name"
                @click="themeStore.setTheme(theme.name.toLowerCase())"
                :class="['theme-option', { active: themeStore.currentTheme === theme.name.toLowerCase() }]"
                :style="{ '--theme-primary': theme.primary, '--theme-secondary': theme.secondary }"
              >
                <div class="theme-preview">
                  <div class="preview-header" :style="{ backgroundColor: theme.primary }"></div>
                  <div class="preview-content" :style="{ backgroundColor: theme.surface }"></div>
                </div>
                <span class="theme-name">{{ theme.name }}</span>
              </button>
            </div>
          </div>

          <!-- Background Selection -->
          <div class="setting-group">
            <h3 class="setting-title">Background</h3>
            <div class="background-grid">
              <button
                v-for="background in themeStore.allBackgrounds"
                :key="background.name"
                @click="themeStore.setBackground(background.name)"
                :class="['background-option', { active: themeStore.currentBackground === background.name }]"
                :style="{ background: background.preview }"
              >
                <div class="background-preview"></div>
                <span class="background-name">{{ background.name }}</span>
                <button
                  v-if="background.name.startsWith('Custom')"
                  @click.stop="removeCustomBackground(background.name)"
                  class="remove-background"
                >
                  <Icon icon="lucide:x" class="remove-icon" />
                </button>
              </button>
            </div>
          </div>

          <!-- Custom Background Upload -->
          <div class="setting-group">
            <h3 class="setting-title">Custom Background</h3>
            <div class="custom-background">
              <button @click="showImageUpload = !showImageUpload" class="upload-btn">
                <Icon icon="lucide:upload" class="upload-icon" />
                Upload Custom Background
              </button>
              
              <div v-if="showImageUpload" class="upload-form">
                <input
                  type="file"
                  accept="image/*"
                  @change="handleImageUpload"
                  class="file-input"
                  id="background-upload"
                />
                <label for="background-upload" class="file-label">
                  <Icon icon="lucide:image" class="file-icon" />
                  Choose Image
                </label>
                
                <input
                  v-model="newCustomBackground.name"
                  placeholder="Background name"
                  class="name-input"
                />
                
                <div class="upload-actions">
                  <button @click="addCustomBackground" class="add-btn" :disabled="!newCustomBackground.name || !newCustomBackground.value">
                    Add Background
                  </button>
                  <button @click="showImageUpload = false" class="cancel-btn">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Account Tab -->
        <div v-if="activeTab === 'account'" class="settings-section">
          <h2 class="section-title">Account</h2>
          
          <div class="setting-group">
            <h3 class="setting-title">Profile Information</h3>
            <div class="profile-info">
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ user?.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">{{ userMetadata.full_name || 'Not set' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Member Since</span>
                <span class="info-value">{{ new Date(user?.created_at || '').toLocaleDateString() }}</span>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <h3 class="setting-title">Account Actions</h3>
            <div class="action-buttons">
              <button @click="authStore.signOut()" class="action-btn danger">
                <Icon icon="lucide:log-out" class="btn-icon" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <!-- Notifications Tab -->
        <div v-if="activeTab === 'notifications'" class="settings-section">
          <h2 class="section-title">Notifications</h2>
          
          <div class="setting-group">
            <h3 class="setting-title">Focus Timer</h3>
            <div class="toggle-group">
              <label class="toggle-item">
                <input type="checkbox" class="toggle-input" checked />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Session complete notifications</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" class="toggle-input" checked />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Break reminders</span>
              </label>
            </div>
          </div>

          <div class="setting-group">
            <h3 class="setting-title">Goals</h3>
            <div class="toggle-group">
              <label class="toggle-item">
                <input type="checkbox" class="toggle-input" checked />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Goal deadline reminders</span>
              </label>
              <label class="toggle-item">
                <input type="checkbox" class="toggle-input" />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Daily progress updates</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Data Tab -->
        <div v-if="activeTab === 'data'" class="settings-section">
          <h2 class="section-title">Data Management</h2>
          
          <div class="setting-group">
            <h3 class="setting-title">Export Data</h3>
            <p class="setting-description">
              Download a copy of your data including tasks, goals, streaks, and settings.
            </p>
            <button @click="exportData" class="action-btn">
              <Icon icon="lucide:download" class="btn-icon" />
              Export Data
            </button>
          </div>

          <div class="setting-group">
            <h3 class="setting-title">Clear Data</h3>
            <p class="setting-description">
              Permanently delete all your data. This action cannot be undone.
            </p>
            <button @click="clearData" class="action-btn danger">
              <Icon icon="lucide:trash-2" class="btn-icon" />
              Clear All Data
            </button>
          </div>
        </div>

        <!-- About Tab -->
        <div v-if="activeTab === 'about'" class="settings-section">
          <h2 class="section-title">About Dreamer</h2>
          
          <div class="about-content">
            <div class="app-info">
              <div class="app-logo">
                <Icon icon="lucide:zap" class="logo-icon" />
              </div>
              <div class="app-details">
                <h3 class="app-name">Dreamer</h3>
                <p class="app-version">Version 1.0.0</p>
                <p class="app-description">
                  A productivity OS for Students, Athletes, Professionals, and Dreamers.
                </p>
              </div>
            </div>

            <div class="feature-list">
              <h4 class="feature-title">Features</h4>
              <ul class="features">
                <li><Icon icon="lucide:check" class="feature-icon" />Task & Routine Management</li>
                <li><Icon icon="lucide:check" class="feature-icon" />Focus Timer (Pomodoro)</li>
                <li><Icon icon="lucide:check" class="feature-icon" />Streak Tracking & Heatmaps</li>
                <li><Icon icon="lucide:check" class="feature-icon" />Journaling & Reflection</li>
                <li><Icon icon="lucide:check" class="feature-icon" />Custom Goals & Milestones</li>
                <li><Icon icon="lucide:check" class="feature-icon" />Theme Customization</li>
              </ul>
            </div>

            <div class="links">
              <a href="#" class="link">
                <Icon icon="lucide:github" class="link-icon" />
                GitHub
              </a>
              <a href="#" class="link">
                <Icon icon="lucide:mail" class="link-icon" />
                Support
              </a>
              <a href="#" class="link">
                <Icon icon="lucide:file-text" class="link-icon" />
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.settings-header {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), transparent 90%), color-mix(in oklab, var(--color-secondary), transparent 90%));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(2px);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 2rem;
  color: var(--color-primary, #8b5cf6);
}

.page-subtitle {
  font-size: 1.1rem;
  color: var(--color-text-secondary, #cbd5e1);
  margin: 0;
  opacity: 0.9;
}

/* Container */
.settings-container {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}

/* Sidebar */
.settings-sidebar {
  background: color-mix(in oklab, var(--color-surface), transparent 20%);
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(2px);
  height: fit-content;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--color-text-secondary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-weight: 500;
}

.nav-item:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  color: var(--color-text, #e2e8f0);
}

.nav-item.active {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), transparent 80%), color-mix(in oklab, var(--color-secondary), transparent 80%));
  color: var(--color-text, #fff);
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.3));
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  flex-shrink: 0;
}

.nav-label {
  font-weight: 600;
}

/* Content */
.settings-content {
  background: color-mix(in oklab, var(--color-surface), transparent 20%);
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(2px);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text, #fff);
  margin: 0;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #e2e8f0);
  margin: 0;
}

.setting-description {
  font-size: 0.9rem;
  color: var(--color-text-secondary, #94a3b8);
  margin: 0;
}

/* Theme Grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  border-color: color-mix(in oklab, var(--color-primary), transparent 60%);
  transform: translateY(-2px);
}

.theme-option.active {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px color-mix(in oklab, var(--color-primary), transparent 80%);
}

.theme-preview {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
}

.preview-header {
  height: 12px;
  background: var(--theme-primary);
}

.preview-content {
  height: 28px;
  background: var(--theme-secondary);
  opacity: 0.8;
}

.theme-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #e2e8f0);
}

/* Background Grid */
.background-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.background-option {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
}

.background-option:hover {
  border-color: color-mix(in oklab, var(--color-primary), transparent 60%);
  transform: translateY(-2px);
}

.background-option.active {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px color-mix(in oklab, var(--color-primary), transparent 80%);
}

.background-preview {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
}

.background-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text, #e2e8f0);
}

.remove-background {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: color-mix(in oklab, #ef4444, transparent 20%);
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.background-option:hover .remove-background {
  opacity: 1;
}

.remove-icon {
  font-size: 12px;
}

/* Custom Background */
.custom-background {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  border: 1px solid color-mix(in oklab, var(--color-primary), transparent 60%);
  border-radius: 10px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.upload-btn:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 80%);
  border-color: color-mix(in oklab, var(--color-primary), transparent 40%);
}

.upload-icon {
  font-size: 16px;
}

.upload-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  backdrop-filter: blur(2px);
}

.file-input {
  display: none;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  border: 1px solid color-mix(in oklab, var(--color-primary), transparent 60%);
  border-radius: 8px;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.file-label:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 80%);
}

.file-icon {
  font-size: 16px;
}

.name-input {
  padding: 12px 16px;
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 8px;
  color: var(--color-text, #e2e8f0);
  font-size: 14px;
}

.name-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary), transparent 85%);
}

.upload-actions {
  display: flex;
  gap: 12px;
}

.add-btn, .cancel-btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.add-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
}

.add-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), #000 10%), color-mix(in oklab, var(--color-secondary), #000 10%));
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.3));
  color: var(--color-text, #e2e8f0);
}

.cancel-btn:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
}

/* Profile Info */
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid color-mix(in oklab, var(--color-primary), transparent 90%);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary, #94a3b8);
  font-weight: 500;
}

.info-value {
  font-size: 0.9rem;
  color: var(--color-text, #e2e8f0);
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 14px;
}

.action-btn:not(.danger) {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
}

.action-btn.danger {
  background: color-mix(in oklab, #ef4444, transparent 90%);
  border: 1px solid color-mix(in oklab, #ef4444, transparent 70%);
  color: #fca5a5;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px color-mix(in oklab, var(--color-primary), transparent 80%);
}

.action-btn.danger:hover {
  background: color-mix(in oklab, #ef4444, transparent 80%);
  border-color: color-mix(in oklab, #ef4444, transparent 60%);
}

.btn-icon {
  font-size: 16px;
}

/* Toggle Group */
.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background: color-mix(in oklab, var(--color-primary), transparent 80%);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toggle-input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-label {
  font-size: 0.9rem;
  color: var(--color-text, #e2e8f0);
  font-weight: 500;
}

/* About Content */
.about-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.app-info {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  backdrop-filter: blur(2px);
}

.app-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 16px;
  color: #fff;
}

.logo-icon {
  font-size: 24px;
}

.app-details {
  flex: 1;
}

.app-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #fff);
  margin-bottom: 4px;
}

.app-version {
  font-size: 0.9rem;
  color: var(--color-primary);
  margin-bottom: 8px;
}

.app-description {
  font-size: 1rem;
  color: var(--color-text-secondary, #94a3b8);
  margin: 0;
}

.feature-list {
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 12px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text, #e2e8f0);
  margin-bottom: 16px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.features li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--color-text, #e2e8f0);
}

.feature-icon {
  font-size: 16px;
  color: #10b981;
  flex-shrink: 0;
}

.links {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 8px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.link:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 80%);
  border-color: color-mix(in oklab, var(--color-primary), transparent 60%);
  transform: translateY(-1px);
}

.link-icon {
  font-size: 16px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .settings-sidebar {
    order: 2;
  }
  
  .settings-nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
  }
  
  .nav-item {
    white-space: nowrap;
    min-width: fit-content;
  }
  
  .theme-grid,
  .background-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .app-info {
    flex-direction: column;
    text-align: center;
  }
  
  .links {
    justify-content: center;
  }
}
</style>