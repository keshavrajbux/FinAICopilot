/**
 * Simple in-memory rate limiter for API routes
 *
 * For production at scale, consider using:
 * - Vercel Edge Middleware with KV storage
 * - Redis-based rate limiting (e.g., @upstash/ratelimit)
 * - Cloudflare Workers rate limiting
 */

import { NextApiRequest, NextApiResponse } from 'next';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (resets on serverless cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_CONFIG = {
  // Default: 20 requests per minute
  windowMs: 60 * 1000,
  maxRequests: 20,

  // AI analysis endpoints: 10 requests per minute (more expensive)
  ai: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
};

/**
 * Get client identifier from request
 * Uses X-Forwarded-For header (set by Vercel/proxies) or falls back to a default
 */
function getClientId(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // Take the first IP if there are multiple
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }

  // Fallback for local development
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  });
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  req: NextApiRequest,
  options: { windowMs?: number; maxRequests?: number; keyPrefix?: string } = {}
): RateLimitResult {
  const {
    windowMs = RATE_LIMIT_CONFIG.windowMs,
    maxRequests = RATE_LIMIT_CONFIG.maxRequests,
    keyPrefix = 'default',
  } = options;

  const clientId = getClientId(req);
  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Create new entry or reset if window expired
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, maxRequests - entry.count);
  const success = entry.count <= maxRequests;

  return {
    success,
    limit: maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Apply rate limiting to an API route
 * Returns true if the request should be blocked
 */
export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  options: { windowMs?: number; maxRequests?: number; keyPrefix?: string } = {}
): boolean {
  const result = checkRateLimit(req, options);

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', result.limit);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));

  if (!result.success) {
    res.setHeader('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000));
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
    });
    return true; // Request blocked
  }

  return false; // Request allowed
}

/**
 * Rate limit configuration for AI-intensive endpoints
 */
export const AI_RATE_LIMIT = {
  windowMs: RATE_LIMIT_CONFIG.ai.windowMs,
  maxRequests: RATE_LIMIT_CONFIG.ai.maxRequests,
  keyPrefix: 'ai',
};
