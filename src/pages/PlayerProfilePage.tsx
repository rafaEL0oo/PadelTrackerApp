import { useParams } from 'react-router-dom';
import { useProfile, useEloHistory, usePlayerMatches } from '@/features/players/hooks/usePlayers';
import { PlayerStatsCards } from '@/features/players/components/RankingTable';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatWinRate } from '@/lib/utils';

export function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const { data: profile, isLoading } = useProfile(playerId);
  const { data: eloHistory } = useEloHistory(playerId);
  const { data: matchHistory } = usePlayerMatches(playerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!profile) {
    return <div className="py-12 text-center text-slate-400">Player not found</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
        <Avatar src={profile.avatar_url} name={profile.display_name} size="xl" />
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{profile.display_name}</h1>
        <p className="text-sm text-slate-500">{profile.email}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-3xl font-black text-teal-600">{profile.elo_rating}</span>
          <span className="text-sm text-slate-400">Elo Rating</span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatWinRate(profile.wins, profile.matches_played)}% win rate
        </p>
      </div>

      <PlayerStatsCards profile={profile} />

      <Card>
        <CardHeader>
          <CardTitle>Elo History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {eloHistory?.length === 0 ? (
            <p className="text-sm text-slate-400">No rating changes yet</p>
          ) : (
            eloHistory?.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {entry.rating_before} → {entry.rating_after}
                </span>
                <Badge variant={entry.change_amount >= 0 ? 'success' : 'destructive'}>
                  {entry.change_amount >= 0 ? '+' : ''}{entry.change_amount}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {matchHistory?.length === 0 ? (
            <p className="text-sm text-slate-400">No matches yet</p>
          ) : (
            matchHistory?.map((mp) => {
              const m = mp.match as { status: string; format: string; winner_team: string | null };
              return (
                <div key={mp.id} className="flex items-center justify-between text-sm">
                  <span>{m.format.toUpperCase()}</span>
                  <Badge variant="outline">{m.status.replace('_', ' ')}</Badge>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
