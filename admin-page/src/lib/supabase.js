// Supabase client configuration for admin-page
import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Global reference to prevent multiple instances during HMR
if (!globalThis.supabaseClients) {
  globalThis.supabaseClients = {};
}

// Create regular Supabase client for normal operations (singleton)
if (!globalThis.supabaseClients.main) {
  globalThis.supabaseClients.main = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'admin-dashboard-auth',
    },
    db: {
      schema: 'public'
    }
  });
}

export const supabase = globalThis.supabaseClients.main;

// Database connection information
export const dbConfig = {
  url: import.meta.env.VITE_SUPABASE_DB_URL,
  password: import.meta.env.VITE_SUPABASE_DB_PASSWORD,
  userEmail: import.meta.env.VITE_SUPABASE_USER_EMAIL,
  projectUrl: supabaseUrl,
  anonKey: supabaseAnonKey
}

// Helper function to test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase connection test failed:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase',
      count: data
    }
  } catch (error) {
    console.error('Supabase connection test error:', error)
    return { success: false, error: error.message }
  }
}

// Export default client
export default supabase
