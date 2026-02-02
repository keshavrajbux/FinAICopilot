-- ============================================================================
-- ENTERPRISE MULTI-TENANT DATABASE SCHEMA
-- ============================================================================
-- This schema provides complete tenant isolation with Row-Level Security (RLS)
-- Each tenant's data is logically separated and access-controlled
-- ============================================================================

-- ============================================================================
-- TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'trial', 'inactive')),
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'enterprise')),

  -- Branding
  branding JSONB NOT NULL DEFAULT '{
    "primaryColor": "#9333EA",
    "secondaryColor": "#7C3AED"
  }'::jsonb,

  -- API Configuration
  api_config JSONB NOT NULL DEFAULT '{
    "allowedOrigins": ["*"]
  }'::jsonb,

  -- Feature Flags
  features JSONB NOT NULL DEFAULT '{
    "basicAnalysis": true,
    "productRecommendations": true,
    "riskAssessment": false,
    "earlyWarning": false,
    "conversationalAI": false,
    "whiteLabel": false,
    "customAgents": false,
    "advancedAnalytics": false
  }'::jsonb,

  -- Limits & Quotas
  limits JSONB NOT NULL DEFAULT '{
    "maxUsers": 10000,
    "maxRequestsPerMinute": 100,
    "maxRequestsPerDay": 50000,
    "maxTokensPerRequest": 4096
  }'::jsonb,

  -- Compliance Rules
  compliance JSONB NOT NULL DEFAULT '{
    "regulatoryFramework": ["FDIC"],
    "requiredDisclosures": [],
    "autoComplianceCheck": true,
    "auditRetentionDays": 2555
  }'::jsonb,

  -- Data Settings
  data_config JSONB NOT NULL DEFAULT '{
    "dataResidency": "us",
    "encryptionEnabled": true,
    "piiMaskingEnabled": true
  }'::jsonb,

  -- Billing
  billing JSONB NOT NULL DEFAULT '{
    "usageBasedBilling": false
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,

  -- Indexes
  CONSTRAINT tenants_organization_name_check CHECK (length(organization_name) >= 2)
);

CREATE INDEX IF NOT EXISTS tenants_status_idx ON tenants(status);
CREATE INDEX IF NOT EXISTS tenants_tier_idx ON tenants(tier);
CREATE INDEX IF NOT EXISTS tenants_created_at_idx ON tenants(created_at DESC);

-- ============================================================================
-- TENANT API KEYS
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "sk_live_")
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of full key
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read', 'write'],
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')) DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,

  CONSTRAINT tenant_api_keys_tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS tenant_api_keys_tenant_id_idx ON tenant_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_api_keys_key_hash_idx ON tenant_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS tenant_api_keys_status_idx ON tenant_api_keys(status);

-- ============================================================================
-- TENANT USERS (End Users of Each Tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- External user ID from tenant's system
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tenant_users_tenant_user_unique UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_users_tenant_id_idx ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_users_user_id_idx ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS tenant_users_last_active_idx ON tenant_users(last_active_at DESC);

-- ============================================================================
-- FINANCIAL DATA (Multi-Tenant with RLS)
-- ============================================================================
-- Drop existing table and recreate with tenant isolation
DROP TABLE IF EXISTS financial_data CASCADE;

CREATE TABLE financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- Tenant's user ID
  financial_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT financial_data_tenant_user_unique UNIQUE (tenant_id, user_id, created_at)
);

CREATE INDEX IF NOT EXISTS financial_data_tenant_id_idx ON financial_data(tenant_id);
CREATE INDEX IF NOT EXISTS financial_data_user_id_idx ON financial_data(user_id);
CREATE INDEX IF NOT EXISTS financial_data_created_at_idx ON financial_data(created_at DESC);

-- ============================================================================
-- FINANCIAL ANALYSES (Multi-Tenant with RLS)
-- ============================================================================
DROP TABLE IF EXISTS financial_analyses CASCADE;

CREATE TABLE financial_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT financial_analyses_check_tokens CHECK (tokens_used >= 0)
);

CREATE INDEX IF NOT EXISTS financial_analyses_tenant_id_idx ON financial_analyses(tenant_id);
CREATE INDEX IF NOT EXISTS financial_analyses_user_id_idx ON financial_analyses(user_id);
CREATE INDEX IF NOT EXISTS financial_analyses_created_at_idx ON financial_analyses(created_at DESC);

-- ============================================================================
-- TENANT PRODUCTS (Financial Products per Tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_type TEXT NOT NULL CHECK (product_type IN ('credit_card', 'loan', 'savings', 'investment', 'insurance')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  eligibility JSONB NOT NULL DEFAULT '{}'::jsonb,
  disclosures TEXT[] DEFAULT ARRAY[]::TEXT[],
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tenant_products_tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS tenant_products_tenant_id_idx ON tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_products_active_idx ON tenant_products(active);
CREATE INDEX IF NOT EXISTS tenant_products_type_idx ON tenant_products(product_type);

-- ============================================================================
-- AUDIT LOGS (Compliance & Security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx ON audit_logs(user_id);

-- ============================================================================
-- USAGE METRICS (For Billing & Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_users INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  average_response_time_ms INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  anthropic_api_cost DECIMAL(10, 2) DEFAULT 0,
  infrastructure_cost DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tenant_usage_metrics_unique UNIQUE (tenant_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS tenant_usage_metrics_tenant_id_idx ON tenant_usage_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_usage_metrics_period_idx ON tenant_usage_metrics(period_start DESC, period_end DESC);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Financial Data Policies
CREATE POLICY "Tenants can only access their own financial data"
  ON financial_data
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Financial Analyses Policies
CREATE POLICY "Tenants can only access their own analyses"
  ON financial_analyses
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Tenant Users Policies
CREATE POLICY "Tenants can only access their own users"
  ON tenant_users
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Tenant Products Policies
CREATE POLICY "Tenants can only access their own products"
  ON tenant_products
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Audit Logs Policies
CREATE POLICY "Tenants can only access their own audit logs"
  ON audit_logs
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- Usage Metrics Policies
CREATE POLICY "Tenants can only access their own metrics"
  ON tenant_usage_metrics
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::UUID);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to set tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(tenant_uuid UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id', true)::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tenants updated_at
CREATE TRIGGER tenants_updated_at_trigger
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tenant_products updated_at
CREATE TRIGGER tenant_products_updated_at_trigger
  BEFORE UPDATE ON tenant_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Demo Tenant)
-- ============================================================================

-- Insert a demo tenant for testing
INSERT INTO tenants (
  id,
  organization_name,
  display_name,
  status,
  tier,
  created_by
) VALUES (
  gen_random_uuid(),
  'demo-bank',
  'Demo Financial Institution',
  'trial',
  'growth',
  'system'
) ON CONFLICT (organization_name) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tenants IS 'Core tenant configuration and settings';
COMMENT ON TABLE tenant_api_keys IS 'API keys for tenant authentication';
COMMENT ON TABLE tenant_users IS 'End users belonging to each tenant';
COMMENT ON TABLE financial_data IS 'Financial data submitted by tenant users';
COMMENT ON TABLE financial_analyses IS 'AI-generated financial analyses';
COMMENT ON TABLE tenant_products IS 'Financial products offered by each tenant';
COMMENT ON TABLE audit_logs IS 'Audit trail for compliance and security';
COMMENT ON TABLE tenant_usage_metrics IS 'Usage metrics for billing and analytics';

COMMENT ON FUNCTION set_tenant_context IS 'Sets the current tenant context for RLS';
COMMENT ON FUNCTION get_current_tenant IS 'Gets the current tenant ID from context';
