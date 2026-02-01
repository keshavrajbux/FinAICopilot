/**
 * Shared API utilities for authentication, CORS, and error handling
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Authentication result
 */
export interface AuthResult {
  userId: string | null;
  error: string | null;
}

/**
 * Get the authenticated user ID from the request
 * Returns the user ID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthResult> {
  try {
    const supabase = createPagesServerClient({ req, res });
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      // Don't log "Auth session missing" as it's expected for unauthenticated users
      if (!error.message?.includes('session missing')) {
        console.error('Auth error:', error.message);
      }
      return { userId: null, error: 'Authentication failed' };
    }

    if (!user) {
      return { userId: null, error: 'Not authenticated' };
    }

    return { userId: user.id, error: null };
  } catch (error) {
    console.error('Auth exception:', error);
    return { userId: null, error: 'Authentication error' };
  }
}

/**
 * Allowed origins for CORS
 * In production, this should be your actual domain(s)
 */
const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  // Allow localhost in development
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : []),
].filter(Boolean) as string[];

/**
 * Set secure CORS headers
 */
export function setCorsHeaders(req: NextApiRequest, res: NextApiResponse): void {
  const origin = req.headers.origin;

  // Check if the origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // In development, be more permissive but log warnings
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      console.warn(`CORS: Allowing unlisted origin in development: ${origin}`);
    }
  }
  // In production with unknown origin, don't set the header (browser will block)

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * Handle CORS preflight request
 * Returns true if this was a preflight request (caller should return early)
 */
export function handleCorsPrelight(req: NextApiRequest, res: NextApiResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

/**
 * Send a standardized error response
 * Logs the full error server-side, returns a safe message to the client
 */
export function sendErrorResponse(
  res: NextApiResponse,
  statusCode: number,
  publicMessage: string,
  internalError?: unknown
): void {
  // Log the full error server-side for debugging
  if (internalError) {
    console.error(`API Error [${statusCode}]:`, {
      publicMessage,
      internalError: internalError instanceof Error ? internalError.message : internalError,
      stack: internalError instanceof Error ? internalError.stack : undefined,
      timestamp: new Date().toISOString(),
    });
  }

  // Send a safe response to the client (no internal details)
  res.status(statusCode).json({
    error: publicMessage,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Send an unauthorized response
 */
export function sendUnauthorized(res: NextApiResponse, message = 'Unauthorized'): void {
  sendErrorResponse(res, 401, message);
}

/**
 * Send a method not allowed response
 */
export function sendMethodNotAllowed(res: NextApiResponse, allowed: string[]): void {
  res.setHeader('Allow', allowed.join(', '));
  sendErrorResponse(res, 405, `Method not allowed. Use: ${allowed.join(', ')}`);
}
