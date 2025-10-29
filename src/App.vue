<script setup lang="ts">
import { onMounted, ref } from 'vue'
import LoadingScreen from './components/LoadingScreen.vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import AuthModal from './components/AuthModal.vue'
import AppShell from './components/AppShell.vue'

const isLoading = ref(true)
const hasError = ref(false)
const authStore = useAuthStore()
const themeStore = useThemeStore()
const authModal = ref<InstanceType<typeof AuthModal> | null>(null)

onMounted(async () => {
  try {
    themeStore.initializeTheme()
    await authStore.initializeAuth()
    await authStore.restoreSession()
  } catch (error) {
    console.error(error)
    hasError.value = true
  } finally {
    setTimeout(() => { isLoading.value = false }, 300)
  }
})
</script>

<template>
  <LoadingScreen v-if="isLoading" />
  <div v-else>
    <AppShell>
      <RouterView />
    </AppShell>
    <AuthModal ref="authModal" />
  </div>
</template>

<style scoped>
</style>
