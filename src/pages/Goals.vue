<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { useGoalsStore, type Goal } from '@/stores/goals'

const goalsStore = useGoalsStore()

// Form state (todoref-like)
const form = ref({
  title: '',
  description: '',
  category: 'personal' as Goal['category'],
  start_date: '',
  target_date: '',
})

const milestoneTitle = ref('')
const milestones = ref<Array<{ id: string; title: string; completed: boolean; due_date?: string }>>([])

const resetForm = () => {
  form.value = { title: '', description: '', category: 'personal', start_date: '', target_date: '' }
  milestones.value = []
  milestoneTitle.value = ''
}

const addMilestone = () => {
  const title = milestoneTitle.value.trim()
  if (!title) return
  milestones.value.push({ id: `ms_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, title, completed: false })
  milestoneTitle.value = ''
}

const removeMilestone = (id: string) => {
  milestones.value = milestones.value.filter(m => m.id !== id)
}

const toggleMilestone = async (goal: Goal, msId: string) => {
  const next = (goal.milestones || []).map(m => m.id === msId ? { ...m, completed: !m.completed } : m)
  await goalsStore.updateGoal(goal.id, { milestones: next, current_value: next.filter(m => m.completed).length })
}

// Stats (kept for future use if needed)

const createGoal = async () => {
  if (!form.value.title.trim()) return
  const payload: Omit<Goal, 'id' | 'created_at' | 'updated_at'> = {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    category: form.value.category,
    priority: 'medium',
    status: 'active',
    target_value: milestones.value.length || 1,
    current_value: 0,
    unit: 'milestone',
    target_date: form.value.target_date,
    start_date: form.value.start_date,
    milestones: milestones.value,
    completed_at: undefined,
  }
  await goalsStore.createGoal(payload as any)
  resetForm()
}

const getDaysRemaining = (date: string) => goalsStore.getDaysRemaining(date)
const getCategoryIcon = (c: string) => goalsStore.getCategoryIcon(c)
const getProgressPercent = (g: Goal) => {
  const total = Math.max(1, g.target_value || 1)
  const current = Math.min(g.current_value || 0, total)
  return Math.round((current / total) * 100)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
    <!-- Header -->
    <div class="rounded-2xl border bg-card p-6">
      <h1 class="page-title">
        <Icon icon="lucide:target" class="title-icon" />
        Goals
      </h1>
      <p class="page-subtitle">Define clear goals with milestones, category, and dates.</p>
    </div>

    <div class="goals-layout">
      <!-- Left column: goals -->
      <section class="goals-left">
        <h2 class="section-title">Current Goals</h2>
        <div class="goals-grid">
          <div v-for="goal in goalsStore.goals" :key="goal.id" class="goal-card">
            <div class="goal-card-header">
              <h3 class="goal-card-title">{{ goal.title }}</h3>
              <button class="delete-btn" @click="goalsStore.deleteGoal(goal.id)" title="Delete goal">
                <Icon icon="lucide:trash-2" />
              </button>
            </div>
            <p v-if="goal.description" class="goal-card-desc">"{{ goal.description }}"</p>
            <div class="goal-dates" v-if="goal.start_date || goal.target_date">
              <span class="date-chip">
                <template v-if="goal.start_date">
                  <Icon icon="lucide:calendar" class="date-icon" /> 
                  {{ goal.start_date }}
                </template>
                <template v-if="goal.start_date && goal.target_date">
                  <span class="date-separator">•</span>
                </template>
                <template v-if="goal.target_date">
                  <Icon icon="lucide:flag" class="date-icon" /> 
                  {{ goal.target_date }} ({{ getDaysRemaining(goal.target_date) }}d left)
                </template>
              </span>
            </div>
            <div class="goal-progressbar">
              <div class="bar"><div class="fill" :style="{ width: getProgressPercent(goal) + '%' }"></div></div>
              <div class="percent">{{ getProgressPercent(goal) }}%</div>
            </div>
            <div class="goal-meta-line">Milestones:</div>
            <ul class="milestones-list">
              <li v-for="m in goal.milestones || []" :key="m.id" class="ms-row">
                <button class="ms-check" @click="toggleMilestone(goal, m.id)"><span :class="['dot', { done: m.completed }]" /></button>
                <span :class="['ms-title', { done: m.completed }]">{{ m.title }}</span>
              </li>
            </ul>
          </div>
        </div>
        <div v-if="goalsStore.goals.length === 0" class="empty-state">
          <Icon icon="lucide:target" class="empty-icon" />
          <h3 class="empty-title">No goals yet</h3>
          <p class="empty-description">Create your first goal in the sidebar.</p>
        </div>
      </section>

      <!-- Right column: form -->
      <aside class="goals-right">
        <div class="right-card">
          <h2 class="right-title">Define a New Goal</h2>
          <button class="right-help" type="button">
            <Icon icon="lucide:sparkles" /> Get SMART goal help
          </button>
          <div class="form-grid">
            <div class="form-row">
              <label class="form-label">Name</label>
              <input v-model="form.title" class="input" placeholder="e.g., Learn Spanish" />
            </div>
            <div class="form-row">
              <label class="form-label">Category</label>
              <select v-model="form.category" class="select">
                <option value="learning">Learning</option>
                <option value="health">Health</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="fitness">Fitness</option>
                <option value="creative">Creative</option>
              </select>
            </div>
            <div class="form-row cols-2">
              <div>
                <label class="form-label">Start</label>
                <input v-model="form.start_date" type="date" class="input" />
              </div>
              <div>
                <label class="form-label">Deadline</label>
                <input v-model="form.target_date" type="date" class="input" />
              </div>
            </div>
            <div class="form-row">
              <label class="form-label">Details (optional)</label>
              <textarea v-model="form.description" class="textarea" rows="3" placeholder="Briefly describe the goal" />
            </div>
            <div class="form-row">
              <div class="form-section-title">Milestones</div>
              <div class="milestone-add">
                <input v-model="milestoneTitle" class="input" placeholder="Add milestone" @keyup.enter="addMilestone" />
                <button class="btn" @click="addMilestone"><Icon icon="lucide:plus" class="btn-icon" /> Add</button>
              </div>
              <ul class="milestone-list">
                <li v-for="m in milestones" :key="m.id" class="milestone-item">
                  <span class="milestone-title">{{ m.title }}</span>
                  <button class="icon-btn" @click="removeMilestone(m.id)" title="Remove"><Icon icon="lucide:x" /></button>
                </li>
              </ul>
            </div>
            <div class="form-actions">
              <button class="primary-btn" @click="createGoal" :disabled="!form.title">Create Goal</button>
              <button class="ghost-btn" @click="resetForm">Reset</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.goals-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.goals-header {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
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

/* Two-column layout and card styles (todoref-like) */
.goals-layout { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 1024px) { .goals-layout { grid-template-columns: 2fr 1fr; } }
.goals-left { display: flex; flex-direction: column; gap: 16px; }
.goals-right { position: sticky; top: 88px; height: fit-content; }
.right-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 16px; }
.right-title { font-size: 1.25rem; font-weight: 700; color: var(--color-text); margin: 0 0 4px; }
.right-sub { color: var(--color-text-secondary); margin: 0 0 12px; font-size: .9rem; }
.right-help { display: inline-flex; align-items: center; gap: 6px; font-size: .85rem; color: var(--color-primary); background: transparent; border: none; padding: 0; cursor: pointer; margin-bottom: 8px; }

/* Form styles - simplified and spacious */
.form-grid { display: grid; gap: 12px; }
.form-row { display: grid; gap: 6px; }
.form-row.cols-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-label { font-size: .85rem; color: var(--color-text-secondary); }
.input, .select, .textarea { width: 100%; background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text); border-radius: 10px; padding: 10px 12px; font-size: .95rem; }
.textarea { resize: vertical; min-height: 84px; }
.input:focus, .select:focus, .textarea:focus { outline: none; border-color: color-mix(in oklab, var(--color-primary), transparent 30%); box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary), transparent 92%); }
.form-section-title { font-weight: 700; color: var(--color-text); margin-bottom: 4px; }
.milestone-add { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--color-border); color: var(--color-text); background: var(--color-surface); cursor: pointer; }
.btn:hover { border-color: color-mix(in oklab, var(--color-primary), transparent 60%); }
.btn-icon { font-size: 16px; }
.milestone-list { list-style: none; padding: 0; margin: 8px 0 0; display: grid; gap: 6px; max-height: 160px; overflow: auto; }
.milestone-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: 8px; }
.milestone-title { color: var(--color-text); font-size: .95rem; }
.icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.icon-btn:hover { color: var(--color-text); border-color: color-mix(in oklab, var(--color-primary), transparent 60%); }
.form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.primary-btn { background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: #fff; border: none; border-radius: 10px; padding: 10px 14px; font-weight: 700; cursor: pointer; }
.primary-btn:disabled { opacity: .6; cursor: not-allowed; }
.ghost-btn { background: transparent; border: 1px solid var(--color-border); color: var(--color-text); border-radius: 10px; padding: 10px 14px; cursor: pointer; }

.goal-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; padding: 16px; }
.goal-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.goal-card-title { font-size: 1.25rem; font-weight: 800; color: var(--color-text); margin: 0 0 8px; }
.goal-card-desc { color: var(--color-text-secondary); font-style: italic; margin: 0 0 12px; }
.goal-progressbar { display: flex; align-items: center; gap: 8px; margin: 8px 0 12px; }
.goal-progressbar .bar { flex: 1; height: 10px; background: color-mix(in oklab, var(--color-primary), transparent 85%); border-radius: 999px; overflow: hidden; }
.goal-progressbar .fill { height: 100%; background-image: linear-gradient(90deg, var(--color-primary), var(--color-secondary)); }
.goal-progressbar .percent { color: var(--color-text); font-weight: 700; font-size: 0.9rem; }
.goal-meta-line { margin: 8px 0 6px; color: var(--color-text); font-weight: 700; }
.milestones-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.ms-row { display: flex; align-items: center; gap: 10px; }
.ms-check { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; border: 1px solid var(--color-border); background: transparent; cursor: pointer; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: transparent; border: 2px solid color-mix(in oklab, var(--color-primary), transparent 30%); display: inline-block; }
.dot.done { background: var(--color-primary); border-color: var(--color-primary); }
.ms-title { color: var(--color-text); }
.ms-title.done { text-decoration: line-through; opacity: .7; }

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 8px;
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
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

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
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

/* Progress Overview */
.progress-overview {
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
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a855f7);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #8b5cf6;
  text-align: center;
}

/* Add Goal Form */
.add-goal {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.add-form {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.goal-input {
  flex: 1;
  min-width: 200px;
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
}

.goal-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.category-select, .priority-select, .deadline-input {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  min-width: 120px;
}

.add-btn {
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

.add-btn:hover {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.add-icon {
  font-size: 16px;
}

/* Goals List */
.goals-list {
  background: var(--color-surface, rgba(15, 15, 25, 0.5));
  border: 1px solid var(--color-border, rgba(139, 92, 246, 0.2));
  border-radius: 16px;
  padding: 24px;
  backdrop-filter: blur(2px);
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.goal-item {
  background: color-mix(in oklab, var(--color-surface), transparent 30%);
  border: 1px solid color-mix(in oklab, var(--color-border), transparent 30%);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.goal-item:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: var(--color-border, rgba(139, 92, 246, 0.2));
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
}

.goal-item.completed {
  opacity: 0.7;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.goal-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.goal-icon {
  font-size: 24px;
  color: #8b5cf6;
  flex-shrink: 0;
  margin-top: 4px;
}

.goal-details {
  flex: 1;
}

.goal-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8px;
  line-height: 1.3;
}

.goal-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.goal-category, .goal-priority {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  border: 1px solid;
}

.goal-deadline {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: #94a3b8;
}

.deadline-icon {
  font-size: 14px;
}

.overdue {
  color: #ef4444;
  font-weight: 600;
}

.goal-actions {
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

/* Goal Progress */
.goal-progress {
  margin-top: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

.progress-percentage {
  font-size: 0.9rem;
  color: #8b5cf6;
  font-weight: 600;
}

.progress-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.progress-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  color: #8b5cf6;
  cursor: pointer;
  transition: all 0.2s ease;
}

.progress-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.progress-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.progress-slider {
  flex: 1;
  height: 6px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.progress-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
}

.progress-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #8b5cf6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
}

/* Goal Dates */
.goal-dates {
  margin: 8px 0;
  white-space: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 4px;
}

.date-chip {
  display: inline-flex;
  align-items: center;
  background: var(--color-surface-hover);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  color: var(--color-text);
  white-space: nowrap;
  gap: 6px;
}

.date-icon {
  flex-shrink: 0;
  color: var(--color-primary);
}

.date-separator {
  color: var(--color-text-secondary);
  opacity: 0.6;
  margin: 0 4px;
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
  .goals-page {
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
  
  .add-form {
    flex-direction: column;
    gap: 12px;
  }
  
  .goal-input {
    width: 100%;
  }
  
  .goals-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .goal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .goal-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .progress-controls {
    flex-direction: column;
    gap: 8px;
  }
  
  .progress-slider {
    order: -1;
  }
}
</style>
