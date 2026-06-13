import type { MatchFormat, Profile, PlayerStats, GroupStats } from '@/types';
import { formatWinRate } from '@/lib/utils';

export interface TournamentPlayer {
  id: string;
  name: string;
}

export interface ScheduledMatch {
  round: number;
  court?: number;
  teamA: [string, string];
  teamB: [string, string];
}

function rotateArray<T>(arr: T[], n: number): T[] {
  const len = arr.length;
  if (len === 0) return [];
  const shift = ((n % len) + len) % len;
  return [...arr.slice(shift), ...arr.slice(0, shift)];
}

export function generateRoundRobinSchedule(
  players: TournamentPlayer[],
  _format: MatchFormat = 'bo1',
): ScheduledMatch[] {
  const matches: ScheduledMatch[] = [];
  const n = players.length;

  if (n < 4) return matches;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          matches.push({
            round: Math.floor(matches.length / Math.max(1, Math.floor(n / 2))) + 1,
            teamA: [players[i].id, players[j].id],
            teamB: [players[k].id, players[l].id],
          });
        }
      }
    }
  }

  return matches.slice(0, Math.min(matches.length, n * 3));
}

export function generateAmericanoSchedule(
  players: TournamentPlayer[],
  rounds: number,
  courts = 1,
): ScheduledMatch[] {
  const matches: ScheduledMatch[] = [];
  const n = players.length;

  if (n < 4) return matches;

  for (let round = 0; round < rounds; round++) {
    const rotated = rotateArray(players, round);
    const pairs: [TournamentPlayer, TournamentPlayer][] = [];

    for (let i = 0; i < rotated.length - 1; i += 2) {
      pairs.push([rotated[i], rotated[i + 1]]);
    }

    for (let i = 0; i < pairs.length - 1; i += 2) {
      if (i + 1 < pairs.length) {
        matches.push({
          round: round + 1,
          court: (Math.floor(i / 2) % courts) + 1,
          teamA: [pairs[i][0].id, pairs[i][1].id],
          teamB: [pairs[i + 1][0].id, pairs[i + 1][1].id],
        });
      }
    }
  }

  return matches;
}

export function generateMexicanoSchedule(
  players: TournamentPlayer[],
  standings: Map<string, number>,
  round: number,
  courts = 1,
): ScheduledMatch[] {
  const sorted = [...players].sort(
    (a, b) => (standings.get(b.id) ?? 0) - (standings.get(a.id) ?? 0),
  );

  const matches: ScheduledMatch[] = [];

  for (let i = 0; i < sorted.length - 3; i += 4) {
    matches.push({
      round,
      court: (Math.floor(i / 4) % courts) + 1,
      teamA: [sorted[i].id, sorted[i + 3].id],
      teamB: [sorted[i + 1].id, sorted[i + 2].id],
    });
  }

  return matches;
}

export function computePlayerStats(
  profile: Profile,
  recentResults: ('W' | 'L')[] = [],
): PlayerStats {
  return {
    userId: profile.id,
    profile,
    matchesPlayed: profile.matches_played,
    wins: profile.wins,
    losses: profile.losses,
    winRate: formatWinRate(profile.wins, profile.matches_played),
    eloRating: profile.elo_rating,
    longestWinStreak: profile.best_win_streak,
    recentForm: recentResults.slice(-5),
  };
}

export function computeGroupStats(profiles: Profile[]): GroupStats {
  const ranking = profiles
    .map((p) => computePlayerStats(p))
    .sort((a, b) => b.eloRating - a.eloRating);

  const mostActivePlayer =
    ranking.length > 0
      ? [...ranking].sort((a, b) => b.matchesPlayed - a.matchesPlayed)[0]
      : null;

  const bestWinRate =
    ranking.filter((p) => p.matchesPlayed >= 3).sort((a, b) => b.winRate - a.winRate)[0] ?? null;

  return { ranking, mostActivePlayer, bestWinRate };
}
