<template>
  <div class="p-5 text-foreground bg-background min-h-screen">
    <h1>🎉 App is Working!</h1>
    <p>If you can see this, the Vue app is loading correctly.</p>
    <p>Current time: {{ new Date().toLocaleString() }}</p>
  </div>
</template>

<script setup lang="ts">
console.log('Test component loaded successfully!')
</script>
