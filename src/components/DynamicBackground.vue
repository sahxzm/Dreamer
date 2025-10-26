<script setup lang="ts">
// Simplified background component to avoid white screen issues
</script>

<template>
  <div class="dynamic-background">
    <!-- Car background image -->
    <div class="car-background"></div>
    
    <!-- Static Om symbols pattern -->
    <div class="om-pattern"></div>
    
    <!-- Gradient overlays -->
    <div class="gradient-overlay-1"></div>
    <div class="gradient-overlay-2"></div>
  </div>
</template>

<style scoped>
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  overflow: hidden;
}

.car-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3)),
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="car" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23dc2626;stop-opacity:0.8" /><stop offset="100%" style="stop-color:%23b91c1c;stop-opacity:0.6" /></linearGradient></defs><rect x="200" y="300" width="400" height="200" rx="20" fill="url(%23car)" opacity="0.3"/><rect x="180" y="320" width="40" height="160" rx="20" fill="%23dc2626" opacity="0.4"/><rect x="580" y="320" width="40" height="160" rx="20" fill="%23dc2626" opacity="0.4"/><circle cx="220" cy="480" r="30" fill="%23374151" opacity="0.6"/><circle cx="580" cy="480" r="30" fill="%23374151" opacity="0.6"/></svg>');
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  filter: blur(2px);
  transform: scale(1.1);
}

.om-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(139, 92, 246, 0.03) 2px,
      rgba(139, 92, 246, 0.03) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(139, 92, 246, 0.03) 2px,
      rgba(139, 92, 246, 0.03) 4px
    );
  pointer-events: none;
}

.gradient-overlay-1 {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    1200px 800px at 80% 20%, 
    rgba(139, 92, 246, 0.1), 
    transparent
  );
}

.gradient-overlay-2 {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    45deg,
    rgba(139, 92, 246, 0.05),
    transparent
  );
}
</style>
