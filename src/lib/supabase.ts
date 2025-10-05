import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Check if user wants to be remembered (default to true for better UX)
const rememberMe = (localStorage.getItem('remember_me') ?? '1') === '1';
console.log('🔐 Remember me:', rememberMe);

// Use localStorage if remembered, sessionStorage if not
const baseStorage = rememberMe ? window.localStorage : window.sessionStorage;

// Create a custom storage implementation that logs every operation
const customStorage = {
  getItem: (key: string) => {
    const value = baseStorage.getItem(key);
    console.log('📥 [Storage] GET:', key, 'exists:', !!value, 'storage:', rememberMe ? 'localStorage' : 'sessionStorage');
    return value;
  },
  setItem: (key: string, value: string) => {
    console.log('💾 [Storage] SET:', key, 'length:', value.length, 'storage:', rememberMe ? 'localStorage' : 'sessionStorage');
    baseStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    console.log('🗑️ [Storage] REMOVE:', key, 'storage:', rememberMe ? 'localStorage' : 'sessionStorage');
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

// Debug: Check if storage is working and if session exists
console.log('LocalStorage working:', !!window.localStorage);
console.log('SessionStorage working:', !!window.sessionStorage);

// Check what's in storage immediately
const checkStorage = () => {
  const localKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
  const sessionKeys = Object.keys(sessionStorage).filter(k => k.includes('supabase'));
  console.log('📦 Total Supabase keys in localStorage:', localKeys.length);
  console.log('📦 Total Supabase keys in sessionStorage:', sessionKeys.length);

  if (rememberMe) {
    localKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log(`Storage [${key}]:`, value ? value.substring(0, 100) + '...' : 'null');
    });
  } else {
    sessionKeys.forEach(key => {
      const value = sessionStorage.getItem(key);
      console.log(`Storage [${key}]:`, value ? value.substring(0, 100) + '...' : 'null');
    });
  }
};

checkStorage();

// Optional: Export types for database tables
// You can generate these types from your Supabase schema using:
// npx supabase gen types typescript --project-id "ozkgkgqahgwuwmohslsr" > src/types/supabase.ts
export type Database = {
  // Add your database types here
};
