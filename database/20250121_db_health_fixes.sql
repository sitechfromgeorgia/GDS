-- Database Health Fixes Migration
-- Date: 2025-01-21
-- Description: Fixes identified during database health check

-- 1. Profiles Synchronization - Create profiles for users without profiles
-- This ensures all users have corresponding profiles for RLS policies
INSERT INTO profiles (id, role, full_name, is_active)
SELECT
  u.id,
  CASE
    WHEN u.role = 'ADMIN' THEN 'admin'::user_role
    WHEN u.role = 'DRIVER' THEN 'driver'::user_role
    WHEN u.role = 'RESTAURANT' THEN 'restaurant'::user_role
    ELSE 'demo'::user_role
  END,
  u.name,
  u."isActive"
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

-- 2. Realtime Publications - Add products and notifications tables
-- This enables real-time updates for product changes and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 3. Remove Duplicate Indexes
-- categories_name_idx and units_name_idx duplicate the UNIQUE constraints
DROP INDEX IF EXISTS categories_name_idx;
DROP INDEX IF EXISTS units_name_idx;

-- 4. Orphan auth.users cleanup (manual step)
-- The following users were in auth.users but not in public.users:
-- - sitech.georgia@gmail.com (id: ac32f3d2-5ff8-4401-88d5-6dd1517e2582)
-- - merabi@123.com (id: b4478e43-c1cb-483b-ac3a-08ccfe24c749)
-- These were deleted via Supabase Admin API

-- Verification queries:
-- SELECT COUNT(*) FROM profiles; -- Should be 8
-- SELECT COUNT(*) FROM users; -- Should be 8
-- SELECT COUNT(*) FROM auth.users; -- Should be 8
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
