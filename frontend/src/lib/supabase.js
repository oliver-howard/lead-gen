import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Graceful fallback so the UI renders even without .env configured yet
const supabase = (url && key)
  ? createClient(url, key)
  : { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) };

export default supabase;
