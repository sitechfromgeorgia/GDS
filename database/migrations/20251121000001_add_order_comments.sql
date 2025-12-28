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

-- Enable RLS
ALTER TABLE order_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_comments_order ON order_comments(order_id, created_at DESC);

-- RLS Policies

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

-- Allow admins to view all comments
CREATE POLICY "Admins can view all order comments" 
ON order_comments FOR SELECT
USING (
  (auth.jwt() ->> 'role')::text = 'admin' OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to insert comments
CREATE POLICY "Admins can insert comments" 
ON order_comments FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin' OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
