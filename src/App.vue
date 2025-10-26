<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import AuthModal from './components/AuthModal.vue'
import UserProfile from './components/UserProfile.vue'

const route = useRoute()
const authStore = useAuthStore()

// Auth modal ref
const authModal = ref<InstanceType<typeof AuthModal> | null>(null)
const userProfile = ref<InstanceType<typeof UserProfile> | null>(null)

// Initialize auth on mount
onMounted(async () => {
  await authStore.initializeAuth()
  await authStore.restoreSession()
})

// Auth actions
const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
  authModal.value?.openModal(mode)
}

const openUserProfile = () => {
  userProfile.value?.openProfile()
}

const navItems = [
  { path: '/', label: 'DASH', icon: 'lucide:layout-dashboard' },
  { path: '/tasks', label: 'TASKS', icon: 'lucide:clipboard-list' },
  { path: '/routines', label: 'ROUTINES', icon: 'lucide:refresh-cw' },
  { path: '/focus', label: 'FOCUS', icon: 'lucide:clock' },
  { path: '/journal', label: 'JOURNAL', icon: 'lucide:book-open' },
  { path: '/goals', label: 'GOALS', icon: 'lucide:target' },
  { path: '/bookmarks', label: 'BOOKMARKS', icon: 'lucide:link' },
  { path: '/settings', label: 'SETTINGS', icon: 'lucide:settings' }
]
</script>

<template>
  <div class="app-shell">
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
  color: #e5e7eb;
  background: #0f0f17;
}

.sidebar {
  background: rgba(15, 15, 25, 0.9);
  border-right: 1px solid rgba(139, 92, 246, 0.2);
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
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.logo-icon {
  font-size: 24px;
  color: #a855f7;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
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
  color: #94a3b8;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  position: relative;
}

.nav-item:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #e2e8f0;
  transform: translateX(2px);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  color: #fff;
  border: 1px solid rgba(139, 92, 246, 0.3);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(180deg, #a855f7, #8b5cf6);
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
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #e2e8f0;
}

.auth-btn.signin:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-1px);
}

.auth-btn.signup {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.auth-btn.signup:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
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
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: rgba(139, 92, 246, 0.2);
  color: #e2e8f0;
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
