<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Icon } from '@iconify/vue'

// Journal state
const currentView = ref<'today' | 'all'>('today')
const showNewEntry = ref(false)
const searchQuery = ref('')
const selectedMood = ref('')
const selectedTemplate = ref('')

// New entry form
const newEntry = ref({
  title: '',
  content: '',
  mood: '',
  tags: [] as string[],
  template: '',
  date: new Date().toISOString().split('T')[0]
})

// Mock journal entries
const journalEntries = ref([
  {
    id: 1,
    title: 'Great day at work!',
    content: 'Today I accomplished so much at work. I finished the project proposal and got positive feedback from my manager. Feeling really motivated to keep pushing forward.',
    mood: 'happy',
    tags: ['work', 'achievement', 'motivation'],
    date: '2024-01-15',
    createdAt: '2024-01-15T18:30:00Z'
  },
  {
    id: 2,
    title: 'Reflecting on my goals',
    content: 'I realized I need to be more consistent with my morning routine. The days I follow it, I feel so much more productive and focused.',
    mood: 'thoughtful',
    tags: ['goals', 'routine', 'productivity'],
    date: '2024-01-14',
    createdAt: '2024-01-14T20:15:00Z'
  },
  {
    id: 3,
    title: 'Challenging workout',
    content: 'Pushed myself really hard at the gym today. My legs are sore but I feel strong. Consistency is key - I can see the progress.',
    mood: 'accomplished',
    tags: ['fitness', 'challenge', 'progress'],
    date: '2024-01-13',
    createdAt: '2024-01-13T19:45:00Z'
  },
  {
    id: 4,
    title: 'Learning new skills',
    content: 'Spent 2 hours learning Vue.js today. The concepts are starting to click. I love how it makes building interfaces so intuitive.',
    mood: 'curious',
    tags: ['learning', 'programming', 'growth'],
    date: '2024-01-12',
    createdAt: '2024-01-12T21:00:00Z'
  }
])

// Reflection templates
const reflectionTemplates = ref([
  {
    id: 'daily',
    title: 'Daily Reflection',
    prompts: [
      'What went well today?',
      'What could have gone better?',
      'What did I learn?',
      'How did I feel overall?',
      'What am I grateful for?'
    ]
  },
  {
    id: 'weekly',
    title: 'Weekly Review',
    prompts: [
      'What were my biggest wins this week?',
      'What challenges did I face?',
      'How did I grow as a person?',
      'What habits served me well?',
      'What will I focus on next week?'
    ]
  },
  {
    id: 'goal',
    title: 'Goal Progress',
    prompts: [
      'What progress did I make on my goals?',
      'What obstacles am I facing?',
      'How can I overcome these challenges?',
      'What support do I need?',
      'What will I do differently?'
    ]
  },
  {
    id: 'gratitude',
    title: 'Gratitude Practice',
    prompts: [
      'What am I grateful for today?',
      'Who made a positive impact on my day?',
      'What small moments brought me joy?',
      'How did I contribute to others?',
      'What abundance do I see in my life?'
    ]
  }
])

// Mood options
const moodOptions = ref([
  { value: 'happy', emoji: '😊', label: 'Happy' },
  { value: 'excited', emoji: '🤩', label: 'Excited' },
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'accomplished', emoji: '💪', label: 'Accomplished' },
  { value: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { value: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { value: 'curious', emoji: '🤓', label: 'Curious' },
  { value: 'motivated', emoji: '🚀', label: 'Motivated' },
  { value: 'tired', emoji: '😴', label: 'Tired' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
  { value: 'frustrated', emoji: '😤', label: 'Frustrated' },
  { value: 'sad', emoji: '😢', label: 'Sad' }
])

// Computed properties
const todayEntries = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return journalEntries.value.filter(entry => entry.date === today)
})

const allEntries = computed(() => {
  return journalEntries.value.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const currentEntries = computed(() => {
  return currentView.value === 'today' ? todayEntries.value : allEntries.value
})

const filteredEntries = computed(() => {
  if (!searchQuery.value) return currentEntries.value
  
  return currentEntries.value.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const journalStats = computed(() => {
  const totalEntries = journalEntries.value.length
  const thisWeek = journalEntries.value.filter(entry => {
    const entryDate = new Date(entry.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return entryDate >= weekAgo
  }).length
  
  const moodCounts = journalEntries.value.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const topMood = Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]
  
  return {
    totalEntries,
    thisWeek,
    topMood: topMood ? topMood[0] : 'none',
    streak: calculateStreak()
  }
})

// Functions
const calculateStreak = () => {
  const entries = journalEntries.value
    .map(entry => entry.date)
    .sort()
    .reverse()
  
  let streak = 0
  const today = new Date()
  
  for (let i = 0; i < entries.length; i++) {
    const entryDate = new Date(entries[i])
    const expectedDate = new Date(today)
    expectedDate.setDate(expectedDate.getDate() - i)
    
    if (entryDate.toDateString() === expectedDate.toDateString()) {
      streak++
    } else {
      break
    }
  }
  
  return streak
}

const startNewEntry = () => {
  showNewEntry.value = true
  newEntry.value = {
    title: '',
    content: '',
    mood: '',
    tags: [],
    template: '',
    date: new Date().toISOString().split('T')[0]
  }
}

const saveEntry = () => {
  if (!newEntry.value.title.trim() || !newEntry.value.content.trim()) return
  
  const entry = {
    id: Date.now(),
    title: newEntry.value.title.trim(),
    content: newEntry.value.content.trim(),
    mood: newEntry.value.mood,
    tags: newEntry.value.tags,
    date: newEntry.value.date,
    createdAt: new Date().toISOString()
  }
  
  journalEntries.value.unshift(entry)
  showNewEntry.value = false
  resetForm()
}

const resetForm = () => {
  newEntry.value = {
    title: '',
    content: '',
    mood: '',
    tags: [],
    template: '',
    date: new Date().toISOString().split('T')[0]
  }
}

const deleteEntry = (entryId: number) => {
  const index = journalEntries.value.findIndex(entry => entry.id === entryId)
  if (index > -1) {
    journalEntries.value.splice(index, 1)
  }
}

const addTag = (tag: string) => {
  if (tag.trim() && !newEntry.value.tags.includes(tag.trim())) {
    newEntry.value.tags.push(tag.trim())
  }
}

const removeTag = (tagToRemove: string) => {
  newEntry.value.tags = newEntry.value.tags.filter(tag => tag !== tagToRemove)
}

const applyTemplate = (templateId: string) => {
  const template = reflectionTemplates.value.find(t => t.id === templateId)
  if (template) {
    newEntry.value.content = template.prompts.map((prompt, index) => 
      `${index + 1}. ${prompt}\n\n`
    ).join('')
    selectedTemplate.value = templateId
  }
}

const getMoodEmoji = (mood: string) => {
  const moodOption = moodOptions.value.find(m => m.value === mood)
  return moodOption ? moodOption.emoji : '😊'
}

const getMoodLabel = (mood: string) => {
  const moodOption = moodOptions.value.find(m => m.value === mood)
  return moodOption ? moodOption.label : 'Unknown'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return formatDate(dateString)
}
</script>

<template>
  <div class="journal-page">
    <!-- Header -->
    <div class="journal-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon icon="lucide:book-open" class="title-icon" />
          Journal & Reflection
        </h1>
        <div class="header-actions">
          <button @click="startNewEntry" class="action-btn primary">
            <Icon icon="lucide:plus" class="btn-icon" />
            New Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:book" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ journalStats.totalEntries }}</div>
          <div class="stat-label">Total Entries</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:calendar" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ journalStats.thisWeek }}</div>
          <div class="stat-label">This Week</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:flame" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ journalStats.streak }}</div>
          <div class="stat-label">Day Streak</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:heart" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ getMoodEmoji(journalStats.topMood) }}</div>
          <div class="stat-label">Top Mood</div>
        </div>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <button 
        @click="currentView = 'today'"
        :class="['toggle-btn', { active: currentView === 'today' }]"
      >
        <Icon icon="lucide:calendar" class="toggle-icon" />
        Today
      </button>
      <button 
        @click="currentView = 'all'"
        :class="['toggle-btn', { active: currentView === 'all' }]"
      >
        <Icon icon="lucide:archive" class="toggle-icon" />
        All Entries
      </button>
    </div>

    <!-- Search -->
    <div class="search-section">
      <div class="search-container">
        <Icon icon="lucide:search" class="search-icon" />
        <input 
          v-model="searchQuery"
          placeholder="Search entries, tags, or content..."
          class="search-input"
        />
      </div>
    </div>

    <!-- New Entry Modal -->
    <div v-if="showNewEntry" class="modal-overlay" @click="showNewEntry = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">New Journal Entry</h2>
          <button @click="showNewEntry = false" class="close-btn">
            <Icon icon="lucide:x" class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Entry Form -->
          <div class="entry-form">
            <input 
              v-model="newEntry.title"
              placeholder="Entry title..."
              class="entry-title"
            />
            
            <!-- Mood Selection -->
            <div class="mood-section">
              <label class="section-label">How are you feeling?</label>
              <div class="mood-grid">
                <button 
                  v-for="mood in moodOptions" 
                  :key="mood.value"
                  @click="newEntry.mood = mood.value"
                  :class="['mood-btn', { active: newEntry.mood === mood.value }]"
                >
                  <span class="mood-emoji">{{ mood.emoji }}</span>
                  <span class="mood-label">{{ mood.label }}</span>
                </button>
              </div>
            </div>

            <!-- Reflection Templates -->
            <div class="template-section">
              <label class="section-label">Reflection Templates</label>
              <div class="template-grid">
                <button 
                  v-for="template in reflectionTemplates" 
                  :key="template.id"
                  @click="applyTemplate(template.id)"
                  :class="['template-btn', { active: selectedTemplate === template.id }]"
                >
                  <Icon icon="lucide:file-text" class="template-icon" />
                  {{ template.title }}
                </button>
              </div>
            </div>

            <!-- Content Editor -->
            <div class="content-section">
              <label class="section-label">Your thoughts</label>
              <textarea 
                v-model="newEntry.content"
                placeholder="Write your thoughts, reflections, or use the templates above..."
                class="entry-content"
                rows="8"
              ></textarea>
            </div>

            <!-- Tags -->
            <div class="tags-section">
              <label class="section-label">Tags (optional)</label>
              <div class="tags-input-container">
                <input 
                  @keyup.enter="addTag($event.target.value); $event.target.value = ''"
                  placeholder="Add a tag and press Enter..."
                  class="tags-input"
                />
                <div class="tags-list">
                  <span 
                    v-for="tag in newEntry.tags" 
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                    <button @click="removeTag(tag)" class="tag-remove">
                      <Icon icon="lucide:x" class="tag-icon" />
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showNewEntry = false" class="cancel-btn">
            Cancel
          </button>
          <button @click="saveEntry" class="save-btn">
            <Icon icon="lucide:save" class="btn-icon" />
            Save Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Journal Entries -->
    <div class="entries-section">
      <h2 class="section-title">
        {{ currentView === 'today' ? 'Today\'s Entries' : 'All Entries' }}
        <span class="entry-count">({{ filteredEntries.length }})</span>
      </h2>
      
      <div class="entries-list">
        <div 
          v-for="entry in filteredEntries" 
          :key="entry.id"
          class="entry-item"
        >
          <div class="entry-header">
            <div class="entry-info">
              <h3 class="entry-title">{{ entry.title }}</h3>
              <div class="entry-meta">
                <span class="entry-date">{{ formatDate(entry.date) }}</span>
                <span class="entry-time">{{ getRelativeTime(entry.createdAt) }}</span>
                <span v-if="entry.mood" class="entry-mood">
                  {{ getMoodEmoji(entry.mood) }} {{ getMoodLabel(entry.mood) }}
                </span>
              </div>
            </div>
            
            <div class="entry-actions">
              <button @click="deleteEntry(entry.id)" class="delete-btn">
                <Icon icon="lucide:trash-2" class="action-icon" />
              </button>
            </div>
          </div>
          
          <div class="entry-content">
            <p class="entry-text">{{ entry.content }}</p>
          </div>
          
          <div v-if="entry.tags.length > 0" class="entry-tags">
            <span 
              v-for="tag in entry.tags" 
              :key="tag"
              class="tag"
            >
              #{{ tag }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredEntries.length === 0" class="empty-state">
        <Icon icon="lucide:book-open" class="empty-icon" />
        <h3 class="empty-title">
          {{ searchQuery ? 'No entries found' : 'No journal entries yet' }}
        </h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Start your journaling journey by writing your first entry.' }}
        </p>
        <button v-if="!searchQuery" @click="startNewEntry" class="empty-action">
          <Icon icon="lucide:plus" class="action-icon" />
          Write Your First Entry
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.journal-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.journal-header {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.5rem;
  color: #8b5cf6;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-size: 14px;
}

.action-btn.primary {
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  color: #fff;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.2);
}

.btn-icon {
  font-size: 16px;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(139, 92, 246, 0.4);
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.1);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon {
  font-size: 24px;
  color: #8b5cf6;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
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

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 8px;
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(20px);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  flex: 1;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #e2e8f0;
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  color: #fff;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.toggle-icon {
  font-size: 16px;
}

/* Search Section */
.search-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.search-container {
  position: relative;
  max-width: 500px;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(20px);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.close-icon {
  font-size: 16px;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 24px;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.cancel-btn {
  padding: 12px 20px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: rgba(15, 15, 25, 1);
  border-color: rgba(139, 92, 246, 0.4);
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* Entry Form */
.entry-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.entry-title {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
}

.entry-title:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.section-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 12px;
}

/* Mood Selection */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mood-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

.mood-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.4);
  color: #fff;
}

.mood-emoji {
  font-size: 24px;
}

.mood-label {
  font-size: 0.8rem;
  font-weight: 500;
}

/* Templates */
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.template-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.template-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-1px);
}

.template-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.4);
  color: #fff;
}

.template-icon {
  font-size: 16px;
}

/* Content Editor */
.entry-content {
  padding: 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  min-height: 200px;
}

.entry-content:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* Tags */
.tags-input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tags-input {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.tags-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  color: #8b5cf6;
  font-size: 0.8rem;
  font-weight: 500;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 50%;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-remove:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
}

.tag-icon {
  font-size: 10px;
}

/* Entries Section */
.entries-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.entry-count {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 400;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.entry-item {
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.entry-item:hover {
  background: rgba(15, 15, 25, 0.6);
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.entry-info {
  flex: 1;
}

.entry-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.3;
}

.entry-meta {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.entry-date {
  font-size: 0.9rem;
  color: #94a3b8;
}

.entry-time {
  font-size: 0.8rem;
  color: #64748b;
}

.entry-mood {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #8b5cf6;
  font-weight: 500;
}

.entry-actions {
  display: flex;
  gap: 8px;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #fca5a5;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.action-icon {
  font-size: 16px;
}

.entry-content {
  margin-bottom: 16px;
}

.entry-text {
  color: #e2e8f0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.entry-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.entry-tags .tag {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
}

.empty-icon {
  font-size: 48px;
  color: #8b5cf6;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.empty-description {
  font-size: 1rem;
  color: #94a3b8;
  margin-bottom: 24px;
}

.empty-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 0 auto;
}

.empty-action:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .journal-page {
    gap: 20px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: stretch;
  }
  
  .action-btn {
    flex: 1;
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .mood-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .template-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .entry-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .entry-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
