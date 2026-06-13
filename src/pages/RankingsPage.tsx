import { RankingTable } from '@/features/players/components/RankingTable';
import { useRankings } from '@/features/players/hooks/usePlayers';
import { Skeleton } from '@/components/ui/skeleton';

export function RankingsPage() {
  const { data: profiles, isLoading } = useRankings();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rankings</h1>
        <p className="text-sm text-slate-500">Global Elo leaderboard</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <RankingTable profiles={profiles ?? []} />
      )}
    </div>
  );
}
