import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { Profile, EloHistoryEntry } from '@/types';

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function useEloHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ['elo-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('elo_history')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as EloHistoryEntry[];
    },
    enabled: !!userId,
  });
}

export function useRankings(groupId?: string) {
  return useQuery({
    queryKey: ['rankings', groupId],
    queryFn: async () => {
      if (groupId) {
        const { data: members } = await supabase
          .from('group_members')
          .select('profile:profiles(*)')
          .eq('group_id', groupId);

        const profiles = (members ?? []).map((m) => m.profile as unknown as Profile);
        return profiles.sort((a, b) => b.elo_rating - a.elo_rating);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('elo_rating', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });
}

export function usePlayerMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ['player-matches', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('match_players')
        .select('*, match:matches(*)')
        .eq('user_id', userId!)
        .order('match(created_at)', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}
