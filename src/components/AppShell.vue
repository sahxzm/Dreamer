<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '@/stores/auth'
import AuthModal from '@/components/AuthModal.vue'
import UserProfile from '@/components/UserProfile.vue'

const route = useRoute()
const authStore = useAuthStore()

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'lucide:layout-dashboard' },
  { path: '/tasks', label: 'Tasks', icon: 'lucide:check-square' },
  { path: '/routines', label: 'Routines', icon: 'lucide:repeat' },
  { path: '/focus', label: 'Focus', icon: 'lucide:timer' },
  { path: '/journal', label: 'Journal', icon: 'lucide:book' },
  { path: '/goals', label: 'Goals', icon: 'lucide:target' },
  { path: '/streaks', label: 'Streaks', icon: 'lucide:sparkles' },
  { path: '/bookmarks', label: 'Bookmarks', icon: 'lucide:bookmark' },
]

const currentLabel = computed(() => navItems.find(n => n.path === route.path)?.label || 'Settings')

// Refs to modals
const authModal = ref<InstanceType<typeof AuthModal> | null>(null)
const profileModal = ref<InstanceType<typeof UserProfile> | null>(null)

const openSignIn = () => authModal.value?.openModal('signin')
const openProfile = () => profileModal.value?.openProfile()
</script>

<template>
  <div class="group/sidebar-wrapper flex min-h-screen w-full">
    <!-- Sidebar -->
    <aside class="hidden md:block text-sidebar-foreground" data-state="expanded">
      <div class="relative h-screen w-64">
        <div class="fixed inset-y-0 left-0 z-10 hidden h-screen w-64 md:flex">
          <div class="flex h-full w-full flex-col bg-sidebar border-r border-sidebar-border">
            <div class="flex items-center gap-2 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-8 w-8 text-primary" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2.5-11.5L12 11l2.5-2.5L17 11l-5 5-5-5 2.5-2.5z" />
              </svg>
              <h1 class="font-headline text-xl font-semibold">Dreamer</h1>
            </div>
            <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2">
              <ul class="flex w-full min-w-0 flex-col gap-1">
                <li v-for="item in navItems" :key="item.path" class="group/menu-item relative">
                  <RouterLink :to="item.path" class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground" :data-active="route.path === item.path">
                    <Icon :icon="item.icon" class="h-4 w-4" />
                    <span>{{ item.label }}</span>
                  </RouterLink>
                </li>
              </ul>
            </div>
            <div class="p-2 border-t border-sidebar-border">
              <div class="mb-2">
                <button
                  v-if="authStore.isAuthenticated"
                  @click="authStore.signOut()"
                  class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon icon="lucide:log-out" class="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
                <button
                  v-else
                  @click="openSignIn()"
                  class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <Icon icon="lucide:log-in" class="h-4 w-4" />
                  <span>Sign In</span>
                </button>
              </div>
              <RouterLink to="/settings" class="flex h-8 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" :data-active="route.path === '/settings'">
                <Icon icon="lucide:settings" class="h-4 w-4" />
                <span>Settings</span>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Inset content area -->
    <main class="relative flex min-h-screen flex-1 flex-col bg-transparent">
      <header class="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div class="flex-1">
          <h1 class="font-headline text-lg font-semibold">{{ currentLabel }}</h1>
        </div>
        <button
          v-if="authStore.isAuthenticated"
          @click="openProfile()"
          class="overflow-hidden rounded-full border border-border size-9 grid place-items-center"
          title="Profile"
        >
          <Icon icon="lucide:user" class="h-5 w-5" />
        </button>
        <button
          v-else
          @click="openSignIn()"
          class="overflow-hidden rounded-full border border-border size-9 grid place-items-center"
          title="Sign in"
        >
          <Icon icon="lucide:log-in" class="h-5 w-5" />
        </button>
      </header>
      <section class="flex-1">
        <slot />
      </section>
      <!-- Modals mounted at root -->
      <AuthModal ref="authModal" />
      <UserProfile ref="profileModal" :hideTrigger="true" />
    </main>
  </div>
</template>

<style scoped>
</style>


