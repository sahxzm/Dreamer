import { createClient } from '@supabase/supabase-js'
import { config } from '../config/env'

// Create a mock Supabase client if environment variables are missing
const createMockClient = () => {
  console.warn('Using mock Supabase client - check your environment variables')
  return {
    auth: {
      getSession: async () => ({
        data: { session: null }, 
        error: { message: 'Supabase not configured - check environment variables' }
      }),
      onAuthStateChange: (callback: any) => {
        console.warn('Auth state changes not available in mock mode')
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signUp: async () => ({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured - check environment variables' } 
      }),
      signInWithPassword: async () => ({ 
        data: { user: null, session: null }, 
        error: { message: 'Supabase not configured - check environment variables' } 
      }),
      signOut: async () => ({ 
        error: { message: 'Supabase not configured - check environment variables' } 
      })
    },
    from: (table: string) => {
      console.warn(`Supabase table access (${table}) not available in mock mode`)
      return {
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ 
              data: [], 
              error: { message: 'Supabase not configured - check environment variables' } 
            }) 
          })
        }),
        insert: () => Promise.resolve({ 
          data: null, 
          error: { message: 'Supabase not configured - check environment variables' } 
        }),
        update: () => ({
          eq: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured - check environment variables' } 
          }) 
        }),
        delete: () => ({
          eq: () => Promise.resolve({ 
            data: null, 
            error: { message: 'Supabase not configured - check environment variables' } 
          }) 
        })
      }
    }
  }
}

// Check for required environment variables
const isSupabaseConfigured = config.supabase?.url && config.supabase?.anonKey

if (!isSupabaseConfigured) {
  console.error('Supabase URL or anon key is missing. Check your environment variables.')
}

export const supabase = isSupabaseConfigured
  ? createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : createMockClient() as any
