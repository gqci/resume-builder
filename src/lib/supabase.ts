import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Add logging for Supabase operations
export const logSupabaseError = (operation: string, error: any) => {
  console.error(`Supabase ${operation} error:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
};