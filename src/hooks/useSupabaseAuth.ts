import { useEffect, useState } from 'react';
import { supabase, ensureSupabaseConfigured } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      await ensureSupabaseConfigured();
      if (!active) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }

      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        if (active) {
          setUser(nextSession?.user ?? null);
        }
      });
      subscription = data.subscription;
    };

    void initAuth();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  return { user, loading };
}
