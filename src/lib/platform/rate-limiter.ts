/**
 * Enterprise Rate Limiter
 *
 * Provides per-tenant rate limiting with in-memory storage
 * For production, this should be replaced with Redis or Upstash
 */

import { TenantConfig } from './types';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private perMinuteLimits = new Map<string, RateLimitEntry>();
  private perDayLimits = new Map<string, RateLimitEntry>();

  /**
   * Check if request is within rate limits
   */
  async checkRateLimit(
    tenantId: string,
    tenant: TenantConfig
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const now = Date.now();

    // Check per-minute limit
    const minuteKey = `${tenantId}:minute`;
    const minuteLimit = tenant.limits.maxRequestsPerMinute;
    const minuteEntry = this.perMinuteLimits.get(minuteKey);

    if (minuteEntry && minuteEntry.resetAt > now) {
      if (minuteEntry.count >= minuteLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: minuteEntry.resetAt
        };
      }
      minuteEntry.count++;
    } else {
      this.perMinuteLimits.set(minuteKey, {
        count: 1,
        resetAt: now + 60 * 1000 // 1 minute
      });
    }

    // Check per-day limit
    const dayKey = `${tenantId}:day`;
    const dayLimit = tenant.limits.maxRequestsPerDay;
    const dayEntry = this.perDayLimits.get(dayKey);

    if (dayEntry && dayEntry.resetAt > now) {
      if (dayEntry.count >= dayLimit) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: dayEntry.resetAt
        };
      }
      dayEntry.count++;
    } else {
      this.perDayLimits.set(dayKey, {
        count: 1,
        resetAt: now + 24 * 60 * 60 * 1000 // 1 day
      });
    }

    // Calculate remaining
    const currentMinuteEntry = this.perMinuteLimits.get(minuteKey)!;
    const remaining = minuteLimit - currentMinuteEntry.count;

    return {
      allowed: true,
      remaining,
      resetAt: currentMinuteEntry.resetAt
    };
  }

  /**
   * Set rate limit headers on response
   */
  setRateLimitHeaders(
    res: any,
    result: { allowed: boolean; remaining: number; resetAt: number }
  ): void {
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt / 1000).toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000).toString());
    }
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up per-minute limits
    this.perMinuteLimits.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        this.perMinuteLimits.delete(key);
      }
    });

    // Clean up per-day limits
    this.perDayLimits.forEach((entry, key) => {
      if (entry.resetAt <= now) {
        this.perDayLimits.delete(key);
      }
    });
  }
}

// Export singleton
export const rateLimiter = new RateLimiter();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Middleware to enforce rate limits
 */
export async function enforceRateLimit(
  tenantId: string,
  tenant: TenantConfig,
  res: any
): Promise<boolean> {
  const result = await rateLimiter.checkRateLimit(tenantId, tenant);

  // Set headers
  rateLimiter.setRateLimitHeaders(res, result);

  if (!result.allowed) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        resetAt: new Date(result.resetAt).toISOString()
      }
    });
    return false;
  }

  return true;
}
