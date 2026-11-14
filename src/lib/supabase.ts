import { createClient, SupabaseClient } from '@supabase/supabase-js';

const metaEnv = ((import.meta as any)?.env ?? {}) as Record<string, string | undefined>;
const rawUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
const rawKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(url: string): boolean {
  try {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      new URL(url);
      return true;
    }
  } catch {
    // invalid URL format
  }
  return false;
}

export const isSupabaseConfigured: boolean =
  isValidHttpUrl(rawUrl) &&
  rawKey.length > 20 &&
  !rawKey.includes('placeholder');

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
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase no configurado en este entorno') }),
      signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase no configurado en este entorno') }),
      signOut: async () => ({ error: null }),
      resetPasswordForEmail: async () => ({
        data: null,
        error: new Error('Supabase Auth no está configurado en este entorno (faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).'),
      }),
      signInWithOtp: async () => ({
        data: null,
        error: new Error('Supabase Auth no está configurado en este entorno (faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).'),
      }),
      updateUser: async () => ({
        data: { user: null },
        error: new Error('Supabase Auth no está configurado en este entorno.'),
      }),
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

function initSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    return createResilientFallbackClient();
  }

  try {
    return createClient(rawUrl, rawKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      }
    });
  } catch (err) {
    console.warn('[XPATAGONIA] Could not initialize standard Supabase client, using resilient fallback client:', err);
    return createResilientFallbackClient();
  }
}

export const supabase = initSupabase();
