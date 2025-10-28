<template>
  <div class="simple-app">
    <div class="header">
      <h1>🚀 Dreamer</h1>
      <p>Productivity OS for Students, Athletes, Professionals, and Dreamers</p>
    </div>
    
    <div class="content">
      <div class="card">
        <h2>✨ Core Features</h2>
        <ul>
          <li>✅ Task + Routine Manager</li>
          <li>✅ Focus Timer (Pomodoro)</li>
          <li>✅ Streak Heatmaps</li>
          <li>✅ Journaling + Reflection</li>
          <li>✅ Custom Goals</li>
        </ul>
      </div>
      
      <div class="card">
        <h2>🎨 Themes & Customization</h2>
        <p>Choose from multiple themes and upload custom backgrounds</p>
      </div>
      
      <div class="card">
        <h2>🔐 Authentication</h2>
        <p>Sign in with email or OAuth providers</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simple-app {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f17, #1a0b2e);
  color: #e2e8f0;
  padding: 40px;
  font-family: 'Inter', system-ui, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 3rem;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
}

.header p {
  font-size: 1.2rem;
  color: #94a3b8;
  margin: 0;
}

.content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
}

.card h2 {
  color: #8b5cf6;
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.card p {
  color: #94a3b8;
  line-height: 1.6;
  margin: 0;
}

.card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.card li {
  color: #e2e8f0;
  padding: 8px 0;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.card li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .simple-app {
    padding: 20px;
  }
  
  .header h1 {
    font-size: 2rem;
  }
  
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
