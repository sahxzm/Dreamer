<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const props = defineProps<{ hideTrigger?: boolean }>()

// State
const isOpen = ref(false)
const isEditing = ref(false)
const fullName = ref('')
const bio = ref('')
const loading = ref(false)

// Computed
const user = computed(() => authStore.user)
const userMetadata = computed(() => user.value?.user_metadata || {})
const displayName = computed(() => 
  fullName.value || 
  userMetadata.value.full_name || 
  userMetadata.value.name || 
  user.value?.email?.split('@')[0] || 
  'User'
)

// Methods
const openProfile = () => {
  isOpen.value = true
  fullName.value = userMetadata.value.full_name || ''
  bio.value = userMetadata.value.bio || ''
}

const closeProfile = () => {
  isOpen.value = false
  isEditing.value = false
}

const startEditing = () => {
  isEditing.value = true
}

const cancelEditing = () => {
  isEditing.value = false
  fullName.value = userMetadata.value.full_name || ''
  bio.value = userMetadata.value.bio || ''
}

const saveProfile = async () => {
  if (!fullName.value.trim()) return

  loading.value = true
  try {
    const { error } = await authStore.updateProfile({
      full_name: fullName.value.trim(),
      bio: bio.value.trim()
    })

    if (error) throw error

    isEditing.value = false
  } catch (error) {
    console.error('Error updating profile:', error)
  } finally {
    loading.value = false
  }
}

const handleSignOut = async () => {
  await authStore.signOut()
  closeProfile()
}

// Expose methods
defineExpose({
  openProfile,
  closeProfile
})
</script>

<template>
  <!-- Profile Button (optional trigger) -->
  <button v-if="!props.hideTrigger && user" @click="openProfile" class="profile-btn">
    <div class="avatar">
      <Icon icon="lucide:user" class="avatar-icon" />
    </div>
    <div class="profile-info">
      <span class="profile-name">{{ displayName }}</span>
      <span class="profile-email">{{ user?.email }}</span>
    </div>
    <Icon icon="lucide:chevron-down" class="chevron-icon" />
  </button>

  <!-- Profile Modal -->
  <div v-if="isOpen" class="profile-overlay" @click="closeProfile">
    <div class="profile-modal" @click.stop>
      <!-- Header -->
      <div class="profile-header">
        <div class="profile-avatar-large">
          <Icon icon="lucide:user" class="avatar-icon-large" />
        </div>
        <div class="profile-details">
          <h3 class="profile-title">{{ displayName }}</h3>
          <p class="profile-subtitle">{{ user?.email }}</p>
        </div>
        <button @click="closeProfile" class="close-btn">
          <Icon icon="lucide:x" class="close-icon" />
        </button>
      </div>

      <!-- Content -->
      <div class="profile-content">
        <!-- Edit Form -->
        <div v-if="isEditing" class="edit-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input
              v-model="fullName"
              type="text"
              class="form-input"
              placeholder="Enter your full name"
            />
          </div>
          
          <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea
              v-model="bio"
              class="form-textarea"
              placeholder="Tell us about yourself..."
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button @click="cancelEditing" class="btn-secondary">
              Cancel
            </button>
            <button 
              @click="saveProfile" 
              :disabled="loading || !fullName.trim()"
              class="btn-primary"
            >
              <Icon 
                :icon="loading ? 'lucide:loader-2' : 'lucide:save'" 
                :class="['btn-icon', { spinning: loading }]"
              />
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <!-- View Mode -->
        <div v-else class="profile-view">
          <div class="profile-section">
            <h4 class="section-title">Profile Information</h4>
            <div class="info-item">
              <Icon icon="lucide:user" class="info-icon" />
              <div class="info-content">
                <span class="info-label">Full Name</span>
                <span class="info-value">{{ displayName }}</span>
              </div>
            </div>
            
            <div class="info-item">
              <Icon icon="lucide:mail" class="info-icon" />
              <div class="info-content">
                <span class="info-label">Email</span>
                <span class="info-value">{{ user?.email }}</span>
              </div>
            </div>
            
            <div v-if="bio" class="info-item">
              <Icon icon="lucide:file-text" class="info-icon" />
              <div class="info-content">
                <span class="info-label">Bio</span>
                <span class="info-value">{{ bio }}</span>
              </div>
            </div>
          </div>

          <div class="profile-section">
            <h4 class="section-title">Account</h4>
            <div class="info-item">
              <Icon icon="lucide:calendar" class="info-icon" />
              <div class="info-content">
                <span class="info-label">Member Since</span>
                <span class="info-value">
                  {{ new Date(user?.created_at || '').toLocaleDateString() }}
                </span>
              </div>
            </div>
            
            <div class="info-item">
              <Icon icon="lucide:shield-check" class="info-icon" />
              <div class="info-content">
                <span class="info-label">Email Verified</span>
                <span class="info-value">
                  {{ user?.email_confirmed_at ? 'Yes' : 'No' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="profile-footer">
        <button @click="isEditing ? cancelEditing() : startEditing()" class="btn-secondary">
          <Icon :icon="isEditing ? 'lucide:x' : 'lucide:edit'" class="btn-icon" />
          {{ isEditing ? 'Cancel' : 'Edit Profile' }}
        </button>
        
        <button @click="handleSignOut" class="btn-danger">
          <Icon icon="lucide:log-out" class="btn-icon" />
          Sign Out
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(2px);
  width: 100%;
  text-align: left;
}

.profile-btn:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: color-mix(in oklab, var(--color-border), var(--color-primary) 20%);
  transform: translateY(-1px);
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 8px;
  color: #fff;
}

.avatar-icon {
  font-size: 16px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  line-height: 1;
}

.profile-email {
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1;
}

.chevron-icon {
  font-size: 14px;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.profile-btn:hover .chevron-icon {
  transform: rotate(180deg);
}

/* Profile Modal */
.profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.profile-modal {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(2px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 24px 0;
  margin-bottom: 24px;
}

.profile-avatar-large {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 16px;
  color: #fff;
}

.avatar-icon-large {
  font-size: 24px;
}

.profile-details {
  flex: 1;
}

.profile-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 4px;
}

.profile-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: color-mix(in oklab, var(--color-border), var(--color-primary) 20%);
  color: var(--color-text);
}

.close-icon {
  font-size: 18px;
}

.profile-content {
  padding: 0 24px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.profile-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
}

.info-item:last-child {
  border-bottom: none;
}

.info-icon {
  font-size: 16px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

.profile-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--color-border);
  margin-top: 24px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  flex: 1;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover {
  background: color-mix(in oklab, var(--color-surface), transparent 10%);
  border-color: color-mix(in oklab, var(--color-border), var(--color-primary) 20%);
}

.btn-danger {
  background: color-mix(in oklab, #ef4444, transparent 90%);
  border: 1px solid color-mix(in oklab, #ef4444, transparent 70%);
  color: color-mix(in oklab, #ef4444, white 30%);
}

.btn-danger:hover {
  background: color-mix(in oklab, #ef4444, transparent 80%);
  border-color: color-mix(in oklab, #ef4444, transparent 55%);
}

.btn-icon {
  font-size: 16px;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 480px) {
  .profile-modal {
    margin: 10px;
    max-width: none;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .form-actions,
  .profile-footer {
    flex-direction: column;
  }
}
</style>
