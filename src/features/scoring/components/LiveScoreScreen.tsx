import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Undo2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Scoreboard } from '@/features/matches/components/Scoreboard';
import { useMatchStore } from '@/stores/match.store';
import { useRegisterPoint, useUndoPoint } from '@/features/matches/hooks/useMatches';
import { useMatchRealtime } from '@/hooks/useMatchRealtime';
import { useWakeLock, useVibrate, useDebouncedClick } from '@/hooks/useWakeLock';
import { useUIStore } from '@/stores/ui.store';
import type { Match, MatchPlayer, Profile, Team } from '@/types';

interface LiveScoreScreenProps {
  match: Match;
  players: (MatchPlayer & { profile?: Profile })[];
}

export function LiveScoreScreen({ match, players }: LiveScoreScreenProps) {
  const navigate = useNavigate();
  const { setMatch, setPlayers, updateMatch, match: storeMatch, points, setPoints } = useMatchStore();
  const registerPoint = useRegisterPoint();
  const undoPoint = useUndoPoint();
  const { showToast } = useUIStore();
  const vibrate = useVibrate();
  const debouncedPoint = useDebouncedClick(600);
  const debouncedUndo = useDebouncedClick(300);

  const displayMatch = storeMatch ?? match;

  useWakeLock(true);
  useMatchRealtime(match.id);

  useEffect(() => {
    setMatch(match);
    setPlayers(players);
  }, [match, players, setMatch, setPlayers]);

  const handlePoint = (winner: Team) => {
    debouncedPoint(async () => {
      try {
        vibrate(30);
        const updated = await registerPoint.mutateAsync({ matchId: displayMatch.id, winner });
        updateMatch(updated);
      } catch {
        showToast('Failed to register point', 'error');
      }
    });
  };

  const handleUndo = () => {
    debouncedUndo(async () => {
      try {
        vibrate([20, 50, 20]);
        const updated = await undoPoint.mutateAsync(displayMatch.id);
        updateMatch(updated);
        setPoints(points.slice(0, -1));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to undo';
        showToast(message.includes('No points') ? 'Nothing to undo' : 'Failed to undo point', 'error');
      }
    });
  };

  const teamA = players.filter((p) => p.team === 'A');
  const teamB = players.filter((p) => p.team === 'B');

  return (
    <div className="flex h-dvh flex-col bg-slate-900">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate(`/matches/${match.id}`)}
          className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>
        <span className="text-sm font-medium text-slate-400">Live Scoring</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={undoPoint.isPending || displayMatch.total_points === 0}
          className="text-slate-400 hover:text-white"
        >
          <Undo2 className="mr-1 h-4 w-4" /> Undo
        </Button>
      </div>

      <div className="px-4 pb-2">
        <Scoreboard match={displayMatch} players={players} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <button
          onClick={() => handlePoint('A')}
          disabled={registerPoint.isPending || displayMatch.status !== 'in_progress'}
          className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <span className="text-3xl font-black">TEAM A</span>
          <span className="mt-2 text-lg opacity-80">
            {teamA.map((p) => p.profile?.display_name).join(' & ')}
          </span>
          <span className="mt-4 text-sm uppercase tracking-widest opacity-60">Won Point</span>
        </button>

        <button
          onClick={() => handlePoint('B')}
          disabled={registerPoint.isPending || displayMatch.status !== 'in_progress'}
          className="flex flex-1 flex-col items-center justify-center rounded-3xl bg-orange-600 text-white shadow-lg transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <span className="text-3xl font-black">TEAM B</span>
          <span className="mt-2 text-lg opacity-80">
            {teamB.map((p) => p.profile?.display_name).join(' & ')}
          </span>
          <span className="mt-4 text-sm uppercase tracking-widest opacity-60">Won Point</span>
        </button>
      </div>
    </div>
  );
}
