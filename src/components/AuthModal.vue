<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

// Modal state
const isOpen = ref(false)
const mode = ref<'signin' | 'signup' | 'reset'>('signin')

// Form data
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const error = ref('')
const success = ref('')

// Computed
const isSignUp = computed(() => mode.value === 'signup')
const isReset = computed(() => mode.value === 'reset')
const canSubmit = computed(() => {
  if (isReset.value) return email.value.trim().length > 0
  if (isSignUp.value) {
    return email.value.trim().length > 0 && 
           password.value.length >= 6 && 
           password.value === confirmPassword.value &&
           fullName.value.trim().length > 0
  }
  return email.value.trim().length > 0 && password.value.length >= 6
})

// Methods
const openModal = (modalMode: 'signin' | 'signup' | 'reset' = 'signin') => {
  mode.value = modalMode
  isOpen.value = true
  clearForm()
}

const closeModal = () => {
  isOpen.value = false
  clearForm()
}

const clearForm = () => {
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  fullName.value = ''
  error.value = ''
  success.value = ''
}

const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
  mode.value = newMode
  clearForm()
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  error.value = ''
  success.value = ''

  try {
    if (isReset.value) {
      const { error: resetError } = await authStore.resetPassword(email.value)
      if (resetError) throw resetError
      success.value = 'Password reset email sent! Check your inbox.'
    } else if (isSignUp.value) {
      const { error: signUpError } = await authStore.signUp(email.value, password.value, {
        full_name: fullName.value
      })
      if (signUpError) throw signUpError
      success.value = 'Account created! Please check your email to verify your account.'
    } else {
      const { error: signInError } = await authStore.signIn(email.value, password.value)
      if (signInError) throw signInError
      closeModal()
    }
  } catch (err: any) {
    error.value = err.message || 'An error occurred. Please try again.'
  }
}

const handleOAuthSignIn = async (provider: 'google' | 'github' | 'discord') => {
  error.value = ''
  try {
    const { error: oauthError } = await authStore.signInWithProvider(provider)
    if (oauthError) throw oauthError
  } catch (err: any) {
    error.value = err.message || 'OAuth sign in failed. Please try again.'
  }
}

// Expose methods for parent components
defineExpose({
  openModal,
  closeModal
})
</script>

<template>
  <!-- Modal Overlay -->
  <div 
    v-if="isOpen" 
    class="modal-overlay"
    @click="closeModal"
  >
    <div 
      class="modal-container"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          <Icon icon="lucide:zap" class="title-icon" />
          {{ isReset ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back' }}
        </h2>
        <button @click="closeModal" class="close-btn">
          <Icon icon="lucide:x" class="close-icon" />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Error/Success Messages -->
        <div v-if="error" class="message error">
          <Icon icon="lucide:alert-circle" class="message-icon" />
          {{ error }}
        </div>
        
        <div v-if="success" class="message success">
          <Icon icon="lucide:check-circle" class="message-icon" />
          {{ success }}
        </div>

        <!-- Auth Form -->
        <form @submit.prevent="handleSubmit" class="auth-form">
          <!-- Full Name (Sign Up only) -->
          <div v-if="isSignUp" class="form-group">
            <label class="form-label">Full Name</label>
            <input
              v-model="fullName"
              type="text"
              class="form-input"
              placeholder="Enter your full name"
              required
            />
          </div>

          <!-- Email -->
          <div class="form-group">
            <label class="form-label">Email</label>
            <input
              v-model="email"
              type="email"
              class="form-input"
              placeholder="Enter your email"
              required
            />
          </div>

          <!-- Password (not for reset) -->
          <div v-if="!isReset" class="form-group">
            <label class="form-label">Password</label>
            <input
              v-model="password"
              type="password"
              class="form-input"
              placeholder="Enter your password"
              :minlength="6"
              required
            />
          </div>

          <!-- Confirm Password (Sign Up only) -->
          <div v-if="isSignUp" class="form-group">
            <label class="form-label">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              class="form-input"
              placeholder="Confirm your password"
              :minlength="6"
              required
            />
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="!canSubmit || authStore.loading"
            class="submit-btn"
          >
            <Icon 
              :icon="authStore.loading ? 'lucide:loader-2' : isReset ? 'lucide:mail' : isSignUp ? 'lucide:user-plus' : 'lucide:log-in'" 
              :class="['btn-icon', { spinning: authStore.loading }]"
            />
            {{ authStore.loading ? 'Please wait...' : isReset ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In' }}
          </button>
        </form>

        <!-- OAuth Buttons (Sign In/Sign Up only) -->
        <div v-if="!isReset" class="oauth-section">
          <div class="divider">
            <span class="divider-text">or continue with</span>
          </div>
          
          <div class="oauth-buttons">
            <button 
              @click="handleOAuthSignIn('google')"
              class="oauth-btn google"
              :disabled="authStore.loading"
            >
              <Icon icon="lucide:chrome" class="oauth-icon" />
              Google
            </button>
            
            <button 
              @click="handleOAuthSignIn('github')"
              class="oauth-btn github"
              :disabled="authStore.loading"
            >
              <Icon icon="lucide:github" class="oauth-icon" />
              GitHub
            </button>
            
            <button 
              @click="handleOAuthSignIn('discord')"
              class="oauth-btn discord"
              :disabled="authStore.loading"
            >
              <Icon icon="lucide:message-circle" class="oauth-icon" />
              Discord
            </button>
          </div>
        </div>

        <!-- Mode Switcher -->
        <div class="mode-switcher">
          <span class="switch-text">
            {{ isReset ? 'Remember your password?' : isSignUp ? 'Already have an account?' : "Don't have an account?" }}
          </span>
          <button 
            v-if="!isReset"
            @click="switchMode(isSignUp ? 'signin' : 'signup')"
            class="switch-btn"
          >
            {{ isSignUp ? 'Sign In' : 'Sign Up' }}
          </button>
          <button 
            v-if="!isReset"
            @click="switchMode('reset')"
            class="switch-btn"
          >
            Forgot Password?
          </button>
          <button 
            v-if="isReset"
            @click="switchMode('signin')"
            class="switch-btn"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
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

.modal-container {
  background: rgba(15, 15, 25, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  backdrop-filter: blur(2px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 1.5rem;
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
  font-size: 1.25rem;
  color: #8b5cf6;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
  color: #e2e8f0;
}

.close-icon {
  font-size: 18px;
}

.modal-content {
  padding: 0 24px 24px;
}

.message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.message-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
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

.form-input {
  padding: 12px 16px;
  background: rgba(15, 15, 25, 0.8);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 14px;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-input::placeholder {
  color: #64748b;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 18px;
}

.btn-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.oauth-section {
  margin-bottom: 24px;
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(139, 92, 246, 0.2);
}

.divider-text {
  padding: 0 16px;
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
}

.oauth-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 10px;
  background: rgba(15, 15, 25, 0.6);
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.oauth-btn:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-1px);
}

.oauth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.oauth-btn.google:hover:not(:disabled) {
  background: rgba(66, 133, 244, 0.1);
  border-color: rgba(66, 133, 244, 0.4);
}

.oauth-btn.github:hover:not(:disabled) {
  background: rgba(36, 41, 46, 0.1);
  border-color: rgba(36, 41, 46, 0.4);
}

.oauth-btn.discord:hover:not(:disabled) {
  background: rgba(114, 137, 218, 0.1);
  border-color: rgba(114, 137, 218, 0.4);
}

.oauth-icon {
  font-size: 16px;
}

.mode-switcher {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(139, 92, 246, 0.1);
}

.switch-text {
  font-size: 14px;
  color: #94a3b8;
  margin-right: 8px;
}

.switch-btn {
  background: none;
  border: none;
  color: #8b5cf6;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.switch-btn:hover {
  color: #a855f7;
}

/* Responsive Design */
@media (max-width: 480px) {
  .modal-container {
    margin: 10px;
    max-width: none;
  }
  
  .oauth-buttons {
    grid-template-columns: 1fr;
  }
  
  .mode-switcher {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
