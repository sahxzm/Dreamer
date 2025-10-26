<template>
  <div style="padding: 20px; color: white; background: #0f0f17; min-height: 100vh;">
    <h1>🎉 App is Working!</h1>
    <p>If you can see this, the Vue app is loading correctly.</p>
    <p>Current time: {{ new Date().toLocaleString() }}</p>
  </div>
</template>

<script setup lang="ts">
console.log('Test component loaded successfully!')
</script>
