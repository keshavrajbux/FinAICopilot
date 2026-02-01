import { checkRateLimit, RateLimitResult, AI_RATE_LIMIT } from '@/lib/rate-limit';
import { NextApiRequest } from 'next';

// Mock NextApiRequest
function createMockRequest(ip: string = '127.0.0.1'): NextApiRequest {
  return {
    headers: {
      'x-forwarded-for': ip,
    },
    socket: {
      remoteAddress: ip,
    },
  } as unknown as NextApiRequest;
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clear any rate limit state between tests by using unique IPs
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', () => {
      const req = createMockRequest('192.168.1.1');
      const result = checkRateLimit(req, { maxRequests: 5, keyPrefix: 'test1' });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('should track request count correctly', () => {
      const ip = '192.168.1.2';
      const options = { maxRequests: 3, keyPrefix: 'test2' };

      // First request
      let result = checkRateLimit(createMockRequest(ip), options);
      expect(result.remaining).toBe(2);

      // Second request
      result = checkRateLimit(createMockRequest(ip), options);
      expect(result.remaining).toBe(1);

      // Third request
      result = checkRateLimit(createMockRequest(ip), options);
      expect(result.remaining).toBe(0);
      expect(result.success).toBe(true);
    });

    it('should block requests over the limit', () => {
      const ip = '192.168.1.3';
      const options = { maxRequests: 2, keyPrefix: 'test3' };

      // Use up the limit
      checkRateLimit(createMockRequest(ip), options);
      checkRateLimit(createMockRequest(ip), options);

      // This should be blocked
      const result = checkRateLimit(createMockRequest(ip), options);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', () => {
      const ip = '192.168.1.4';
      const windowMs = 1000; // 1 second
      const options = { maxRequests: 1, windowMs, keyPrefix: 'test4' };

      // Use up the limit
      let result = checkRateLimit(createMockRequest(ip), options);
      expect(result.success).toBe(true);

      // Should be blocked
      result = checkRateLimit(createMockRequest(ip), options);
      expect(result.success).toBe(false);

      // Advance time past the window
      jest.advanceTimersByTime(windowMs + 100);

      // Should be allowed again
      result = checkRateLimit(createMockRequest(ip), options);
      expect(result.success).toBe(true);
    });

    it('should track different IPs separately', () => {
      const options = { maxRequests: 1, keyPrefix: 'test5' };

      // IP 1 uses their limit
      let result = checkRateLimit(createMockRequest('10.0.0.1'), options);
      expect(result.success).toBe(true);

      // IP 1 is blocked
      result = checkRateLimit(createMockRequest('10.0.0.1'), options);
      expect(result.success).toBe(false);

      // IP 2 should still be allowed
      result = checkRateLimit(createMockRequest('10.0.0.2'), options);
      expect(result.success).toBe(true);
    });

    it('should track different key prefixes separately', () => {
      const ip = '192.168.1.5';

      // Use up limit for prefix A
      checkRateLimit(createMockRequest(ip), { maxRequests: 1, keyPrefix: 'prefixA' });
      const resultA = checkRateLimit(createMockRequest(ip), { maxRequests: 1, keyPrefix: 'prefixA' });
      expect(resultA.success).toBe(false);

      // Prefix B should still be allowed
      const resultB = checkRateLimit(createMockRequest(ip), { maxRequests: 1, keyPrefix: 'prefixB' });
      expect(resultB.success).toBe(true);
    });
  });

  describe('AI_RATE_LIMIT config', () => {
    it('should have stricter limits for AI endpoints', () => {
      expect(AI_RATE_LIMIT.maxRequests).toBeLessThanOrEqual(10);
      expect(AI_RATE_LIMIT.keyPrefix).toBe('ai');
    });
  });

  describe('IP extraction', () => {
    it('should use x-forwarded-for header when present', () => {
      const req = {
        headers: { 'x-forwarded-for': '1.2.3.4' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as NextApiRequest;

      const result = checkRateLimit(req, { maxRequests: 1, keyPrefix: 'ip-test1' });
      expect(result.success).toBe(true);

      // Same forwarded IP should count
      const result2 = checkRateLimit(req, { maxRequests: 1, keyPrefix: 'ip-test1' });
      expect(result2.success).toBe(false);
    });

    it('should handle comma-separated x-forwarded-for', () => {
      const req = {
        headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as NextApiRequest;

      // Should use the first IP (1.2.3.4)
      const result = checkRateLimit(req, { maxRequests: 100, keyPrefix: 'ip-test2' });
      expect(result.success).toBe(true);
    });
  });
});
