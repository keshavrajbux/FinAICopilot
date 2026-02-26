/**
 * Feature Flags
 *
 * Controls which capabilities are enabled for which product variant.
 * This replaces the need for separate branches for different product lines.
 *
 * Usage:
 *   import { features } from '@/lib/shared/feature-flags';
 *   if (features.isEnabled('enterprise.multiTenant')) { ... }
 *
 * Flags can be driven by:
 *   1. Environment variables (FEATURE_FLAG_<NAME>=true)
 *   2. Tenant configuration (per-tenant flags from the enterprise layer)
 *   3. Hardcoded defaults (for the consumer product)
 */

type FeatureFlag =
  // Core orchestrator features
  | 'core.claudeProvider'
  | 'core.openaiProvider'
  | 'core.localFallback'

  // Product features (fintech)
  | 'product.financialAnalysis'
  | 'product.cashFlowForecast'
  | 'product.riskAssessment'
  | 'product.productRecommendations'
  | 'product.conversationalAI'
  | 'product.earlyWarning'

  // Enterprise features (B2B)
  | 'enterprise.multiTenant'
  | 'enterprise.whiteLabel'
  | 'enterprise.customAgents'
  | 'enterprise.advancedAnalytics'
  | 'enterprise.complianceEngine'
  | 'enterprise.auditLogging';

/** Default flags for each product variant */
type ProductVariant = 'consumer' | 'enterprise';

const VARIANT_DEFAULTS: Record<ProductVariant, Set<FeatureFlag>> = {
  consumer: new Set<FeatureFlag>([
    'core.claudeProvider',
    'core.openaiProvider',
    'core.localFallback',
    'product.financialAnalysis',
    'product.cashFlowForecast',
  ]),
  enterprise: new Set<FeatureFlag>([
    'core.claudeProvider',
    'core.openaiProvider',
    'core.localFallback',
    'product.financialAnalysis',
    'product.cashFlowForecast',
    'product.riskAssessment',
    'product.productRecommendations',
    'product.conversationalAI',
    'product.earlyWarning',
    'enterprise.multiTenant',
    'enterprise.whiteLabel',
    'enterprise.customAgents',
    'enterprise.advancedAnalytics',
    'enterprise.complianceEngine',
    'enterprise.auditLogging',
  ]),
};

class FeatureFlags {
  private overrides = new Map<FeatureFlag, boolean>();
  private variant: ProductVariant;

  constructor() {
    // Determine variant from environment
    this.variant = (process.env.PRODUCT_VARIANT as ProductVariant) || 'consumer';
    this.loadEnvOverrides();
  }

  /** Check if a feature is enabled */
  isEnabled(flag: FeatureFlag): boolean {
    // Explicit override takes precedence
    const override = this.overrides.get(flag);
    if (override !== undefined) {
      return override;
    }

    // Fall back to variant defaults
    return VARIANT_DEFAULTS[this.variant]?.has(flag) ?? false;
  }

  /** Get the current product variant */
  getVariant(): ProductVariant {
    return this.variant;
  }

  /** Set a runtime override (useful for per-tenant flags) */
  setOverride(flag: FeatureFlag, enabled: boolean): void {
    this.overrides.set(flag, enabled);
  }

  /** Clear all runtime overrides */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /** Create a scoped copy with tenant-specific overrides */
  withTenantFlags(tenantFeatures: Record<string, boolean>): FeatureFlags {
    const scoped = new FeatureFlags();
    scoped.variant = 'enterprise';

    // Map tenant feature names to our flag names
    const featureMapping: Record<string, FeatureFlag> = {
      basicAnalysis: 'product.financialAnalysis',
      cashFlowForecast: 'product.cashFlowForecast',
      riskAssessment: 'product.riskAssessment',
      productRecommendations: 'product.productRecommendations',
      conversationalAI: 'product.conversationalAI',
      earlyWarning: 'product.earlyWarning',
      whiteLabel: 'enterprise.whiteLabel',
      customAgents: 'enterprise.customAgents',
      advancedAnalytics: 'enterprise.advancedAnalytics',
    };

    for (const [tenantKey, enabled] of Object.entries(tenantFeatures)) {
      const flag = featureMapping[tenantKey];
      if (flag) {
        scoped.setOverride(flag, enabled);
      }
    }

    return scoped;
  }

  /** Load overrides from environment variables */
  private loadEnvOverrides(): void {
    const prefix = 'FEATURE_FLAG_';
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value !== undefined) {
        // Convert FEATURE_FLAG_CORE_CLAUDE_PROVIDER to core.claudeProvider
        const flagName = key
          .substring(prefix.length)
          .toLowerCase()
          .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          .replace(/_/g, '.');

        // Only set if it's a known flag
        const knownFlags = new Set<string>(
          Object.values(VARIANT_DEFAULTS).flatMap((s) => Array.from(s))
        );
        if (knownFlags.has(flagName)) {
          this.overrides.set(flagName as FeatureFlag, value === 'true');
        }
      }
    }
  }
}

/** Global feature flags instance */
export const features = new FeatureFlags();

export type { FeatureFlag, ProductVariant };
