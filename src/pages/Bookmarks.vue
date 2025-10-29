<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

type Bookmark = {
  id: string
  title: string
  url: string
  icon: string
}

type BookmarkGroup = {
  id: string
  name: string
  bookmarks: Bookmark[]
}

const bookmarkGroups = ref<BookmarkGroup[]>([
  {
    id: 'dev',
    name: 'Development',
    bookmarks: [
      { id: '1', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', icon: 'lucide:book-open' },
      { id: '2', title: 'GitHub', url: 'https://github.com', icon: 'lucide:github' },
      { id: '3', title: 'Stack Overflow', url: 'https://stackoverflow.com', icon: 'lucide:message-square' }
    ]
  },
  {
    id: 'design',
    name: 'Design',
    bookmarks: [
      { id: '4', title: 'Figma', url: 'https://figma.com', icon: 'lucide:palette' },
      { id: '5', title: 'Dribbble', url: 'https://dribbble.com', icon: 'lucide:paintbrush' }
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity',
    bookmarks: [
      { id: '6', title: 'Notion', url: 'https://notion.so', icon: 'lucide:notebook' },
      { id: '7', title: 'Google Calendar', url: 'https://calendar.google.com', icon: 'lucide:calendar' }
    ]
  }
])

// Accordion state (multiple open)
const openGroups = ref<Set<string>>(new Set(bookmarkGroups.value.map(g => g.id)))
const toggleGroup = (id: string) => {
  const next = new Set(openGroups.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  openGroups.value = next
}

// Add bookmark modal state
const showAdd = ref(false)
const newBookmark = ref<{ title: string; url: string; icon: string; groupId: string }>({
    title: '',
    url: '',
  icon: 'lucide:link-2',
  groupId: bookmarkGroups.value[0]?.id || ''
})

const resetForm = () => {
  newBookmark.value = { title: '', url: '', icon: 'lucide:link-2', groupId: bookmarkGroups.value[0]?.id || '' }
}

const addBookmark = () => {
  const title = newBookmark.value.title.trim()
  const url = newBookmark.value.url.trim()
  const groupId = newBookmark.value.groupId
  if (!title || !url || !groupId) return
  const group = bookmarkGroups.value.find(g => g.id === groupId)
  if (!group) return
  group.bookmarks.unshift({ id: String(Date.now()), title, url, icon: newBookmark.value.icon || 'lucide:link-2' })
  openGroups.value = new Set(openGroups.value).add(groupId)
  showAdd.value = false
  resetForm()
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <div class="rounded-2xl border bg-card p-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-3xl font-bold tracking-tight font-headline">Bookmarks</h2>
          <p class="text-muted-foreground">Your collection of useful links and resources.</p>
        </div>
        <div>
          <button class="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground inline-flex items-center gap-2" @click="showAdd = true">
            <Icon icon="lucide:plus-circle" class="h-4 w-4" />
            Add Bookmark
          </button>
        </div>
      </div>
    </div>

    <!-- Add Bookmark Modal -->
    <div v-if="showAdd" class="modal-overlay" @click="showAdd = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Add Bookmark</h3>
          <button class="icon-btn" @click="showAdd = false" title="Close">
            <Icon icon="lucide:x" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-row">
              <label class="form-label">Title</label>
              <input v-model="newBookmark.title" class="input" placeholder="e.g., MDN Web Docs" />
            </div>
            <div class="form-row">
              <label class="form-label">URL</label>
              <input v-model="newBookmark.url" class="input" type="url" placeholder="https://example.com" />
            </div>
            <div class="form-row cols-2">
              <div>
                <label class="form-label">Group</label>
                <select v-model="newBookmark.groupId" class="select">
                  <option v-for="g in bookmarkGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
              </div>
              <div>
                <label class="form-label">Icon</label>
                <input v-model="newBookmark.icon" class="input" placeholder="lucide:link-2" />
                </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="ghost-btn" @click="showAdd = false">Cancel</button>
          <button class="primary-btn" :disabled="!newBookmark.title || !newBookmark.url || !newBookmark.groupId" @click="addBookmark">Save</button>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <div 
        v-for="group in bookmarkGroups" 
        :key="group.id" 
        class="rounded-2xl border bg-card overflow-hidden"
      >
                  <button 
          class="accordion-trigger px-6 py-4 text-lg font-headline w-full text-left"
          @click="toggleGroup(group.id)"
                  >
          <div class="flex items-center justify-between">
            <span>{{ group.name }}</span>
            <Icon :icon="openGroups.has(group.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
          </div>
                  </button>
        <div v-show="openGroups.has(group.id)" class="px-6 pb-4">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a 
              v-for="bookmark in group.bookmarks" 
          :key="bookmark.id"
              :href="bookmark.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-secondary"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon :icon="bookmark.icon || 'lucide:link-2'" class="h-5 w-5" />
                </div>
              <div class="truncate">
                <p class="font-semibold">{{ bookmark.title }}</p>
                <p class="text-sm text-muted-foreground truncate">{{ bookmark.url }}</p>
              </div>
            </a>
              </div>
            </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Accordion */
.accordion-trigger { background: transparent; border: none; cursor: pointer; }

/* Modal + Form */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px); display: grid; place-items: center; z-index: 50; padding: 16px; }
.modal-content { width: 100%; max-width: 560px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--color-border); }
.modal-title { font-weight: 800; color: var(--color-text); }
.modal-body { padding: 16px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 16px; border-top: 1px solid var(--color-border); }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); }
.icon-btn:hover { color: var(--color-text); border-color: color-mix(in oklab, var(--color-primary), transparent 60%); }
.form-grid { display: grid; gap: 12px; }
.form-row { display: grid; gap: 6px; }
.form-row.cols-2 { grid-template-columns: 1fr 1fr; gap: 12px; }
.form-label { font-size: .85rem; color: var(--color-text-secondary); }
.input, .select { width: 100%; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 10px; padding: 10px 12px; font-size: .95rem; }
.input:focus, .select:focus { outline: none; border-color: color-mix(in oklab, var(--color-primary), transparent 30%); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary), transparent 92%); }
.primary-btn { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; }
.primary-btn:disabled { opacity: .6; cursor: not-allowed; }
.ghost-btn { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); border-radius: 10px; padding: 10px 14px; cursor: pointer; }
</style>
