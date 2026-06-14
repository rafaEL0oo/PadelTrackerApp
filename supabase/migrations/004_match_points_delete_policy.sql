-- Allow undo: authenticated users can delete match points during live scoring
DROP POLICY IF EXISTS "Delete match points for undo" ON public.match_points;

CREATE POLICY "Delete match points for undo"
  ON public.match_points FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_points.match_id
      AND (
        m.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.match_players mp
          WHERE mp.match_id = m.id AND mp.user_id = auth.uid()
        )
        OR (
          m.group_id IS NOT NULL
          AND public.is_group_member(m.group_id, auth.uid())
        )
      )
    )
  );
