import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import type { Profile } from '@/types';

export function useAuth() {
  const { session, user, profile, loading, setSession, setProfile, setLoading, reset } =
    useAuthStore();
  const fetchingRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        void fetchProfile();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        void fetchProfile();
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, setLoading, reset]);

  async function fetchProfile() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      // SECURITY DEFINER RPC — works even when profile row is missing
      const { data: ensured, error: rpcError } = await supabase.rpc('ensure_user_profile');

      if (!rpcError && ensured) {
        setProfile(ensured as Profile);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const u = userData.user;
      if (!u) return;

      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();

      if (data) {
        setProfile(data);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: u.id,
          display_name:
            u.user_metadata?.full_name ??
            u.user_metadata?.name ??
            u.email?.split('@')[0] ??
            'Player',
          avatar_url: u.user_metadata?.avatar_url ?? u.user_metadata?.picture ?? null,
          email: u.email ?? '',
        })
        .select()
        .single();

      if (!insertError && inserted) {
        setProfile(inserted);
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    reset();
  }

  return { session, user, profile, loading, signInWithGoogle, signOut, isAuthenticated: !!session };
}
