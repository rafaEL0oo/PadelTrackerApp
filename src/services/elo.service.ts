import type { Profile, Team } from '@/types';

const DEFAULT_ELO = 1000;
const K_FACTOR = 32;

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function calculateNewRating(currentRating: number, expected: number, actual: number): number {
  return Math.round(currentRating + K_FACTOR * (actual - expected));
}

export interface EloUpdate {
  userId: string;
  ratingBefore: number;
  ratingAfter: number;
  changeAmount: number;
}

export function calculateTeamEloUpdates(
  teamAPlayers: Profile[],
  teamBPlayers: Profile[],
  winner: Team,
): EloUpdate[] {
  const teamARating =
    teamAPlayers.reduce((sum, p) => sum + (p.elo_rating ?? DEFAULT_ELO), 0) / teamAPlayers.length;
  const teamBRating =
    teamBPlayers.reduce((sum, p) => sum + (p.elo_rating ?? DEFAULT_ELO), 0) / teamBPlayers.length;

  const expectedA = expectedScore(teamARating, teamBRating);
  const expectedB = expectedScore(teamBRating, teamARating);

  const actualA = winner === 'A' ? 1 : 0;
  const actualB = winner === 'B' ? 1 : 0;

  const newTeamARating = calculateNewRating(teamARating, expectedA, actualA);
  const newTeamBRating = calculateNewRating(teamBRating, expectedB, actualB);

  const updates: EloUpdate[] = [];

  for (const player of teamAPlayers) {
    const before = player.elo_rating ?? DEFAULT_ELO;
    const change = Math.round(newTeamARating - teamARating);
    updates.push({
      userId: player.id,
      ratingBefore: before,
      ratingAfter: before + change,
      changeAmount: change,
    });
  }

  for (const player of teamBPlayers) {
    const before = player.elo_rating ?? DEFAULT_ELO;
    const change = Math.round(newTeamBRating - teamBRating);
    updates.push({
      userId: player.id,
      ratingBefore: before,
      ratingAfter: before + change,
      changeAmount: change,
    });
  }

  return updates;
}

export function updatePlayerStatsAfterMatch(
  profile: Profile,
  won: boolean,
): Pick<Profile, 'matches_played' | 'wins' | 'losses' | 'best_win_streak' | 'current_win_streak'> {
  const matchesPlayed = profile.matches_played + 1;
  const wins = profile.wins + (won ? 1 : 0);
  const losses = profile.losses + (won ? 0 : 1);
  const currentWinStreak = won ? profile.current_win_streak + 1 : 0;
  const bestWinStreak = Math.max(profile.best_win_streak, currentWinStreak);

  return { matches_played: matchesPlayed, wins, losses, best_win_streak: bestWinStreak, current_win_streak: currentWinStreak };
}
