import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Check if user wants to be remembered (default to true for better UX)
const rememberMe = (localStorage.getItem('remember_me') ?? '1') === '1';

// Use localStorage if remembered, sessionStorage if not
const baseStorage = rememberMe ? window.localStorage : window.sessionStorage;

// Create a custom storage implementation
const customStorage = {
  getItem: (key: string) => {
    return baseStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    baseStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    baseStorage.removeItem(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export the URL for use in API calls
export { supabaseUrl };

// Optional: Export types for database tables
// You can generate these types from your Supabase schema using:
// npx supabase gen types typescript --project-id "ozkgkgqahgwuwmohslsr" > src/types/supabase.ts
export type Database = {
  // Add your database types here
};
