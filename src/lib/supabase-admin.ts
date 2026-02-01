/**
 * Server-only Supabase Admin Client
 *
 * WARNING: This file should ONLY be imported in server-side code (API routes, getServerSideProps).
 * It uses the service role key which bypasses Row-Level Security.
 *
 * NEVER import this file in client-side components.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Validate we're on the server
if (typeof window !== 'undefined') {
  throw new Error(
    'supabase-admin.ts was imported on the client side. ' +
    'This file contains the service role key and must only be used server-side.'
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });
}
// Note: If supabaseAdmin is null, operations will fall back to the regular client

export { supabaseAdmin };
