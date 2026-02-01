/**
 * Browser-safe Supabase Client
 *
 * This client uses the anonymous key and is safe to use in client-side components.
 * For server-side operations requiring admin access, use supabase-admin.ts instead.
 *
 * If Supabase is not configured, the app will run in "demo mode" without auth/persistence.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Lazy-initialize the client to avoid errors during build
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
    });
  }

  return supabaseClient;
}

// Export the client (may be null if not configured)
const supabase = getSupabaseClient();

export default supabase;
