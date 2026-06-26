-- ============================================================================
-- ADMIN DISAPPROVE: allow admins to delete availabilities (reject a submission)
-- ============================================================================

CREATE POLICY "admins_delete_all_availabilities"
  ON availabilities FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
