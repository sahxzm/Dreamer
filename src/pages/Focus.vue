<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'

// Timer state
const isRunning = ref(false)
const isPaused = ref(false)
const timeLeft = ref(25 * 60) // 25 minutes in seconds
const totalTime = ref(25 * 60)
const timerType = ref<'work' | 'break' | 'longBreak'>('work')

// Timer intervals
let timerInterval: NodeJS.Timeout | null = null

// Timer configurations
const timerConfigs = {
  work: 25 * 60,      // 25 minutes
  break: 5 * 60,      // 5 minutes
  longBreak: 15 * 60  // 15 minutes
}

// Computed properties
const formattedTime = computed(() => {
  const hours = Math.floor(timeLeft.value / 3600)
  const minutes = Math.floor((timeLeft.value % 3600) / 60)
  const seconds = timeLeft.value % 60
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const progressPercentage = computed(() => {
  return ((totalTime.value - timeLeft.value) / totalTime.value) * 100
})

const timerLabel = computed(() => {
  switch (timerType.value) {
    case 'work': return 'Focus Time'
    case 'break': return 'Short Break'
    case 'longBreak': return 'Long Break'
    default: return 'Focus Time'
  }
})

// Timer functions
const startTimer = () => {
  if (!isRunning.value) {
    isRunning.value = true
    isPaused.value = false
    timerInterval = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        completeTimer()
      }
    }, 1000)
  }
}

const pauseTimer = () => {
  if (isRunning.value) {
    isRunning.value = false
    isPaused.value = true
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }
}

const resetTimer = () => {
  isRunning.value = false
  isPaused.value = false
  timeLeft.value = totalTime.value
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

const completeTimer = () => {
  isRunning.value = false
  isPaused.value = false
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  
  // Play completion sound
  playCompletionSound()
  
  // Auto-advance to next timer type
  advanceTimer()
}

const advanceTimer = () => {
  if (timerType.value === 'work') {
    timerType.value = 'break'
    totalTime.value = timerConfigs.break
  } else {
    timerType.value = 'work'
    totalTime.value = timerConfigs.work
  }
  timeLeft.value = totalTime.value
}

const playCompletionSound = () => {
  // Create audio context for notification sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.log('Audio not supported')
  }
}

const setTimerType = (type: 'work' | 'break' | 'longBreak') => {
  timerType.value = type
  totalTime.value = timerConfigs[type]
  timeLeft.value = totalTime.value
  resetTimer()
}

// Cleanup on unmount
onMounted(() => {
  // Initialize timer
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<template>
  <div class="focus-timer">
    <!-- Header -->
    <div class="timer-header">
      <h1 class="timer-title">
        <Icon icon="lucide:clock" class="title-icon" />
        Pomodoro Timer
      </h1>
      <div class="current-date">
        {{ new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) }}
      </div>
    </div>

    <!-- Timer Display -->
    <div class="timer-display">
      <div class="timer-circle">
        <div class="timer-progress" :style="{ '--progress': `${progressPercentage}%` }"></div>
        <div class="timer-time">{{ formattedTime }}</div>
        <div class="timer-label">{{ timerLabel }}</div>
      </div>
    </div>

    <!-- Timer Controls -->
    <div class="timer-controls">
      <button 
        v-if="!isRunning" 
        @click="startTimer"
        class="control-btn start-btn"
      >
        <Icon icon="lucide:play" class="btn-icon" />
        START
      </button>
      
      <button 
        v-if="isRunning" 
        @click="pauseTimer"
        class="control-btn pause-btn"
      >
        <Icon icon="lucide:pause" class="btn-icon" />
        PAUSE
      </button>
      
      <button 
        @click="resetTimer"
        class="control-btn reset-btn"
      >
        <Icon icon="lucide:rotate-ccw" class="btn-icon" />
        RESET
      </button>
    </div>

    <!-- Timer Type Selector -->
    <div class="timer-types">
      <button 
        @click="setTimerType('work')"
        :class="['type-btn', { active: timerType === 'work' }]"
      >
        <Icon icon="lucide:brain" class="type-icon" />
        <span>Focus</span>
        <span class="type-duration">25m</span>
      </button>
      
      <button 
        @click="setTimerType('break')"
        :class="['type-btn', { active: timerType === 'break' }]"
      >
        <Icon icon="lucide:coffee" class="type-icon" />
        <span>Break</span>
        <span class="type-duration">5m</span>
      </button>
      
      <button 
        @click="setTimerType('longBreak')"
        :class="['type-btn', { active: timerType === 'longBreak' }]"
      >
        <Icon icon="lucide:zap" class="type-icon" />
        <span>Long Break</span>
        <span class="type-duration">15m</span>
      </button>
    </div>

    <!-- Timer Stats -->
    <div class="timer-stats">
      <div class="stat-item">
        <Icon icon="lucide:target" class="stat-icon" />
        <div class="stat-content">
          <div class="stat-number">4</div>
          <div class="stat-label">Sessions Today</div>
        </div>
      </div>
      
      <div class="stat-item">
        <Icon icon="lucide:clock" class="stat-icon" />
        <div class="stat-content">
          <div class="stat-number">2h 15m</div>
          <div class="stat-label">Total Focus</div>
        </div>
      </div>
      
      <div class="stat-item">
        <Icon icon="lucide:flame" class="stat-icon" />
        <div class="stat-content">
          <div class="stat-number">7</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.focus-timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
.timer-header {
  text-align: center;
  width: 100%;
}

.timer-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-icon {
  font-size: 2rem;
  color: #8b5cf6;
}

.current-date {
  font-size: 1.1rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Timer Display */
.timer-display {
  position: relative;
  width: 300px;
  height: 300px;
}

.timer-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(15, 15, 25, 0.8);
  border: 3px solid rgba(139, 92, 246, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  backdrop-filter: blur(2px);
  box-shadow: 
    0 0 0 1px rgba(139, 92, 246, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.timer-progress {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #8b5cf6 0deg,
    #a855f7 calc(var(--progress) * 3.6deg),
    rgba(139, 92, 246, 0.1) calc(var(--progress) * 3.6deg),
    rgba(139, 92, 246, 0.1) 360deg
  );
  z-index: -1;
  transition: all 0.3s ease;
}

.timer-time {
  font-size: 3.5rem;
  font-weight: 700;
  color: #fff;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
  line-height: 1;
  margin-bottom: 8px;
}

.timer-label {
  font-size: 1.1rem;
  color: #8b5cf6;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Timer Controls */
.timer-controls {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
  min-width: 140px;
  justify-content: center;
}

.start-btn {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.start-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.pause-btn {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff;
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.pause-btn:hover {
  background: linear-gradient(135deg, #d97706, #ea580c);
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.5);
  transform: translateY(-2px);
}

.reset-btn {
  background: rgba(15, 15, 25, 0.8);
  border: 2px solid rgba(139, 92, 246, 0.3);
  color: #e2e8f0;
}

.reset-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.btn-icon {
  font-size: 18px;
}

/* Timer Type Selector */
.timer-types {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 24px;
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);
  min-width: 120px;
}

.type-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
  color: #e2e8f0;
  transform: translateY(-2px);
}

.type-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.5);
  color: #fff;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.type-icon {
  font-size: 24px;
  color: #8b5cf6;
}

.type-btn.active .type-icon {
  color: #fff;
}

.type-duration {
  font-size: 0.9rem;
  font-weight: 600;
  color: #8b5cf6;
}

.type-btn.active .type-duration {
  color: #fff;
}

/* Timer Stats */
.timer-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 600px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(2px);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(15, 15, 25, 0.8);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.stat-icon {
  font-size: 20px;
  color: #8b5cf6;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 768px) {
  .focus-timer {
    gap: 32px;
    padding: 16px;
  }
  
  .timer-title {
    font-size: 2rem;
  }
  
  .timer-display {
    width: 250px;
    height: 250px;
  }
  
  .timer-time {
    font-size: 2.8rem;
  }
  
  .timer-controls {
    gap: 12px;
  }
  
  .control-btn {
    padding: 12px 24px;
    font-size: 14px;
    min-width: 120px;
  }
  
  .timer-types {
    gap: 12px;
  }
  
  .type-btn {
    padding: 16px 20px;
    min-width: 100px;
  }
  
  .timer-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .timer-display {
    width: 200px;
    height: 200px;
  }
  
  .timer-time {
    font-size: 2.2rem;
  }
  
  .timer-controls {
    flex-direction: column;
    width: 100%;
  }
  
  .control-btn {
    width: 100%;
  }
}
</style>
