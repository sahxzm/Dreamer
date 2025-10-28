<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import AuthModal from './components/AuthModal.vue'
import UserProfile from './components/UserProfile.vue'
import LoadingScreen from './components/LoadingScreen.vue'

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

// State
const isLoading = ref(true)
const hasError = ref(false)

// Auth modal ref
const authModal = ref<InstanceType<typeof AuthModal> | null>(null)
const userProfile = ref<InstanceType<typeof UserProfile> | null>(null)

// Initialize app on mount
onMounted(async () => {
  console.log('App mounting...')
  try {
    console.log('Initializing theme...')
    themeStore.initializeTheme()
    
    console.log('Initializing auth...')
    await authStore.initializeAuth()
    await authStore.restoreSession()
    
    console.log('App initialized successfully')
  } catch (error) {
    console.error('Error initializing app:', error)
    hasError.value = true
  } finally {
    // Remove loading screen after a short delay
    setTimeout(() => {
      console.log('Hiding loading screen...')
      isLoading.value = false
    }, 1000)
    
    // Fallback: always show app after 3 seconds
    setTimeout(() => {
      if (isLoading.value) {
        console.log('Fallback: forcing app to show')
        isLoading.value = false
        hasError.value = false
      }
    }, 3000)
  }
})

// Auth actions
const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
  authModal.value?.openModal(mode)
}

const reloadPage = () => {
  window.location.reload()
}

// const openUserProfile = () => {
//   userProfile.value?.openProfile()
// }

const navItems = [
  { path: '/', label: 'DASH', icon: 'lucide:layout-dashboard' },
  { path: '/tasks', label: 'TASKS', icon: 'lucide:clipboard-list' },
  { path: '/routines', label: 'ROUTINES', icon: 'lucide:refresh-cw' },
  { path: '/focus', label: 'FOCUS', icon: 'lucide:clock' },
  { path: '/journal', label: 'JOURNAL', icon: 'lucide:book-open' },
  { path: '/goals', label: 'GOALS', icon: 'lucide:target' },
  { path: '/streaks', label: 'STREAKS', icon: 'lucide:flame' },
  { path: '/bookmarks', label: 'BOOKMARKS', icon: 'lucide:link' },
  { path: '/settings', label: 'SETTINGS', icon: 'lucide:settings' }
]
</script>

<template>
  <!-- Loading Screen -->
  <LoadingScreen v-if="isLoading" />
  
  <!-- Error Screen -->
  <div v-else-if="hasError" class="error-screen">
    <div class="error-content">
      <Icon icon="lucide:alert-circle" class="error-icon" />
      <h2 class="error-title">Something went wrong</h2>
      <p class="error-message">Please refresh the page to try again.</p>
      <button @click="reloadPage" class="retry-btn">
        <Icon icon="lucide:refresh-cw" class="btn-icon" />
        Refresh Page
      </button>
    </div>
  </div>
  
  <!-- Main App -->
  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <Icon icon="lucide:zap" class="logo-icon" />
          <span class="logo-text">Dreamer</span>
        </div>
      </div>
      
      <nav class="nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: route.path === item.path }]"
        >
          <Icon :icon="item.icon" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <!-- Auth Section -->
        <div v-if="!authStore.isAuthenticated" class="auth-section">
          <button @click="openAuthModal('signin')" class="auth-btn signin">
            <Icon icon="lucide:log-in" class="auth-icon" />
            Sign In
          </button>
          <button @click="openAuthModal('signup')" class="auth-btn signup">
            <Icon icon="lucide:user-plus" class="auth-icon" />
            Sign Up
          </button>
        </div>
        
        <!-- User Profile -->
        <div v-else class="user-section">
          <UserProfile ref="userProfile" />
        </div>
        
        <!-- Footer Actions -->
        <div class="footer-actions">
          <button class="footer-btn">
            <Icon icon="lucide:lightbulb" class="footer-icon" />
          </button>
          <button class="footer-btn">
            <Icon icon="lucide:mail" class="footer-icon" />
          </button>
        </div>
      </div>
    </aside>
    
    <main class="content">
      <RouterView />
    </main>
    
    <!-- Auth Modal -->
    <AuthModal ref="authModal" />
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
  color: var(--color-text, #e5e7eb);
  background: transparent;
}

.sidebar {
  background: var(--color-surface, rgba(15, 15, 25, 0.9));
  border-right: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), transparent 90%), color-mix(in oklab, var(--color-secondary), transparent 90%));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
}

.logo-icon {
  font-size: 24px;
  color: var(--color-secondary, #a855f7);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text, #fff);
  letter-spacing: -0.5px;
}

.nav {
  flex: 1;
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
  color: var(--color-text-secondary, #94a3b8);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  color: var(--color-text, #e2e8f0);
  transform: translateX(2px);
}

.nav-item.active {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), transparent 80%), color-mix(in oklab, var(--color-secondary), transparent 80%));
  color: var(--color-text, #fff);
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.3));
  box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary), transparent 80%);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, var(--color-secondary), var(--color-primary));
  border-radius: 0 2px 2px 0;
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  font-weight: 600;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
  padding-top: 20px;
}

.auth-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  justify-content: center;
}

.auth-btn.signin {
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.3));
  color: var(--color-text, #e2e8f0);
}

.auth-btn.signin:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  border-color: color-mix(in oklab, var(--color-primary), transparent 60%);
  transform: translateY(-1px);
}

.auth-btn.signup {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
  box-shadow: 0 4px 12px color-mix(in oklab, var(--color-primary), transparent 70%);
}

.auth-btn.signup:hover {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), #000 10%), color-mix(in oklab, var(--color-secondary), #000 10%));
  box-shadow: 0 6px 16px color-mix(in oklab, var(--color-primary), transparent 60%);
  transform: translateY(-1px);
}

.auth-icon {
  font-size: 16px;
}

.user-section {
  margin-bottom: 8px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.footer-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: color-mix(in oklab, var(--color-primary), transparent 90%);
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  color: var(--color-text-secondary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: color-mix(in oklab, var(--color-primary), transparent 80%);
  color: var(--color-text, #e2e8f0);
  transform: translateY(-1px);
}

.footer-icon {
  font-size: 16px;
}

.content {
  padding: 32px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
}

/* Error Screen */
.error-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-background, #0f0f17);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
  padding: 40px;
  background: var(--color-surface, rgba(15, 15, 25, 0.8));
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(2px);
}

.error-icon {
  font-size: 48px;
  color: #ef4444;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text, #fff);
  margin: 0;
}

.error-message {
  font-size: 1rem;
  color: var(--color-text-secondary, #94a3b8);
  margin: 0;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: linear-gradient(135deg, color-mix(in oklab, var(--color-primary), #000 10%), color-mix(in oklab, var(--color-secondary), #000 10%));
  transform: translateY(-1px);
  box-shadow: 0 4px 16px color-mix(in oklab, var(--color-primary), transparent 70%);
}

.btn-icon {
  font-size: 16px;
}

/* Responsive design */
@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  
  .sidebar {
    padding: 16px;
  }
  
  .nav {
    flex-direction: row;
    overflow-x: auto;
    gap: 8px;
  }
  
  .nav-item {
    white-space: nowrap;
    min-width: fit-content;
  }
  
  .sidebar-footer {
    display: none;
  }
}
</style>
