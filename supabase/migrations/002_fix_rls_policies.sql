-- Fix RLS recursion and missing-profile issues
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql

-- ============================================================
-- HELPER: membership check without RLS recursion
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_group_member(check_group_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = check_group_id AND user_id = check_user_id
  );
$$;

-- ============================================================
-- HELPER: ensure profile exists for current user (Google OAuth edge case)
-- ============================================================
CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.profiles;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture'),
    u.email
  FROM auth.users u
  WHERE u.id = auth.uid()
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO result FROM public.profiles WHERE id = auth.uid();
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;

-- ============================================================
-- HELPER: join group by invite code (avoids exposing all groups)
-- ============================================================
CREATE OR REPLACE FUNCTION public.join_group_by_invite(p_invite_code text)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_group public.groups;
BEGIN
  SELECT * INTO target_group
  FROM public.groups
  WHERE invite_code = upper(trim(p_invite_code))
  LIMIT 1;

  IF target_group IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (target_group.id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN target_group;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_group_by_invite(text) TO authenticated;

-- ============================================================
-- FIX: group_members SELECT (was self-referential → 500 errors)
-- ============================================================
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;

CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
  );

-- ============================================================
-- FIX: groups SELECT (was querying group_members recursively)
-- ============================================================
DROP POLICY IF EXISTS "Group members can view groups" ON public.groups;

CREATE POLICY "Group members can view groups"
  ON public.groups FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

-- ============================================================
-- FIX: allow users to create their own profile if trigger missed them
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- FIX: matches/tournaments policies that also referenced group_members recursively
-- ============================================================
DROP POLICY IF EXISTS "Group members can view matches" ON public.matches;

CREATE POLICY "Group members can view matches"
  ON public.matches FOR SELECT TO authenticated
  USING (
    group_id IS NULL
    OR created_by = auth.uid()
    OR public.is_group_member(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "Match participants can update matches" ON public.matches;

CREATE POLICY "Match participants can update matches"
  ON public.matches FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.match_players mp
      WHERE mp.match_id = matches.id AND mp.user_id = auth.uid()
    )
    OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Group members view tournaments" ON public.tournaments;

CREATE POLICY "Group members view tournaments"
  ON public.tournaments FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group members create tournaments" ON public.tournaments;

CREATE POLICY "Group members create tournaments"
  ON public.tournaments FOR INSERT TO authenticated
  WITH CHECK (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group members update tournaments" ON public.tournaments;

CREATE POLICY "Group members update tournaments"
  ON public.tournaments FOR UPDATE TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Group admins can update groups" ON public.groups;

CREATE POLICY "Group admins can update groups"
  ON public.groups FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR (
      public.is_group_member(id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = groups.id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
      )
    )
  );
