/**
 * supabaseClient.js - Supabase Client Configuration
 * 
 * This client configuration matches the same setup used in bu-book
 * to ensure data consistency across the project.
 */

import { createClient } from '@supabase/supabase-js';

// These should match the same environment variables used in bu-book
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://your-project.supabase.co' && 
         supabaseAnonKey !== 'your-anon-key' &&
         supabaseUrl.includes('supabase.co');
};

export default supabase;
