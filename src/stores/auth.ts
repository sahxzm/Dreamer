import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../api/supabase'
import { useLocalStorage } from '../utils/storage'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  // State with persistence
  const user = useLocalStorage<User | null>('auth:user', null)
  const session = useLocalStorage<any>('auth:session', null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = useLocalStorage<boolean>('auth:initialized', false)

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
      supabase.auth.onAuthStateChange((_event, newSession) => {
        // Update reactive refs with latest session
        session.value = newSession || null
        user.value = newSession?.user ?? null
        
        // Save to localStorage for auto-login
        if (newSession) {
          localStorage.setItem('dreamer_session', JSON.stringify(newSession))
        } else {
          localStorage.removeItem('dreamer_session')
        }
      })

      initialized.value = true
    } catch (error) {
      console.error('Error initializing auth:', error)
      // Don't fail the entire app if auth fails
      initialized.value = true
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
      // Immediately hydrate local auth state; do not rely solely on onAuthStateChange
      if (data?.session) {
        session.value = data.session
        // Prefer explicit user if provided, otherwise derive from session
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signedInUser = (data as any).user ?? data.session.user
        user.value = signedInUser ?? null
        // Persist for auto-login
        localStorage.setItem('dreamer_session', JSON.stringify(data.session))
      }
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
      // Skip if already initialized
      if (initialized.value) {
        return { session: session.value, user: user.value }
      }

      loading.value = true
      const { data, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (data?.session) {
        session.value = data.session
        user.value = data.session.user as User
      } else {
        session.value = null
        user.value = null
      }
      
      initialized.value = true
      return { session: data.session, user: data.session?.user || null }
    } catch (err) {
      console.error('Error restoring session:', err)
      error.value = err instanceof Error ? err.message : 'Failed to restore session'
      session.value = null
      user.value = null
      initialized.value = true
      return { session: null, user: null }
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    user,
    session,
    loading,
    error,
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
