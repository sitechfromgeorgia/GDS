-- Create order_comments table
CREATE TABLE IF NOT EXISTS order_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  comment_type text DEFAULT 'general' CHECK (comment_type IN ('general', 'issue', 'praise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_comments_order ON order_comments(order_id, created_at DESC);

-- Enable RLS
ALTER TABLE order_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Drop existing policies to allow re-running the migration
DROP POLICY IF EXISTS "Restaurants can view own order comments" ON order_comments;
DROP POLICY IF EXISTS "Restaurants can insert own order comments" ON order_comments;
DROP POLICY IF EXISTS "Admins can view all order comments" ON order_comments;
DROP POLICY IF EXISTS "Admins can insert order comments" ON order_comments;

-- Allow restaurant to view comments on their own orders
CREATE POLICY "Restaurants can view own order comments"
ON order_comments FOR SELECT
USING (
  (auth.jwt() ->> 'role')::text = 'restaurant' AND
  order_id IN (
    SELECT id FROM orders WHERE restaurant_id = auth.uid()
  )
);

-- Allow restaurant to insert comments on their own orders
CREATE POLICY "Restaurants can insert own order comments"
ON order_comments FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'restaurant' AND
  order_id IN (
    SELECT id FROM orders WHERE restaurant_id = auth.uid()
  ) AND
  author_id = auth.uid()
);

-- Allow admin to view all order comments
CREATE POLICY "Admins can view all order comments"
ON order_comments FOR SELECT
USING ((auth.jwt() ->> 'role')::text = 'admin');

-- Allow admin to insert comments
CREATE POLICY "Admins can insert order comments"
ON order_comments FOR INSERT
WITH CHECK ((auth.jwt() ->> 'role')::text = 'admin');
