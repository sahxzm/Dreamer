import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabase'
import type { User, Session } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const isInitialized = computed(() => initialized.value)

  // Actions
  const initializeAuth = async () => {
    if (initialized.value) return

    loading.value = true
    try {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession()
      
      if (initialSession) {
        session.value = initialSession
        user.value = initialSession.user
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        session.value = session
        user.value = session?.user ?? null
        
        // Save to localStorage for auto-login
        if (session) {
          localStorage.setItem('dreamer_session', JSON.stringify(session))
        } else {
          localStorage.removeItem('dreamer_session')
        }
      })

      initialized.value = true
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email: string, password: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signInWithProvider = async (provider: 'google' | 'github' | 'discord') => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      user.value = null
      session.value = null
      localStorage.removeItem('dreamer_session')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (email: string) => {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: any) => {
    if (!user.value) return { data: null, error: new Error('No user logged in') }

    loading.value = true
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      return { data: null, error }
    } finally {
      loading.value = false
    }
  }

  // Auto-login from localStorage
  const restoreSession = async () => {
    try {
      const storedSession = localStorage.getItem('dreamer_session')
      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (currentSession && currentSession.access_token === sessionData.access_token) {
          session.value = currentSession
          user.value = currentSession.user
        } else {
          // Session expired, clear localStorage
          localStorage.removeItem('dreamer_session')
        }
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      localStorage.removeItem('dreamer_session')
    }
  }

  return {
    // State
    user,
    session,
    loading,
    initialized,
    
    // Getters
    isAuthenticated,
    isInitialized,
    
    // Actions
    initializeAuth,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updateProfile,
    restoreSession
  }
})
