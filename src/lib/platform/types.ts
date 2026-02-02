/**
 * Enterprise Multi-Tenant Platform Types
 *
 * Core type definitions for multi-tenant architecture
 */

export interface TenantConfig {
  id: string;
  organizationName: string;
  displayName: string;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  tier: 'starter' | 'growth' | 'enterprise';

  // Branding
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
  };

  // API Configuration
  apiConfig: {
    apiKey: string;
    webhookUrl?: string;
    webhookSecret?: string;
    allowedOrigins: string[];
  };

  // Feature Flags
  features: {
    basicAnalysis: boolean;
    productRecommendations: boolean;
    riskAssessment: boolean;
    earlyWarning: boolean;
    conversationalAI: boolean;
    whiteLabel: boolean;
    customAgents: boolean;
    advancedAnalytics: boolean;
  };

  // Limits & Quotas
  limits: {
    maxUsers: number;
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
    maxTokensPerRequest: number;
  };

  // Compliance Rules
  compliance: {
    regulatoryFramework: ('FDIC' | 'FINRA' | 'SEC' | 'CFPB')[];
    requiredDisclosures: string[];
    autoComplianceCheck: boolean;
    auditRetentionDays: number;
  };

  // Data Settings
  dataConfig: {
    dataResidency: 'us' | 'eu' | 'asia';
    encryptionEnabled: boolean;
    piiMaskingEnabled: boolean;
  };

  // Billing
  billing: {
    subscriptionId?: string;
    billingEmail: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    usageBasedBilling: boolean;
  };

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface TenantUsageMetrics {
  tenantId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    errorRate: number;
  };
  costs: {
    anthropicApiCost: number;
    infrastructureCost: number;
    totalCost: number;
  };
}

export interface TenantAPIKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string; // First 8 chars of the key for identification
  keyHash: string; // Hashed full key
  permissions: ('read' | 'write' | 'admin')[];
  status: 'active' | 'revoked';
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  createdBy: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string; // End user ID
  metadata?: Record<string, any>;
  createdAt: string;
  lastActiveAt: string;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ComplianceCheckResult {
  approved: boolean;
  issues: ComplianceIssue[];
  suggestedEdits?: string;
  reviewedAt: string;
}

export interface ComplianceIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  regulation: string;
  description: string;
  location?: string;
  suggestion?: string;
}

export interface FinancialProduct {
  id: string;
  tenantId: string;
  type: 'credit_card' | 'loan' | 'savings' | 'investment' | 'insurance';
  name: string;
  description: string;
  features: string[];
  terms: {
    apr?: number;
    fees?: Record<string, number>;
    minimumBalance?: number;
    rewards?: string;
  };
  eligibility: {
    minCreditScore?: number;
    minIncome?: number;
    employmentRequired?: boolean;
  };
  disclosures: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TenantTier = 'starter' | 'growth' | 'enterprise';

export interface TierLimits {
  maxUsers: number;
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  features: string[];
  sla: string;
  support: string;
}

export const TIER_LIMITS: Record<TenantTier, TierLimits> = {
  starter: {
    maxUsers: 10000,
    maxRequestsPerMinute: 100,
    maxRequestsPerDay: 50000,
    features: ['basicAnalysis', 'productRecommendations'],
    sla: '99.5%',
    support: 'email'
  },
  growth: {
    maxUsers: 100000,
    maxRequestsPerMinute: 500,
    maxRequestsPerDay: 500000,
    features: ['basicAnalysis', 'productRecommendations', 'riskAssessment', 'whiteLabel'],
    sla: '99.9%',
    support: 'priority'
  },
  enterprise: {
    maxUsers: 1000000,
    maxRequestsPerMinute: 2000,
    maxRequestsPerDay: 5000000,
    features: ['all'],
    sla: '99.99%',
    support: 'dedicated_csm'
  }
};
