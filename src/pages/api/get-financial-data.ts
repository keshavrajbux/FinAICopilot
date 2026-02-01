import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  getAuthenticatedUser,
  setCorsHeaders,
  handleCorsPrelight,
  sendUnauthorized,
  sendMethodNotAllowed,
} from '@/lib/api-utils';
import { applyRateLimit } from '@/lib/rate-limit';

/**
 * GET /api/get-financial-data
 *
 * Retrieves the latest financial data for the authenticated user.
 * Requires authentication in production.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers (secure, origin-checked)
  setCorsHeaders(req, res);

  // Handle preflight
  if (handleCorsPrelight(req, res)) {
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  // Apply rate limiting
  if (applyRateLimit(req, res)) {
    return; // Request was rate limited
  }

  try {
    // Authenticate user
    const { userId } = await getAuthenticatedUser(req, res);

    let effectiveUserId: string;

    if (!userId) {
      // In production, require authentication
      if (process.env.NODE_ENV === 'production') {
        return sendUnauthorized(res, 'Authentication required');
      }
      // In development, use demo user (no warning spam)
      effectiveUserId = 'demo-user-dev';
    } else {
      effectiveUserId = userId;
    }

    // Use admin client if available, otherwise fall back to regular client
    const dbClient = supabaseAdmin || supabase;

    // If no client is available, return 404 (no saved data)
    if (!dbClient) {
      return res.status(404).json({ message: 'No financial data found' });
    }

    // Get latest financial data for the user
    const { data, error } = await dbClient
      .from('financial_data')
      .select('*')
      .eq('user_id', effectiveUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Handle "no rows returned" as a 404, not an error
    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ message: 'No financial data found' });
    }

    if (error) {
      // Return 404 instead of 500 for better UX (just use default values)
      return res.status(404).json({ message: 'No financial data found' });
    }

    // Return the financial data
    return res.status(200).json(data);
  } catch (error) {
    // Return 404 on any error (let the UI use default values)
    return res.status(404).json({ message: 'No financial data found' });
  }
}
