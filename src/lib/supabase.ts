import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getApiUrl } from './apiConfig';

declare const __XPATAGONIA_SUPABASE_URL__: string | undefined;
declare const __XPATAGONIA_SUPABASE_ANON_KEY__: string | undefined;

function readBuildSupabaseUrl(): string {
  try {
    if (typeof __XPATAGONIA_SUPABASE_URL__ !== 'undefined' && __XPATAGONIA_SUPABASE_URL__) {
      return __XPATAGONIA_SUPABASE_URL__.trim();
    }
  } catch {
    // ignore
  }
  try {
    return (import.meta.env.VITE_SUPABASE_URL || '').trim();
  } catch {
    return '';
  }
}

function readBuildSupabaseAnonKey(): string {
  try {
    if (
      typeof __XPATAGONIA_SUPABASE_ANON_KEY__ !== 'undefined' &&
      __XPATAGONIA_SUPABASE_ANON_KEY__
    ) {
      return __XPATAGONIA_SUPABASE_ANON_KEY__.trim();
    }
  } catch {
    // ignore
  }
  try {
    return (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  } catch {
    return '';
  }
}

export function isValidSupabaseConfig(url: string, key: string): boolean {
  try {
    if (
      url &&
      (url.startsWith('http://') || url.startsWith('https://')) &&
      key.length > 20 &&
      !key.includes('placeholder')
    ) {
      new URL(url);
      return true;
    }
  } catch {
    // invalid URL format
  }
  return false;
}

function createResilientFallbackClient(): SupabaseClient {
  const emptyListResult = { data: [] as any[], error: null };
  const emptySingleResult = { data: null, error: null };

  const createQueryBuilder = (isSingle = false): any => {
    const promise = Promise.resolve(isSingle ? emptySingleResult : emptyListResult);
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      neq: () => builder,
      lt: () => builder,
      lte: () => builder,
      gt: () => builder,
      gte: () => builder,
      in: () => builder,
      contains: () => builder,
      order: () => builder,
      limit: () => builder,
      single: () => createQueryBuilder(true),
      maybeSingle: () => createQueryBuilder(true),
      then: (onfulfilled?: any, onrejected?: any) => promise.then(onfulfilled, onrejected),
      catch: (onrejected?: any) => promise.catch(onrejected),
      finally: (onfinally?: any) => promise.finally(onfinally),
    };
    return builder;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase no configurado en este entorno'),
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase no configurado en este entorno'),
      }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: new Error(
          'Supabase Auth no está configurado en este entorno (faltan SUPABASE_URL/VITE_SUPABASE_URL y SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY).'
        ),
      }),
      signInWithOtp: async () => ({
        data: null,
        error: new Error(
          'Supabase Auth no está configurado en este entorno (faltan SUPABASE_URL/VITE_SUPABASE_URL y SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY).'
        ),
      }),
      updateUser: async () => ({
        data: { user: null },
        error: new Error('Supabase Auth no está configurado en este entorno.'),
      }),
      setSession: async () => ({ data: { user: null, session: null }, error: null }),
      exchangeCodeForSession: async () => ({ data: { user: null, session: null }, error: null }),
    },
    from: () => ({
      select: () => createQueryBuilder(false),
      insert: () => createQueryBuilder(true),
      update: () => createQueryBuilder(false),
      delete: () => createQueryBuilder(false),
      upsert: () => createQueryBuilder(false),
    }),
  } as unknown as SupabaseClient;
}

function buildClient(url: string, key: string): SupabaseClient | null {
  if (!isValidSupabaseConfig(url, key)) return null;
  try {
    return createClient(url, key, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    });
  } catch (err) {
    console.warn('[XPATAGONIA] Could not initialize standard Supabase client:', err);
    return null;
  }
}

const initialUrl = readBuildSupabaseUrl();
const initialKey = readBuildSupabaseAnonKey();

export let isSupabaseConfigured: boolean = isValidSupabaseConfig(initialUrl, initialKey);
let activeClient: SupabaseClient =
  buildClient(initialUrl, initialKey) || createResilientFallbackClient();

export const SUPABASE_READY_EVENT = 'xpatagonia:supabase-ready';

export function getIsSupabaseConfigured(): boolean {
  return isSupabaseConfigured;
}

let runtimeBootstrapPromise: Promise<boolean> | null = null;

/**
 * If Vercel has SUPABASE_URL / SUPABASE_ANON_KEY defined in runtime serverless env
 * without VITE_ prefix or build-time injection, hydrate them dynamically via /api/public-config.
 */
export async function ensureSupabaseConfigured(): Promise<boolean> {
  if (isSupabaseConfigured) return true;
  if (typeof window === 'undefined') return false;
  if (runtimeBootstrapPromise) return runtimeBootstrapPromise;

  runtimeBootstrapPromise = (async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/public-config`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return false;
      const cfg = await res.json().catch(() => null);
      const runtimeUrl = String(cfg?.supabaseUrl || '').trim();
      const runtimeKey = String(cfg?.supabaseAnonKey || '').trim();
      const nextClient = buildClient(runtimeUrl, runtimeKey);
      if (nextClient) {
        activeClient = nextClient;
        isSupabaseConfigured = true;
        window.dispatchEvent(new CustomEvent(SUPABASE_READY_EVENT, { detail: true }));
        return true;
      }
    } catch {
      // ignore network timeout
    } finally {
      if (!isSupabaseConfigured) {
        runtimeBootstrapPromise = null;
      }
    }
    return false;
  })();

  return runtimeBootstrapPromise;
}

// Kick off runtime config hydration automatically in browser if build-time vars were empty
if (typeof window !== 'undefined' && !isSupabaseConfigured) {
  void ensureSupabaseConfigured();
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = (activeClient as any)[prop];
    return typeof value === 'function' ? value.bind(activeClient) : value;
  },
});
