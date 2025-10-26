// Environment configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Dreamer',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  }
}

// Validate required environment variables
if (!config.supabase.url || !config.supabase.anonKey) {
  console.warn('[Config] Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file')
}
