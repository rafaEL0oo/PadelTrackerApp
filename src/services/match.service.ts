import type { Match, MatchPlayer, Profile, Team } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import {
  addPoint,
  createInitialMatchState,
  matchStateFromMatch,
  matchStateToDbFields,
  rebuildFromPointHistory,
} from '@/services/scoring.engine';
import { calculateTeamEloUpdates, updatePlayerStatsAfterMatch } from '@/services/elo.service';
import type { CreateMatchInput } from '@/types';

export async function createMatch(input: CreateMatchInput, userId: string) {
  const publicSlug = generateSlug();

  const { data: match, error } = await supabase
    .from('matches')
    .insert({
      group_id: input.groupId ?? null,
      format: input.format,
      status: 'scheduled',
      public_slug: publicSlug,
      created_by: userId,
      tournament_id: input.tournamentId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  const players = [
    { match_id: match.id, user_id: input.teamA[0], team: 'A' as Team, position: 1 },
    { match_id: match.id, user_id: input.teamA[1], team: 'A' as Team, position: 2 },
    { match_id: match.id, user_id: input.teamB[0], team: 'B' as Team, position: 1 },
    { match_id: match.id, user_id: input.teamB[1], team: 'B' as Team, position: 2 },
  ];

  const { error: playersError } = await supabase.from('match_players').insert(players);
  if (playersError) throw playersError;

  await supabase.from('match_sets').insert({
    match_id: match.id,
    set_number: 1,
  });

  return match;
}

export async function startMatch(matchId: string) {
  const { data, error } = await supabase
    .from('matches')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function registerPoint(matchId: string, winner: Team) {
  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (fetchError) throw fetchError;
  if (match.status !== 'in_progress') throw new Error('Match is not in progress');

  let state = matchStateFromMatch(match);
  state = addPoint(state, winner);
  const dbFields = matchStateToDbFields(state);

  const updatePayload: Record<string, unknown> = {
    team_a_games: dbFields.team_a_games,
    team_b_games: dbFields.team_b_games,
    team_a_points: dbFields.team_a_points,
    team_b_points: dbFields.team_b_points,
    is_deuce: dbFields.is_deuce,
    advantage_team: dbFields.advantage_team,
    team_a_sets: dbFields.team_a_sets,
    team_b_sets: dbFields.team_b_sets,
    current_set_number: dbFields.current_set_number,
    current_game_number: dbFields.current_game_number,
    total_points: dbFields.total_points,
  };

  if (dbFields.completed) {
    updatePayload.status = 'completed';
    updatePayload.completed_at = new Date().toISOString();
    updatePayload.winner_team = dbFields.winner_team;
  }

  const { data: updated, error: updateError } = await supabase
    .from('matches')
    .update(updatePayload)
    .eq('id', matchId)
    .select()
    .single();

  if (updateError) throw updateError;

  const { error: pointError } = await supabase.from('match_points').insert({
    match_id: matchId,
    point_number: dbFields.total_points,
    winner,
    team_a_score: dbFields.team_a_score,
    team_b_score: dbFields.team_b_score,
    set_score_a: dbFields.set_score_a,
    set_score_b: dbFields.set_score_b,
    game_score_a: dbFields.game_score_a,
    game_score_b: dbFields.game_score_b,
    event_type: 'point',
  });

  if (pointError) throw pointError;

  if (dbFields.completed && dbFields.winner_team) {
    await finalizeMatch(matchId, dbFields.winner_team);
  }

  return updated;
}

export async function undoLastPoint(matchId: string) {
  const { data: points, error: pointsError } = await supabase
    .from('match_points')
    .select('*')
    .eq('match_id', matchId)
    .eq('event_type', 'point')
    .order('point_number', { ascending: false })
    .limit(1);

  if (pointsError) throw pointsError;
  if (!points?.length) throw new Error('No points to undo');

  const lastPoint = points[0];

  const { error: deleteError } = await supabase.from('match_points').delete().eq('id', lastPoint.id);
  if (deleteError) throw deleteError;

  const { data: allPoints } = await supabase
    .from('match_points')
    .select('winner')
    .eq('match_id', matchId)
    .eq('event_type', 'point')
    .order('point_number', { ascending: true });

  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
  if (!match) throw new Error('Match not found');

  const winners = (allPoints ?? []).map((p) => p.winner as Team);
  const state = rebuildFromPointHistory(match.format, winners.length, winners);
  const dbFields = matchStateToDbFields(state);

  const { data: updated, error } = await supabase
    .from('matches')
    .update({
      team_a_games: dbFields.team_a_games,
      team_b_games: dbFields.team_b_games,
      team_a_points: dbFields.team_a_points,
      team_b_points: dbFields.team_b_points,
      is_deuce: dbFields.is_deuce,
      advantage_team: dbFields.advantage_team,
      team_a_sets: dbFields.team_a_sets,
      team_b_sets: dbFields.team_b_sets,
      current_set_number: dbFields.current_set_number,
      current_game_number: dbFields.current_game_number,
      total_points: dbFields.total_points,
      status: 'in_progress',
      completed_at: null,
      winner_team: null,
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) throw error;
  return updated;
}

async function finalizeMatch(matchId: string, winner: Team) {
  const { data: matchPlayers, error } = await supabase
    .from('match_players')
    .select('*, profile:profiles(*)')
    .eq('match_id', matchId);

  if (error) throw error;

  const teamA = (matchPlayers ?? [])
    .filter((mp) => mp.team === 'A')
    .map((mp) => mp.profile as unknown as Profile);
  const teamB = (matchPlayers ?? [])
    .filter((mp) => mp.team === 'B')
    .map((mp) => mp.profile as unknown as Profile);

  const eloUpdates = calculateTeamEloUpdates(teamA, teamB, winner);

  for (const update of eloUpdates) {
    const player = [...teamA, ...teamB].find((p) => p.id === update.userId);
    if (!player) continue;

    const won = (winner === 'A' && teamA.some((p) => p.id === update.userId)) ||
      (winner === 'B' && teamB.some((p) => p.id === update.userId));

    const stats = updatePlayerStatsAfterMatch(player, won);

    await supabase.from('profiles').update({
      elo_rating: update.ratingAfter,
      ...stats,
    }).eq('id', update.userId);

    await supabase.from('elo_history').insert({
      user_id: update.userId,
      match_id: matchId,
      rating_before: update.ratingBefore,
      rating_after: update.ratingAfter,
      change_amount: update.changeAmount,
    });
  }
}

export async function getMatchWithDetails(matchId: string) {
  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) throw error;

  const { data: players } = await supabase
    .from('match_players')
    .select('*, profile:profiles(*)')
    .eq('match_id', matchId);

  const { data: points } = await supabase
    .from('match_points')
    .select('*')
    .eq('match_id', matchId)
    .eq('event_type', 'point')
    .order('point_number', { ascending: true });

  return {
    match,
    players: (players ?? []) as (MatchPlayer & { profile: Profile })[],
    points: points ?? [],
  };
}

export async function getMatchBySlug(slug: string) {
  const { data: match, error } = await supabase
    .from('matches')
    .select('*')
    .eq('public_slug', slug)
    .single();

  if (error) throw error;
  return getMatchWithDetails(match.id);
}

export function getMatchDisplayState(match: Match) {
  return matchStateFromMatch(match);
}

export function getInitialState(format: Match['format']) {
  return createInitialMatchState(format);
}
