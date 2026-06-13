export type Team = 'A' | 'B';

export type MatchFormat = 'bo1' | 'bo3' | 'bo5';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type TournamentFormat = 'round_robin' | 'americano' | 'mexicano';

export type TournamentStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export type GroupRole = 'admin' | 'member';

export type PointDisplay = '0' | '15' | '30' | '40' | 'AD';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  email: string;
  elo_rating: number;
  matches_played: number;
  wins: number;
  losses: number;
  best_win_streak: number;
  current_win_streak: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: Profile;
}

export interface Match {
  id: string;
  group_id: string | null;
  format: MatchFormat;
  status: MatchStatus;
  public_slug: string;
  created_by: string;
  tournament_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  winner_team: Team | null;
  current_set_number: number;
  current_game_number: number;
  team_a_games: number;
  team_b_games: number;
  team_a_points: number;
  team_b_points: number;
  is_deuce: boolean;
  advantage_team: Team | null;
  team_a_sets: number;
  team_b_sets: number;
  total_points: number;
  created_at: string;
}

export interface MatchPlayer {
  id: string;
  match_id: string;
  user_id: string;
  team: Team;
  position: number;
  profile?: Profile;
}

export interface MatchSet {
  id: string;
  match_id: string;
  set_number: number;
  team_a_games: number;
  team_b_games: number;
  winner_team: Team | null;
  completed_at: string | null;
}

export interface MatchGame {
  id: string;
  match_id: string;
  set_id: string;
  game_number: number;
  team_a_points: number;
  team_b_points: number;
  is_deuce: boolean;
  advantage_team: Team | null;
  winner_team: Team | null;
  completed_at: string | null;
}

export interface MatchPoint {
  id: string;
  match_id: string;
  set_id: string | null;
  game_id: string | null;
  point_number: number;
  winner: Team;
  team_a_score: string;
  team_b_score: string;
  set_score_a: number;
  set_score_b: number;
  game_score_a: number;
  game_score_b: number;
  event_type: 'point' | 'undo';
  created_at: string;
}

export interface EloHistoryEntry {
  id: string;
  user_id: string;
  match_id: string;
  rating_before: number;
  rating_after: number;
  change_amount: number;
  created_at: string;
}

export interface Tournament {
  id: string;
  group_id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  settings: TournamentSettings;
  created_by: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface TournamentSettings {
  courts?: number;
  rounds?: number;
  matchFormat?: MatchFormat;
  pointsPerMatch?: number;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  match_id: string | null;
  round_number: number;
  court_number: number | null;
  scheduled_at: string | null;
  status: 'pending' | 'scheduled' | 'completed';
}

export interface GameState {
  teamAPoints: number;
  teamBPoints: number;
  isDeuce: boolean;
  advantageTeam: Team | null;
}

export interface SetState {
  setNumber: number;
  teamAGames: number;
  teamBGames: number;
  currentGameNumber: number;
  gameState: GameState;
  completed: boolean;
  winner: Team | null;
}

export interface MatchState {
  format: MatchFormat;
  sets: SetState[];
  currentSetIndex: number;
  teamASets: number;
  teamBSets: number;
  completed: boolean;
  winner: Team | null;
  totalPoints: number;
}

export interface PlayerStats {
  userId: string;
  profile: Profile;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  eloRating: number;
  longestWinStreak: number;
  recentForm: ('W' | 'L')[];
}

export interface GroupStats {
  ranking: PlayerStats[];
  mostActivePlayer: PlayerStats | null;
  bestWinRate: PlayerStats | null;
}

export interface CreateMatchInput {
  groupId?: string;
  format: MatchFormat;
  teamA: [string, string];
  teamB: [string, string];
  tournamentId?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name: string;
          email: string;
          avatar_url?: string | null;
          elo_rating?: number;
          matches_played?: number;
          wins?: number;
          losses?: number;
          best_win_streak?: number;
          current_win_streak?: number;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: {
          name: string;
          invite_code: string;
          created_by: string;
          description?: string | null;
          id?: string;
        };
        Update: Partial<Group>;
        Relationships: [];
      };
      group_members: {
        Row: GroupMember;
        Insert: {
          group_id: string;
          user_id: string;
          role?: GroupRole;
          id?: string;
        };
        Update: Partial<GroupMember>;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: {
          format: MatchFormat;
          public_slug: string;
          created_by: string;
          group_id?: string | null;
          tournament_id?: string | null;
          status?: MatchStatus;
          id?: string;
        };
        Update: Partial<Match>;
        Relationships: [];
      };
      match_players: {
        Row: MatchPlayer;
        Insert: {
          match_id: string;
          user_id: string;
          team: Team;
          position: number;
          id?: string;
        };
        Update: Partial<MatchPlayer>;
        Relationships: [];
      };
      match_sets: {
        Row: MatchSet;
        Insert: {
          match_id: string;
          set_number: number;
          team_a_games?: number;
          team_b_games?: number;
          id?: string;
        };
        Update: Partial<MatchSet>;
        Relationships: [];
      };
      match_games: {
        Row: MatchGame;
        Insert: {
          match_id: string;
          set_id: string;
          game_number: number;
          id?: string;
        };
        Update: Partial<MatchGame>;
        Relationships: [];
      };
      match_points: {
        Row: MatchPoint;
        Insert: {
          match_id: string;
          point_number: number;
          winner: Team;
          team_a_score: string;
          team_b_score: string;
          set_score_a?: number;
          set_score_b?: number;
          game_score_a?: number;
          game_score_b?: number;
          event_type?: 'point' | 'undo';
          set_id?: string | null;
          game_id?: string | null;
          id?: string;
        };
        Update: Partial<MatchPoint>;
        Relationships: [];
      };
      elo_history: {
        Row: EloHistoryEntry;
        Insert: {
          user_id: string;
          match_id: string;
          rating_before: number;
          rating_after: number;
          change_amount: number;
          id?: string;
        };
        Update: Partial<EloHistoryEntry>;
        Relationships: [];
      };
      tournaments: {
        Row: Tournament;
        Insert: {
          group_id: string;
          name: string;
          format: TournamentFormat;
          created_by: string;
          status?: TournamentStatus;
          settings?: TournamentSettings;
          id?: string;
        };
        Update: Partial<Tournament>;
        Relationships: [];
      };
      tournament_matches: {
        Row: TournamentMatch;
        Insert: {
          tournament_id: string;
          round_number: number;
          match_id?: string | null;
          court_number?: number | null;
          scheduled_at?: string | null;
          status?: 'pending' | 'scheduled' | 'completed';
          id?: string;
        };
        Update: Partial<TournamentMatch>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
