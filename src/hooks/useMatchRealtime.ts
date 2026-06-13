import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMatchStore } from '@/stores/match.store';
import type { Match, MatchPoint } from '@/types';

export function useMatchRealtime(matchId: string | undefined) {
  const { updateMatch, addPoint, setPoints } = useMatchStore();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`match-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          updateMatch(payload.new as Match);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_points', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const point = payload.new as MatchPoint;
          if (point.event_type === 'point') {
            addPoint(point);
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'match_points', filter: `match_id=eq.${matchId}` },
        async () => {
          const { data } = await supabase
            .from('match_points')
            .select('*')
            .eq('match_id', matchId)
            .eq('event_type', 'point')
            .order('point_number', { ascending: true });
          setPoints(data ?? []);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [matchId, updateMatch, addPoint, setPoints]);
}

export function useMatchRealtimeBySlug(slug: string | undefined) {
  const matchIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    supabase
      .from('matches')
      .select('id')
      .eq('public_slug', slug)
      .single()
      .then(({ data }) => {
        if (data) matchIdRef.current = data.id;
      });
  }, [slug]);

  useMatchRealtime(matchIdRef.current ?? undefined);
}
