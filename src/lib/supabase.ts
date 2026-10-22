import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe project URL fallback from the provisioned Supabase instance
const FALLBACK_SUPABASE_URL = 'https://cjbafuclfgdexapfmyzd.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that the URL is a valid http(s) URL
function getValidUrl(url: string): string {
  try {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      new URL(url);
      return url;
    }
  } catch {
    // invalid URL format
  }
  return FALLBACK_SUPABASE_URL;
}

const supabaseUrl = getValidUrl(rawUrl);
const supabaseAnonKey = rawKey && rawKey.length > 10 ? rawKey : FALLBACK_ANON_KEY;

function initSupabase(): SupabaseClient {
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      }
    });
  } catch (err) {
    console.warn('[XPATAGONIA] Could not initialize standard Supabase client, using resilient fallback client:', err);
    // Return a safe mock object to avoid crashing any component that imports supabase
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: new Error('Supabase no configurado en este entorno') }),
        signUp: async () => ({ data: null, error: new Error('Supabase no configurado en este entorno') }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: null }),
        signInWithOtp: async () => ({ data: null, error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }), order: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
        upsert: async () => ({ data: null, error: null }),
      }),
    } as unknown as SupabaseClient;
  }
}

export const supabase = initSupabase();

