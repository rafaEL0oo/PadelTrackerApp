import { getDisplayScore, matchStateFromMatch } from '@/services/scoring.engine';
import type { Match, MatchPlayer, Profile } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScoreboardProps {
  match: Match;
  players: (MatchPlayer & { profile?: Profile })[];
  compact?: boolean;
}

export function Scoreboard({ match, players, compact = false }: ScoreboardProps) {
  const state = matchStateFromMatch(match);
  const currentSet = state.sets[state.currentSetIndex];
  const display = getDisplayScore(currentSet.gameState);

  const teamA = players.filter((p) => p.team === 'A');
  const teamB = players.filter((p) => p.team === 'B');

  return (
    <div className={cn('rounded-2xl bg-slate-900 text-white', compact ? 'p-4' : 'p-6')}>
      <div className="mb-4 flex items-center justify-between">
        <Badge variant={match.status === 'in_progress' ? 'success' : 'outline'}>
          {match.status.replace('_', ' ')}
        </Badge>
        <span className="text-sm text-slate-400">
          Set {currentSet.setNumber} · Game {currentSet.currentGameNumber}
        </span>
      </div>

      <div className="space-y-4">
        <TeamRow
          team="A"
          players={teamA}
          sets={match.team_a_sets}
          games={match.team_a_games}
          points={display.teamA}
          isDeuce={match.is_deuce}
          large={!compact}
        />
        <div className="h-px bg-slate-700" />
        <TeamRow
          team="B"
          players={teamB}
          sets={match.team_b_sets}
          games={match.team_b_games}
          points={display.teamB}
          isDeuce={match.is_deuce}
          large={!compact}
        />
      </div>

      {match.is_deuce && (
        <p className="mt-4 text-center text-sm font-medium text-amber-400">
          DEUCE{match.advantage_team ? ` · Advantage Team ${match.advantage_team}` : ''}
        </p>
      )}
    </div>
  );
}

function TeamRow({
  team,
  players,
  sets,
  games,
  points,
  isDeuce,
  large,
}: {
  team: 'A' | 'B';
  players: (MatchPlayer & { profile?: Profile })[];
  sets: number;
  games: number;
  points: string;
  isDeuce: boolean;
  large: boolean;
}) {
  const color = team === 'A' ? 'text-blue-400' : 'text-orange-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {players.map((p) => (
          <Avatar
            key={p.id}
            src={p.profile?.avatar_url}
            name={p.profile?.display_name ?? '?'}
            size="sm"
          />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate font-semibold', color)}>
          {players.map((p) => p.profile?.display_name).join(' & ')}
        </p>
      </div>
      <div className="flex items-center gap-3 tabular-nums">
        <span className={cn('text-slate-400', large ? 'text-lg' : 'text-sm')}>{sets}</span>
        <span className={cn('font-bold', large ? 'text-2xl' : 'text-lg')}>{games}</span>
        <span
          className={cn(
            'font-black',
            large ? 'text-4xl' : 'text-2xl',
            isDeuce && points === 'AD' ? 'text-amber-400' : 'text-white',
          )}
        >
          {points}
        </span>
      </div>
    </div>
  );
}
