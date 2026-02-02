/**
 * Tenant Authentication Middleware
 *
 * Authenticates API requests and sets tenant context
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { tenantManager } from './tenant-manager';
import { TenantConfig } from './types';

export interface TenantRequest extends NextApiRequest {
  tenant?: TenantConfig;
  tenantId?: string;
  endUserId?: string;
}

/**
 * Extract API key from request headers
 */
export function extractApiKey(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer <key>" and "ApiKey <key>" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (authHeader.startsWith('ApiKey ')) {
    return authHeader.substring(7);
  }

  // Also check for x-api-key header
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader && typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Authenticate tenant from API request
 */
export async function authenticateTenantFromRequest(
  req: NextApiRequest
): Promise<TenantConfig | null> {
  // Extract API key
  const apiKey = extractApiKey(req);

  if (!apiKey) {
    return null;
  }

  // Authenticate tenant
  const tenant = await tenantManager.authenticateTenant(apiKey);

  if (!tenant) {
    return null;
  }

  // Set tenant context for RLS
  await tenantManager.setTenantContext(tenant.id);

  return tenant;
}

/**
 * Middleware to require tenant authentication
 */
export function withTenantAuth(
  handler: (req: TenantRequest, res: NextApiResponse, tenant: TenantConfig) => Promise<void>
) {
  return async (req: TenantRequest, res: NextApiResponse) => {
    try {
      // Authenticate tenant
      const tenant = await authenticateTenantFromRequest(req);

      if (!tenant) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or missing API key',
          code: 'INVALID_API_KEY'
        });
      }

      // Check tenant status
      if (tenant.status === 'suspended') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Tenant account is suspended',
          code: 'TENANT_SUSPENDED'
        });
      }

      if (tenant.status === 'inactive') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Tenant account is inactive',
          code: 'TENANT_INACTIVE'
        });
      }

      // Attach tenant to request
      req.tenant = tenant;
      req.tenantId = tenant.id;

      // Extract end user ID from request body or headers
      const endUserId = req.body?.userId || req.headers['x-user-id'];
      if (endUserId && typeof endUserId === 'string') {
        req.endUserId = endUserId;
      }

      // Call the actual handler
      await handler(req, res, tenant);
    } catch (error) {
      console.error('Error in tenant auth middleware:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during authentication',
        code: 'AUTH_ERROR'
      });
    }
  };
}

/**
 * Middleware to check if tenant has access to a feature
 */
export function requireFeature(featureName: string) {
  return (
    handler: (req: TenantRequest, res: NextApiResponse, tenant: TenantConfig) => Promise<void>
  ) => {
    return withTenantAuth(async (req, res, tenant) => {
      // Check if tenant has the required feature
      if (!tenantManager.hasFeature(tenant, featureName)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This feature is not available on your plan. Feature: ${featureName}`,
          code: 'FEATURE_NOT_AVAILABLE',
          requiredFeature: featureName,
          currentTier: tenant.tier
        });
      }

      // Call the actual handler
      await handler(req, res, tenant);
    });
  };
}

/**
 * Log API request for audit trail
 */
export async function logApiRequest(
  tenantId: string,
  userId: string | undefined,
  action: string,
  resource: string,
  details: Record<string, any>,
  req: NextApiRequest
): Promise<void> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('audit_logs').insert([
      {
        tenant_id: tenantId,
        user_id: userId,
        action,
        resource,
        details,
        ip_address: getClientIp(req),
        user_agent: req.headers['user-agent']
      }
    ]);
  } catch (error) {
    console.error('Error logging API request:', error);
  }
}

/**
 * Track API usage for billing
 */
export async function trackApiUsage(
  tenantId: string,
  metrics: {
    tokens?: number;
    requests?: number;
    responseTimeMs?: number;
  }
): Promise<void> {
  try {
    // This will be implemented with a time-series database or aggregation service
    // For now, we'll just log it
    console.log('API Usage:', { tenantId, ...metrics });
  } catch (error) {
    console.error('Error tracking API usage:', error);
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress;
}

/**
 * Validate CORS for tenant
 */
export function validateCors(req: NextApiRequest, tenant: TenantConfig): boolean {
  const origin = req.headers.origin;

  if (!origin) {
    // Allow requests without origin (e.g., server-to-server)
    return true;
  }

  const allowedOrigins = tenant.apiConfig.allowedOrigins || ['*'];

  // Check if origin is allowed
  if (allowedOrigins.includes('*')) {
    return true;
  }

  return allowedOrigins.some(allowed => {
    // Support wildcard subdomains (e.g., "*.example.com")
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2);
      return origin.endsWith(domain);
    }
    return origin === allowed;
  });
}

/**
 * Set CORS headers for tenant
 */
export function setCorsHeaders(
  req: NextApiRequest,
  res: NextApiResponse,
  tenant: TenantConfig
): void {
  const origin = req.headers.origin;

  if (origin && validateCors(req, tenant)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, X-Api-Key, X-User-Id'
    );
  }
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPrelight(
  req: NextApiRequest,
  res: NextApiResponse,
  tenant: TenantConfig
): boolean {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(req, res, tenant);
    res.status(200).end();
    return true;
  }
  return false;
}
