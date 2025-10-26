<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

// Bookmark state
const currentView = ref<'grid' | 'list'>('grid')
const searchQuery = ref('')
const selectedCategory = ref('all')
const showAddBookmark = ref(false)
const sortBy = ref<'date' | 'title' | 'category'>('date')

// New bookmark form
const newBookmark = ref({
  title: '',
  url: '',
  description: '',
  category: 'general',
  tags: [] as string[],
  isFavorite: false
})

// Bookmarks data - will be loaded from real data source
const bookmarks = ref<Array<{
  id: number
  title: string
  url: string
  description: string
  category: string
  tags: string[]
  isFavorite: boolean
  createdAt: string
  lastAccessed: string
  accessCount: number
}>>([])

// Categories
const categories = ref([
  { id: 'all', name: 'All', icon: 'lucide:grid-3x3', count: 0 },
  { id: 'development', name: 'Development', icon: 'lucide:code', count: 0 },
  { id: 'design', name: 'Design', icon: 'lucide:palette', count: 0 },
  { id: 'productivity', name: 'Productivity', icon: 'lucide:zap', count: 0 },
  { id: 'general', name: 'General', icon: 'lucide:bookmark', count: 0 }
])

// Computed properties
const filteredBookmarks = computed(() => {
  let filtered = bookmarks.value

  // Filter by category
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(bookmark => bookmark.category === selectedCategory.value)
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(bookmark => 
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.description.toLowerCase().includes(query) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Sort bookmarks
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'category':
        return a.category.localeCompare(b.category)
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return filtered
})

const favorites = computed(() => bookmarks.value.filter(bookmark => bookmark.isFavorite))

const bookmarkStats = computed(() => {
  const totalBookmarks = bookmarks.value.length
  const totalFavorites = favorites.value.length
  const totalCategories = categories.value.length - 1 // Exclude 'all'
  
  // Calculate category counts
  const categoryCounts = bookmarks.value.reduce((acc, bookmark) => {
    acc[bookmark.category] = (acc[bookmark.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Update category counts
  categories.value.forEach(category => {
    if (category.id !== 'all') {
      category.count = categoryCounts[category.id] || 0
    }
  })

  return {
    totalBookmarks,
    totalFavorites,
    totalCategories,
    mostUsedCategory: Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
  }
})

// Functions
const addBookmark = () => {
  if (!newBookmark.value.title.trim() || !newBookmark.value.url.trim()) return
  
  const bookmark = {
    id: Date.now(),
    title: newBookmark.value.title.trim(),
    url: newBookmark.value.url.trim(),
    description: newBookmark.value.description.trim(),
    category: newBookmark.value.category,
    tags: newBookmark.value.tags,
    isFavorite: newBookmark.value.isFavorite,
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    accessCount: 0
  }
  
  bookmarks.value.unshift(bookmark)
  showAddBookmark.value = false
  resetForm()
}

const resetForm = () => {
  newBookmark.value = {
    title: '',
    url: '',
    description: '',
    category: 'general',
    tags: [],
    isFavorite: false
  }
}

const deleteBookmark = (bookmarkId: number) => {
  const index = bookmarks.value.findIndex(bookmark => bookmark.id === bookmarkId)
  if (index > -1) {
    bookmarks.value.splice(index, 1)
  }
}

const toggleFavorite = (bookmarkId: number) => {
  const bookmark = bookmarks.value.find(b => b.id === bookmarkId)
  if (bookmark) {
    bookmark.isFavorite = !bookmark.isFavorite
  }
}

const openBookmark = (bookmark: any) => {
  // Update access count and last accessed
  bookmark.accessCount += 1
  bookmark.lastAccessed = new Date().toISOString()
  
  // Open in new tab
  window.open(bookmark.url, '_blank')
}

const addTag = (tag: string) => {
  if (tag.trim() && !newBookmark.value.tags.includes(tag.trim())) {
    newBookmark.value.tags.push(tag.trim())
  }
}

const removeTag = (tagToRemove: string) => {
  newBookmark.value.tags = newBookmark.value.tags.filter(tag => tag !== tagToRemove)
}

const getCategoryIcon = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.icon : 'lucide:bookmark'
}

const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : 'General'
}

const getCategoryColor = (categoryId: string) => {
  switch (categoryId) {
    case 'development': return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
    case 'design': return 'text-purple-400 bg-purple-400/20 border-purple-400/30'
    case 'productivity': return 'text-green-400 bg-green-400/20 border-green-400/30'
    case 'general': return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
    default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
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

const extractDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname
    return domain.replace('www.', '')
  } catch {
    return url
  }
}
</script>

<template>
  <div class="bookmarks-page">
    <!-- Header -->
    <div class="bookmarks-header">
      <div class="header-content">
        <h1 class="page-title">
          <Icon icon="lucide:bookmark" class="title-icon" />
          Bookmarks & Links
        </h1>
        <div class="header-actions">
          <button @click="showAddBookmark = true" class="action-btn primary">
            <Icon icon="lucide:plus" class="btn-icon" />
            Add Bookmark
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:bookmark" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ bookmarkStats.totalBookmarks }}</div>
          <div class="stat-label">Total Bookmarks</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:heart" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ bookmarkStats.totalFavorites }}</div>
          <div class="stat-label">Favorites</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:folder" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ bookmarkStats.totalCategories }}</div>
          <div class="stat-label">Categories</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <Icon icon="lucide:trending-up" />
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ getCategoryName(bookmarkStats.mostUsedCategory) }}</div>
          <div class="stat-label">Top Category</div>
        </div>
      </div>
    </div>

    <!-- Filters and Controls -->
    <div class="controls-section">
      <div class="search-container">
        <Icon icon="lucide:search" class="search-icon" />
        <input 
          v-model="searchQuery"
          placeholder="Search bookmarks, tags, or descriptions..."
          class="search-input"
        />
      </div>
      
      <div class="controls-row">
        <!-- Category Filter -->
        <div class="category-filter">
          <select v-model="selectedCategory" class="category-select">
            <option 
              v-for="category in categories" 
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }} ({{ category.count }})
            </option>
          </select>
        </div>

        <!-- Sort Options -->
        <div class="sort-filter">
          <select v-model="sortBy" class="sort-select">
            <option value="date">Date Added</option>
            <option value="title">Title</option>
            <option value="category">Category</option>
          </select>
        </div>

        <!-- View Toggle -->
        <div class="view-toggle">
          <button 
            @click="currentView = 'grid'"
            :class="['view-btn', { active: currentView === 'grid' }]"
          >
            <Icon icon="lucide:grid-3x3" class="view-icon" />
          </button>
          <button 
            @click="currentView = 'list'"
            :class="['view-btn', { active: currentView === 'list' }]"
          >
            <Icon icon="lucide:list" class="view-icon" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add Bookmark Modal -->
    <div v-if="showAddBookmark" class="modal-overlay" @click="showAddBookmark = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">Add New Bookmark</h2>
          <button @click="showAddBookmark = false" class="close-btn">
            <Icon icon="lucide:x" class="close-icon" />
          </button>
        </div>
        
        <div class="modal-body">
          <div class="bookmark-form">
            <div class="form-group">
              <label class="form-label">Title</label>
              <input 
                v-model="newBookmark.title"
                placeholder="Bookmark title..."
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">URL</label>
              <input 
                v-model="newBookmark.url"
                placeholder="https://example.com"
                class="form-input"
                type="url"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Description (optional)</label>
              <textarea 
                v-model="newBookmark.description"
                placeholder="Brief description of the bookmark..."
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select v-model="newBookmark.category" class="form-select">
                  <option value="general">General</option>
                  <option value="development">Development</option>
                  <option value="design">Design</option>
                  <option value="productivity">Productivity</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Tags (optional)</label>
                <input 
                  @keyup.enter="addTag($event.target.value); $event.target.value = ''"
                  placeholder="Add a tag and press Enter..."
                  class="form-input"
                />
                <div class="tags-list">
                  <span 
                    v-for="tag in newBookmark.tags" 
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

            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  v-model="newBookmark.isFavorite"
                  type="checkbox"
                  class="checkbox"
                />
                <span class="checkbox-text">Add to favorites</span>
              </label>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showAddBookmark = false" class="cancel-btn">
            Cancel
          </button>
          <button @click="addBookmark" class="save-btn">
            <Icon icon="lucide:save" class="btn-icon" />
            Save Bookmark
          </button>
        </div>
      </div>
    </div>

    <!-- Bookmarks Grid/List -->
    <div class="bookmarks-section">
      <div class="section-header">
        <h2 class="section-title">
          {{ selectedCategory === 'all' ? 'All Bookmarks' : getCategoryName(selectedCategory) }}
          <span class="bookmark-count">({{ filteredBookmarks.length }})</span>
        </h2>
      </div>
      
      <div :class="['bookmarks-container', currentView]">
        <div 
          v-for="bookmark in filteredBookmarks" 
          :key="bookmark.id"
          class="bookmark-item"
        >
          <div class="bookmark-header">
            <div class="bookmark-info">
              <div class="bookmark-title-row">
                <h3 class="bookmark-title">{{ bookmark.title }}</h3>
                <div class="bookmark-actions">
                  <button 
                    @click="toggleFavorite(bookmark.id)"
                    :class="['favorite-btn', { active: bookmark.isFavorite }]"
                  >
                    <Icon icon="lucide:heart" class="action-icon" />
                  </button>
                  <button @click="deleteBookmark(bookmark.id)" class="delete-btn">
                    <Icon icon="lucide:trash-2" class="action-icon" />
                  </button>
                </div>
              </div>
              
              <div class="bookmark-meta">
                <span :class="['bookmark-category', getCategoryColor(bookmark.category)]">
                  <Icon :icon="getCategoryIcon(bookmark.category)" class="category-icon" />
                  {{ getCategoryName(bookmark.category) }}
                </span>
                <span class="bookmark-domain">{{ extractDomain(bookmark.url) }}</span>
                <span class="bookmark-date">{{ getRelativeTime(bookmark.createdAt) }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="bookmark.description" class="bookmark-description">
            {{ bookmark.description }}
          </div>
          
          <div class="bookmark-footer">
            <div class="bookmark-stats">
              <span class="stat-item">
                <Icon icon="lucide:eye" class="stat-icon" />
                {{ bookmark.accessCount }} views
              </span>
              <span class="stat-item">
                <Icon icon="lucide:clock" class="stat-icon" />
                {{ getRelativeTime(bookmark.lastAccessed) }}
              </span>
            </div>
            
            <div class="bookmark-tags">
              <span 
                v-for="tag in bookmark.tags" 
                :key="tag"
                class="tag"
              >
                #{{ tag }}
              </span>
            </div>
          </div>
          
          <button @click="openBookmark(bookmark)" class="bookmark-link">
            <Icon icon="lucide:external-link" class="link-icon" />
            Open Link
          </button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="filteredBookmarks.length === 0" class="empty-state">
        <Icon icon="lucide:bookmark" class="empty-icon" />
        <h3 class="empty-title">
          {{ searchQuery ? 'No bookmarks found' : 'No bookmarks yet' }}
        </h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search terms' : 'Start building your bookmark collection by adding your first bookmark.' }}
        </p>
        <button v-if="!searchQuery" @click="showAddBookmark = true" class="empty-action">
          <Icon icon="lucide:plus" class="action-icon" />
          Add Your First Bookmark
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bookmarks-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.bookmarks-header {
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

/* Controls Section */
.controls-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.controls-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.category-filter, .sort-filter {
  flex: 1;
  min-width: 150px;
}

.category-select, .sort-select {
  width: 100%;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  padding: 4px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  color: #e2e8f0;
}

.view-btn.active {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  color: #fff;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.view-icon {
  font-size: 16px;
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
  max-width: 600px;
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

/* Bookmark Form */
.bookmark-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
}

.form-input, .form-textarea, .form-select {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.form-input:focus, .form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox {
  width: 16px;
  height: 16px;
  accent-color: #8b5cf6;
}

.checkbox-text {
  font-size: 0.9rem;
  color: #e2e8f0;
}

/* Tags */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
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

/* Bookmarks Section */
.bookmarks-section {
  background: rgba(15, 15, 25, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(20px);
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.bookmark-count {
  font-size: 1rem;
  color: #94a3b8;
  font-weight: 400;
}

/* Bookmarks Container */
.bookmarks-container {
  display: grid;
  gap: 20px;
}

.bookmarks-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
}

.bookmarks-container.list {
  grid-template-columns: 1fr;
}

.bookmark-item {
  background: rgba(15, 15, 25, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  position: relative;
}

.bookmark-item:hover {
  background: rgba(15, 15, 25, 0.6);
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.bookmark-header {
  margin-bottom: 16px;
}

.bookmark-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.bookmark-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.3;
  flex: 1;
}

.bookmark-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.favorite-btn, .delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.favorite-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.favorite-btn.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.favorite-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.action-icon {
  font-size: 16px;
}

.bookmark-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.bookmark-category {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid;
}

.category-icon {
  font-size: 12px;
}

.bookmark-domain {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

.bookmark-date {
  font-size: 0.8rem;
  color: #64748b;
}

.bookmark-description {
  color: #e2e8f0;
  line-height: 1.5;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.bookmark-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.bookmark-stats {
  display: flex;
  gap: 16px;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8rem;
  color: #94a3b8;
}

.stat-icon {
  font-size: 12px;
}

.bookmark-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.bookmark-tags .tag {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
}

.bookmark-link {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  color: #8b5cf6;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.bookmark-link:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.2));
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.link-icon {
  font-size: 16px;
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
  .bookmarks-page {
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
  
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .category-filter, .sort-filter {
    min-width: auto;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .bookmarks-container.grid {
    grid-template-columns: 1fr;
  }
  
  .bookmark-title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .bookmark-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .bookmark-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
