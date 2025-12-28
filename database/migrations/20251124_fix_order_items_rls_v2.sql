-- Fix RLS policy for order_items table (v2 - DISABLE RLS)
-- Created: 2025-11-24
-- Purpose: Disable RLS to confirm it is the cause of the error

BEGIN;

ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

COMMIT;
