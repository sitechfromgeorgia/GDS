-- Enable Realtime for orders table
-- Run this in Supabase Dashboard > SQL Editor

-- Add orders table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Verify it was added
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
