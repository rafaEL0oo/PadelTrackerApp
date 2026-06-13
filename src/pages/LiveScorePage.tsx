import { useParams } from 'react-router-dom';
import { useMatch } from '@/features/matches/hooks/useMatches';
import { LiveScoreScreen } from '@/features/scoring/components/LiveScoreScreen';
import { Spinner } from '@/components/ui/skeleton';
import { useMatchStore } from '@/stores/match.store';

export function LiveScorePage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data, isLoading } = useMatch(matchId);
  const { match: storeMatch } = useMatchStore();

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-900">
        <Spinner />
      </div>
    );
  }

  const match = storeMatch ?? data?.match;
  const players = data?.players ?? [];

  if (!match || match.status !== 'in_progress') {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-900 text-white">
        <p>Match is not in progress</p>
      </div>
    );
  }

  return <LiveScoreScreen match={match} players={players} />;
}
