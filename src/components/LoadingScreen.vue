<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<template>
  <div class="loading-screen">
    <div class="loading-content">
      <div class="loading-logo">
        <Icon icon="lucide:zap" class="logo-icon" />
        <span class="logo-text">Dreamer</span>
      </div>
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
      <p class="loading-text">Loading your productivity hub...</p>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
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

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;
}

.loading-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(20px);
}

.logo-icon {
  font-size: 32px;
  color: var(--color-primary, #8b5cf6);
}

.logo-text {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-secondary, #a855f7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top: 3px solid var(--color-primary, #8b5cf6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 16px;
  color: var(--color-text-secondary, #94a3b8);
  margin: 0;
  font-weight: 500;
}
</style>
