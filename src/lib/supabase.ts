import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Create a custom storage implementation that logs every operation
const customStorage = {
  getItem: (key: string) => {
    const value = window.localStorage.getItem(key);
    console.log('📥 [Storage] GET:', key, 'exists:', !!value);
    return value;
  },
  setItem: (key: string, value: string) => {
    console.log('💾 [Storage] SET:', key, 'length:', value.length);
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    console.log('🗑️ [Storage] REMOVE:', key);
    window.localStorage.removeItem(key);
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

// Debug: Check if localStorage is working and if session exists
console.log('LocalStorage working:', !!window.localStorage);
console.log('Stored session keys:', Object.keys(localStorage).filter(k => k.includes('supabase')));

// Check what's in storage immediately
const checkStorage = () => {
  const keys = Object.keys(localStorage).filter(k => k.includes('supabase'));
  console.log('📦 Total Supabase keys in storage:', keys.length);
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`Storage [${key}]:`, value ? value.substring(0, 100) + '...' : 'null');
  });
};

checkStorage();

// Optional: Export types for database tables
// You can generate these types from your Supabase schema using:
// npx supabase gen types typescript --project-id "ozkgkgqahgwuwmohslsr" > src/types/supabase.ts
export type Database = {
  // Add your database types here
};
