-- Migration: Enforce Strict Admin-Only Access for Profiles
-- Created: 2025-11-22
-- Purpose: Ensure only admins can INSERT or DELETE profiles (except for self-registration via Auth triggers if applicable)

BEGIN;

-- =============================================================================
-- PROFILES TABLE: INSERT Policy
-- =============================================================================

-- Drop existing INSERT policy if any (usually none by default)
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;

-- Create strict INSERT policy
-- Note: This applies to client-side inserts. Triggers (Security Definer) bypass this.
CREATE POLICY "profiles_insert_admin_only"
  ON profiles
  FOR INSERT
  WITH CHECK (
    -- Only admins can insert new profiles manually
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      LIMIT 1
    )
  );

-- =============================================================================
-- PROFILES TABLE: DELETE Policy
-- =============================================================================

-- Drop existing DELETE policy if any
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON profiles;

-- Create strict DELETE policy
CREATE POLICY "profiles_delete_admin_only"
  ON profiles
  FOR DELETE
  USING (
    -- Only admins can delete profiles
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
      LIMIT 1
    )
  );

-- =============================================================================
-- VERIFICATION
-- =============================================================================

COMMENT ON POLICY "profiles_insert_admin_only" ON profiles IS
  'Strict policy: Only admins can manually insert profiles. Enforced 2025-11-22';

COMMENT ON POLICY "profiles_delete_admin_only" ON profiles IS
  'Strict policy: Only admins can delete profiles. Enforced 2025-11-22';

COMMIT;
