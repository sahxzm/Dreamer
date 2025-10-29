<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@/utils/storage'
import { Icon } from '@iconify/vue'

// Journal state
const currentView = ref<'today' | 'all'>('today')
const showNewEntry = ref(false)
const searchQuery = ref('')
const showEntryModal = ref(false)
const selectedEntry = ref<{
  id: number
  title: string
  content: string
  mood?: string
  tags: string[]
  date: string
  createdAt: string
} | null>(null)
// removed unused selectedMood
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

// Journal entries persisted locally
const journalEntries = useLocalStorage<Array<{
  id: number
  title: string
  content: string
  mood: string
  tags: string[]
  date: string
  createdAt: string
}>>('journal:entries', [])

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

// removed unused journalStats

// Functions
// removed unused calculateStreak

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
    date: (newEntry.value.date as string) ?? new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }
  journalEntries.value = [entry, ...journalEntries.value]
  showNewEntry.value = false
  resetForm()
}

const onTagEnter = (e: KeyboardEvent) => {
  const target = e.target as HTMLInputElement | null
  if (!target) return
  const value = target.value?.trim()
  if (value) {
    addTag(value)
    target.value = ''
  }
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

// removed unused mood helpers

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

// removed unused relative time helper

const openEntry = (entry: {
  id: number
  title: string
  content: string
  mood?: string
  tags: string[]
  date: string
  createdAt: string
}) => {
  selectedEntry.value = entry
  showEntryModal.value = true
}

const closeEntry = () => {
  showEntryModal.value = false
  selectedEntry.value = null
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 md:p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-3xl font-bold tracking-tight font-headline">Personal Journal</h2>
        <p class="text-muted-foreground">A quiet space for your thoughts, ideas, and reflections.</p>
      </div>
      <div class="flex items-center space-x-2">
        <button @click="startNewEntry" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
          <Icon icon="lucide:plus-circle" class="mr-2 h-4 w-4 inline" />
          New Entry
        </button>
      </div>
    </div>

    <div class="relative">
      <Icon icon="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input v-model="searchQuery" placeholder="Search entries..." class="pl-9 rounded-full w-full border bg-background px-3 py-2 text-sm" />
    </div>

    <!-- New Entry Modal -->
    <div v-if="showNewEntry" class="modal-overlay" @click="showNewEntry = false">
      <div class="modal-content rounded-2xl border bg-card" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">New Journal Entry</h2>
          <button @click="showNewEntry = false" class="rounded-md border px-2 py-2 hover:bg-secondary">
            <Icon icon="lucide:x" class="close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <div class="entry-form">
            <input v-model="newEntry.title" placeholder="Entry title..." class="entry-title" />

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

            <div class="content-section">
              <label class="section-label">Your thoughts</label>
              <textarea
                v-model="newEntry.content"
                placeholder="Write your thoughts, reflections, or use the templates above..."
                class="entry-content"
                rows="8"
              ></textarea>
            </div>

            <div class="tags-section">
              <label class="section-label">Tags (optional)</label>
              <div class="tags-input-container">
                <input
                  @keyup.enter="onTagEnter($event)"
                  placeholder="Add a tag and press Enter..."
                  class="tags-input"
                />
                <div class="tags-list">
                  <span v-for="tag in newEntry.tags" :key="tag" class="tag">
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
          <button @click="showNewEntry = false" class="rounded-md border px-3 py-2 text-sm hover:bg-secondary">Cancel</button>
          <button @click="saveEntry" class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            <Icon icon="lucide:save" class="btn-icon" />
            Save Entry
          </button>
        </div>
      </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-for="entry in filteredEntries" :key="entry.id" class="rounded-2xl border bg-card flex flex-col">
        <div class="p-6 border-b">
          <div class="font-headline text-lg">{{ entry.title }}</div>
          <div class="text-sm text-muted-foreground">{{ formatDate(entry.date) }}</div>
        </div>
        <div class="p-6 flex-grow">
          <p class="text-sm text-muted-foreground line-clamp-4">{{ entry.content }}</p>
        </div>
        <div class="p-6 pt-0">
          <button class="text-sm text-primary hover:underline" @click="openEntry(entry)">Read more</button>
        </div>
      </div>
    </div>

    <!-- Read Entry Modal -->
    <div v-if="showEntryModal && selectedEntry" class="modal-overlay" @click="closeEntry()">
      <div class="modal-content rounded-2xl border bg-card" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ selectedEntry.title }}</h2>
          <button @click="closeEntry()" class="rounded-md border px-2 py-2 hover:bg-secondary">
            <Icon icon="lucide:x" class="close-icon" />
          </button>
        </div>
        <div class="modal-body">
          <div class="text-sm text-muted-foreground mb-4">{{ formatDate(selectedEntry.date) }}</div>
          <div class="whitespace-pre-wrap text-foreground leading-relaxed text-sm">{{ selectedEntry.content }}</div>
          <div v-if="selectedEntry.tags && selectedEntry.tags.length" class="entry-tags mt-4">
            <span v-for="tag in selectedEntry.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEntry()" class="rounded-md border px-3 py-2 text-sm hover:bg-secondary">Close</button>
        </div>
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
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
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 1.5rem;
  color: hsl(var(--primary));
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
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
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
  color: hsl(var(--primary));
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
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 8px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 4px;
  backdrop-filter: blur(2px);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  flex: 1;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: hsl(var(--foreground));
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
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
  color: hsl(var(--muted-foreground));
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: hsl(var(--foreground));
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
  border: none;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
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
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
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
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  border: 1px solid color-mix(in oklab, var(--color-border), transparent 30%);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.entry-item:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: var(--color-border, rgba(139, 92, 246, 0.2));
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
