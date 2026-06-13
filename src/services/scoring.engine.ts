import type { GameState, MatchFormat, MatchState, PointDisplay, SetState, Team } from '@/types';
import { getSetsToWin } from '@/lib/utils';

const POINT_LABELS: PointDisplay[] = ['0', '15', '30', '40'];

export function createInitialGameState(): GameState {
  return {
    teamAPoints: 0,
    teamBPoints: 0,
    isDeuce: false,
    advantageTeam: null,
  };
}

export function createInitialSetState(setNumber = 1): SetState {
  return {
    setNumber,
    teamAGames: 0,
    teamBGames: 0,
    currentGameNumber: 1,
    gameState: createInitialGameState(),
    completed: false,
    winner: null,
  };
}

export function createInitialMatchState(format: MatchFormat): MatchState {
  return {
    format,
    sets: [createInitialSetState(1)],
    currentSetIndex: 0,
    teamASets: 0,
    teamBSets: 0,
    completed: false,
    winner: null,
    totalPoints: 0,
  };
}

export function pointsToDisplay(points: number, isDeuce: boolean, advantageTeam: Team | null, team: Team): PointDisplay {
  if (isDeuce && advantageTeam === team) return 'AD';
  if (isDeuce && advantageTeam && advantageTeam !== team) return '40';
  if (points >= 3) return '40';
  return POINT_LABELS[points] ?? '0';
}

export function getDisplayScore(gameState: GameState): { teamA: PointDisplay; teamB: PointDisplay } {
  return {
    teamA: pointsToDisplay(gameState.teamAPoints, gameState.isDeuce, gameState.advantageTeam, 'A'),
    teamB: pointsToDisplay(gameState.teamBPoints, gameState.isDeuce, gameState.advantageTeam, 'B'),
  };
}

function isGameWon(gameState: GameState): Team | null {
  const { teamAPoints, teamBPoints, isDeuce, advantageTeam } = gameState;

  if (isDeuce && advantageTeam) {
    return null;
  }

  if (teamAPoints >= 4 && teamAPoints - teamBPoints >= 2) return 'A';
  if (teamBPoints >= 4 && teamBPoints - teamAPoints >= 2) return 'B';

  return null;
}

function addPointToGame(gameState: GameState, winner: Team): GameState {
  const next = { ...gameState };

  if (next.isDeuce) {
    if (next.advantageTeam === winner) {
      if (winner === 'A') next.teamAPoints = 4;
      else next.teamBPoints = 4;
      next.isDeuce = false;
      next.advantageTeam = null;
    } else if (next.advantageTeam) {
      next.advantageTeam = null;
    } else {
      next.advantageTeam = winner;
    }
    return next;
  }

  if (winner === 'A') next.teamAPoints += 1;
  else next.teamBPoints += 1;

  if (next.teamAPoints >= 3 && next.teamBPoints >= 3) {
    if (next.teamAPoints === next.teamBPoints) {
      next.isDeuce = true;
      next.advantageTeam = null;
    } else if (Math.abs(next.teamAPoints - next.teamBPoints) === 1) {
      next.isDeuce = true;
      next.advantageTeam = next.teamAPoints > next.teamBPoints ? 'A' : 'B';
    }
  }

  return next;
}

function isSetWon(teamAGames: number, teamBGames: number): Team | null {
  if (teamAGames >= 6 && teamAGames - teamBGames >= 2) return 'A';
  if (teamBGames >= 6 && teamBGames - teamAGames >= 2) return 'B';
  if (teamAGames === 7 && teamBGames === 6) return 'A';
  if (teamBGames === 7 && teamAGames === 6) return 'B';
  return null;
}

function isTiebreakSet(teamAGames: number, teamBGames: number): boolean {
  return teamAGames === 6 && teamBGames === 6;
}

export function addPoint(state: MatchState, winner: Team): MatchState {
  if (state.completed) return state;

  const newState: MatchState = {
    ...state,
    sets: state.sets.map((s) => ({ ...s, gameState: { ...s.gameState } })),
    totalPoints: state.totalPoints + 1,
  };

  const currentSet = newState.sets[newState.currentSetIndex];
  currentSet.gameState = addPointToGame(currentSet.gameState, winner);

  const gameWinner = isGameWon(currentSet.gameState);
  if (!gameWinner) return newState;

  if (gameWinner === 'A') currentSet.teamAGames += 1;
  else currentSet.teamBGames += 1;

  currentSet.gameState = createInitialGameState();
  currentSet.currentGameNumber += 1;

  const setWinner = isSetWon(currentSet.teamAGames, currentSet.teamBGames);
  if (setWinner) {
    currentSet.completed = true;
    currentSet.winner = setWinner;

    if (setWinner === 'A') newState.teamASets += 1;
    else newState.teamBSets += 1;

    const setsToWin = getSetsToWin(newState.format);
    if (newState.teamASets >= setsToWin) {
      newState.completed = true;
      newState.winner = 'A';
    } else if (newState.teamBSets >= setsToWin) {
      newState.completed = true;
      newState.winner = 'B';
    } else {
      const nextSet = createInitialSetState(currentSet.setNumber + 1);
      newState.sets.push(nextSet);
      newState.currentSetIndex += 1;
    }
  } else if (isTiebreakSet(currentSet.teamAGames, currentSet.teamBGames)) {
    // Standard padel: play tiebreak at 6-6 (simplified as next game wins set at 7-6)
  }

  return newState;
}

export function undoPoint(state: MatchState): MatchState {
  if (state.totalPoints === 0) return state;
  return rebuildFromPointHistory(state.format, state.totalPoints - 1, []);
}

export function rebuildFromPointHistory(
  format: MatchFormat,
  pointCount: number,
  winners: Team[],
): MatchState {
  let state = createInitialMatchState(format);
  for (let i = 0; i < Math.min(pointCount, winners.length); i++) {
    state = addPoint(state, winners[i]);
  }
  return state;
}

export function matchStateFromMatch(match: {
  format: MatchFormat;
  team_a_games: number;
  team_b_games: number;
  team_a_points: number;
  team_b_points: number;
  is_deuce: boolean;
  advantage_team: Team | null;
  team_a_sets: number;
  team_b_sets: number;
  current_set_number: number;
  current_game_number: number;
  total_points: number;
  status: string;
  winner_team: Team | null;
}): MatchState {
  const state = createInitialMatchState(match.format);
  const setIndex = match.current_set_number - 1;

  while (state.sets.length < match.current_set_number) {
    state.sets.push(createInitialSetState(state.sets.length + 1));
  }

  state.currentSetIndex = setIndex;
  state.teamASets = match.team_a_sets;
  state.teamBSets = match.team_b_sets;
  state.totalPoints = match.total_points;

  const currentSet = state.sets[setIndex];
  currentSet.teamAGames = match.team_a_games;
  currentSet.teamBGames = match.team_b_games;
  currentSet.currentGameNumber = match.current_game_number;
  currentSet.gameState = {
    teamAPoints: match.team_a_points,
    teamBPoints: match.team_b_points,
    isDeuce: match.is_deuce,
    advantageTeam: match.advantage_team,
  };

  if (match.status === 'completed') {
    state.completed = true;
    state.winner = match.winner_team;
  }

  return state;
}

export function matchStateToDbFields(state: MatchState) {
  const currentSet = state.sets[state.currentSetIndex];
  const display = getDisplayScore(currentSet.gameState);

  return {
    team_a_games: currentSet.teamAGames,
    team_b_games: currentSet.teamBGames,
    team_a_points: currentSet.gameState.teamAPoints,
    team_b_points: currentSet.gameState.teamBPoints,
    is_deuce: currentSet.gameState.isDeuce,
    advantage_team: currentSet.gameState.advantageTeam,
    team_a_sets: state.teamASets,
    team_b_sets: state.teamBSets,
    current_set_number: currentSet.setNumber,
    current_game_number: currentSet.currentGameNumber,
    total_points: state.totalPoints,
    team_a_score: display.teamA,
    team_b_score: display.teamB,
    set_score_a: currentSet.teamAGames,
    set_score_b: currentSet.teamBGames,
    game_score_a: currentSet.gameState.teamAPoints,
    game_score_b: currentSet.gameState.teamBPoints,
    completed: state.completed,
    winner_team: state.winner,
  };
}
