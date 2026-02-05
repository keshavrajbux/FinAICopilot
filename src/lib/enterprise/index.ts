/**
 * Enterprise Layer - B2B Platform
 *
 * Multi-tenant infrastructure for distributing the product through financial institutions.
 *
 * RULES:
 * - enterprise/ imports from core/ and product/
 * - enterprise/ is NEVER imported by core/ or product/
 * - Only API routes and enterprise-specific UI import from enterprise/
 */

// Re-export from existing platform/ module
// (platform/ is the implementation; enterprise/ is the public interface)
export { TenantManager, tenantManager } from '../platform/tenant-manager';
export {
  extractApiKey,
  authenticateTenantFromRequest,
  withTenantAuth,
  requireFeature,
  logApiRequest,
  trackApiUsage,
  getClientIp,
  validateCors,
  setCorsHeaders,
  handleCorsPrelight,
} from '../platform/tenant-middleware';
export type { TenantRequest } from '../platform/tenant-middleware';
export { rateLimiter, enforceRateLimit } from '../platform/rate-limiter';
export type {
  TenantConfig,
  TenantUsageMetrics,
  TenantAPIKey,
  TenantUser,
  AuditLogEntry,
  ComplianceCheckResult,
  ComplianceIssue,
  FinancialProduct,
  TenantTier,
  TierLimits,
} from '../platform/types';
export { TIER_LIMITS } from '../platform/types';
