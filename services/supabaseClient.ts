
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (url && key) {
    supabaseInstance = createClient(url, key);
  }
};

export const getSupabase = () => supabaseInstance;
