import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { useMatchBySlug } from '@/features/matches/hooks/useMatches';
import { useMatchRealtime } from '@/hooks/useMatchRealtime';
import { Scoreboard } from '@/features/matches/components/Scoreboard';
import { PointTimeline } from '@/features/matches/components/PointTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDuration } from '@/lib/utils';
import { useMatchStore } from '@/stores/match.store';
import { supabase } from '@/lib/supabase/client';

export function PublicMatchPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, refetch } = useMatchBySlug(slug);
  const { setMatch, setPlayers, setPoints, match: storeMatch, points } = useMatchStore();
  const [matchId, setMatchId] = useState<string | undefined>();

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('matches')
      .select('id')
      .eq('public_slug', slug)
      .single()
      .then(({ data: m }) => {
        if (m) setMatchId(m.id);
      });
  }, [slug]);

  useMatchRealtime(matchId);

  useEffect(() => {
    if (data) {
      setMatch(data.match);
      setPlayers(data.players);
      setPoints(data.points);
    }
  }, [data, setMatch, setPlayers, setPoints]);

  useEffect(() => {
    if (!matchId) return;
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [matchId, refetch]);

  const match = storeMatch ?? data?.match;
  const players = data?.players ?? [];
  const displayPoints = points.length > 0 ? points : (data?.points ?? []);

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-50 p-4">
        <div className="mx-auto max-w-lg space-y-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">
        Match not found
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="safe-top safe-x border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="font-bold text-slate-900">Live Match</h1>
            <p className="text-xs text-slate-500">{match.format.toUpperCase()}</p>
          </div>
          <Badge variant={match.status === 'in_progress' ? 'success' : 'outline'}>
            {match.status === 'in_progress' ? 'LIVE' : match.status.replace('_', ' ')}
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-5 p-4 pb-8">
        <Scoreboard match={match} players={players} />

        {match.started_at && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            {formatDuration(match.started_at, match.completed_at)}
          </div>
        )}

        {match.status === 'completed' && match.winner_team && (
          <div className="rounded-2xl bg-green-100 p-4 text-center">
            <p className="text-xl font-bold text-green-800">Team {match.winner_team} Wins!</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <PointTimeline points={displayPoints} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{p.profile?.display_name}</span>
                <Badge variant="outline">Team {p.team}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
