import { createClient } from '@supabase/supabase-js';

// Supabase client — initialized from environment variables.
// NEXT_PUBLIC_ prefix makes these available in the browser bundle;
// the anon key is safe to expose publicly (RLS policies enforce access control).
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
