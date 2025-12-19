import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://data.greenland77.ge';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.DpZQyX183OgnIZzMVof65-tHkpoLVCXH80uI4qW5KsA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);