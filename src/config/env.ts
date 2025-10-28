// Environment configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://rxrnidbdzcpgiytmypgd.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cm5pZGJkemNwZ2l5dG15cGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0ODAxMjQsImV4cCI6MjA3NzA1NjEyNH0.PFwaXI9hIOTR02wWvsBCzbWGyPxZjSpkrC9lN3UgZJo',
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
