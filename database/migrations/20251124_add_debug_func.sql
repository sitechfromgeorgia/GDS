-- Debug functions to inspect DB state
-- Created: 2025-11-24

-- Function to list policies
CREATE OR REPLACE FUNCTION get_policies(t_name text)
RETURNS TABLE (policyname text, cmd text, qual text, with_check text)
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT policyname::text, cmd::text, qual::text, with_check::text
  FROM pg_policies
  WHERE tablename = t_name;
END;
$$ LANGUAGE plpgsql;

-- Function to check RLS status
CREATE OR REPLACE FUNCTION get_rls_status(t_name text)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
DECLARE
  is_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO is_enabled
  FROM pg_class
  WHERE relname = t_name;
  RETURN is_enabled;
END;
$$ LANGUAGE plpgsql;
