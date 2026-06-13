-- Padel Tracker Database Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  email TEXT NOT NULL,
  elo_rating INTEGER NOT NULL DEFAULT 1000,
  matches_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  best_win_streak INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_elo ON public.profiles(elo_rating DESC);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group ON public.group_members(group_id);
CREATE INDEX idx_group_members_user ON public.group_members(user_id);

-- ============================================================
-- TOURNAMENTS
-- ============================================================
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('round_robin', 'americano', 'mexicano')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  settings JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tournaments_group ON public.tournaments(group_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  format TEXT NOT NULL CHECK (format IN ('bo1', 'bo3', 'bo5')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  public_slug TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  winner_team TEXT CHECK (winner_team IN ('A', 'B')),
  current_set_number INTEGER NOT NULL DEFAULT 1,
  current_game_number INTEGER NOT NULL DEFAULT 1,
  team_a_games INTEGER NOT NULL DEFAULT 0,
  team_b_games INTEGER NOT NULL DEFAULT 0,
  team_a_points INTEGER NOT NULL DEFAULT 0,
  team_b_points INTEGER NOT NULL DEFAULT 0,
  is_deuce BOOLEAN NOT NULL DEFAULT FALSE,
  advantage_team TEXT CHECK (advantage_team IN ('A', 'B')),
  team_a_sets INTEGER NOT NULL DEFAULT 0,
  team_b_sets INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matches_group ON public.matches(group_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_public_slug ON public.matches(public_slug);
CREATE INDEX idx_matches_tournament ON public.matches(tournament_id);

-- ============================================================
-- MATCH PLAYERS
-- ============================================================
CREATE TABLE public.match_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team TEXT NOT NULL CHECK (team IN ('A', 'B')),
  position INTEGER NOT NULL CHECK (position IN (1, 2)),
  UNIQUE(match_id, user_id),
  UNIQUE(match_id, team, position)
);

CREATE INDEX idx_match_players_match ON public.match_players(match_id);
CREATE INDEX idx_match_players_user ON public.match_players(user_id);

-- ============================================================
-- MATCH SETS
-- ============================================================
CREATE TABLE public.match_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  team_a_games INTEGER NOT NULL DEFAULT 0,
  team_b_games INTEGER NOT NULL DEFAULT 0,
  winner_team TEXT CHECK (winner_team IN ('A', 'B')),
  completed_at TIMESTAMPTZ,
  UNIQUE(match_id, set_number)
);

CREATE INDEX idx_match_sets_match ON public.match_sets(match_id);

-- ============================================================
-- MATCH GAMES
-- ============================================================
CREATE TABLE public.match_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES public.match_sets(id) ON DELETE CASCADE,
  game_number INTEGER NOT NULL,
  team_a_points INTEGER NOT NULL DEFAULT 0,
  team_b_points INTEGER NOT NULL DEFAULT 0,
  is_deuce BOOLEAN NOT NULL DEFAULT FALSE,
  advantage_team TEXT CHECK (advantage_team IN ('A', 'B')),
  winner_team TEXT CHECK (winner_team IN ('A', 'B')),
  completed_at TIMESTAMPTZ,
  UNIQUE(set_id, game_number)
);

CREATE INDEX idx_match_games_match ON public.match_games(match_id);
CREATE INDEX idx_match_games_set ON public.match_games(set_id);

-- ============================================================
-- MATCH POINTS
-- ============================================================
CREATE TABLE public.match_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  set_id UUID REFERENCES public.match_sets(id) ON DELETE SET NULL,
  game_id UUID REFERENCES public.match_games(id) ON DELETE SET NULL,
  point_number INTEGER NOT NULL,
  winner TEXT NOT NULL CHECK (winner IN ('A', 'B')),
  team_a_score TEXT NOT NULL,
  team_b_score TEXT NOT NULL,
  set_score_a INTEGER NOT NULL DEFAULT 0,
  set_score_b INTEGER NOT NULL DEFAULT 0,
  game_score_a INTEGER NOT NULL DEFAULT 0,
  game_score_b INTEGER NOT NULL DEFAULT 0,
  event_type TEXT NOT NULL DEFAULT 'point' CHECK (event_type IN ('point', 'undo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_points_match ON public.match_points(match_id, point_number);
CREATE INDEX idx_match_points_created ON public.match_points(created_at);

-- ============================================================
-- ELO HISTORY
-- ============================================================
CREATE TABLE public.elo_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_elo_history_user ON public.elo_history(user_id, created_at DESC);
CREATE INDEX idx_elo_history_match ON public.elo_history(match_id);

-- ============================================================
-- TOURNAMENT MATCHES
-- ============================================================
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  round_number INTEGER NOT NULL,
  court_number INTEGER,
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed'))
);

CREATE INDEX idx_tournament_matches_tournament ON public.tournament_matches(tournament_id);
CREATE INDEX idx_tournament_matches_round ON public.tournament_matches(tournament_id, round_number);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.generate_public_slug()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(6), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elo_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Public profiles viewable for match pages"
  ON public.profiles FOR SELECT TO anon USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Groups policies
CREATE POLICY "Group members can view groups"
  ON public.groups FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
    OR created_by = auth.uid()
  );

-- Group members policies
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Matches policies
CREATE POLICY "Group members can view matches"
  ON public.matches FOR SELECT TO authenticated
  USING (
    group_id IS NULL OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = matches.group_id AND gm.user_id = auth.uid()
    )
    OR created_by = auth.uid()
  );

CREATE POLICY "Public match view by slug"
  ON public.matches FOR SELECT TO anon
  USING (true);

CREATE POLICY "Authenticated users can create matches"
  ON public.matches FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Match participants can update matches"
  ON public.matches FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.match_players mp
      WHERE mp.match_id = matches.id AND mp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = matches.group_id AND gm.user_id = auth.uid()
    )
  );

-- Match players policies
CREATE POLICY "View match players"
  ON public.match_players FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Create match players"
  ON public.match_players FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_players.match_id AND m.created_by = auth.uid()
    )
  );

-- Match sets/games/points - viewable publicly, writable by participants
CREATE POLICY "View match sets" ON public.match_sets FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Insert match sets" ON public.match_sets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update match sets" ON public.match_sets FOR UPDATE TO authenticated USING (true);

CREATE POLICY "View match games" ON public.match_games FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Insert match games" ON public.match_games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Update match games" ON public.match_games FOR UPDATE TO authenticated USING (true);

CREATE POLICY "View match points" ON public.match_points FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Insert match points" ON public.match_points FOR INSERT TO authenticated WITH CHECK (true);

-- Elo history
CREATE POLICY "View own elo history" ON public.elo_history FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR true);

CREATE POLICY "Insert elo history" ON public.elo_history FOR INSERT TO authenticated WITH CHECK (true);

-- Tournaments
CREATE POLICY "Group members view tournaments" ON public.tournaments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = tournaments.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members create tournaments" ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = tournaments.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members update tournaments" ON public.tournaments FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = tournaments.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "View tournament matches" ON public.tournament_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage tournament matches" ON public.tournament_matches FOR ALL TO authenticated USING (true);

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_sets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_games;
