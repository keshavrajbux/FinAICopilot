import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Key is missing. Check your environment variables.');
}

// Create a standard client for client-side operations (with anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
});

// Create an admin client for server-side operations that need to bypass RLS
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
    })
  : null;

// Logs for debugging - only in development
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration:');
  console.log('- URL configured:', !!supabaseUrl);
  console.log('- Anon key configured:', !!supabaseAnonKey);
  console.log('- Service role key configured:', !!supabaseServiceKey);
  console.log('- Admin client available:', !!supabaseAdmin);
}

export default supabase; 