-- ============================================================================
-- CREATE DEMO TENANT - Quick Start Script
-- ============================================================================
-- Run this in Supabase SQL Editor to create a demo tenant and API key
-- ============================================================================

-- 1. Create a demo tenant
DO $$
DECLARE
  new_tenant_id UUID;
  new_api_key TEXT;
  new_api_key_hash TEXT;
BEGIN
  -- Generate tenant
  INSERT INTO tenants (
    organization_name,
    display_name,
    status,
    tier,
    branding,
    features,
    limits,
    compliance,
    billing,
    created_by
  ) VALUES (
    'demo-bank-' || floor(random() * 10000)::text,
    'Demo Bank ' || floor(random() * 10000)::text,
    'active',
    'growth',
    '{
      "primaryColor": "#9333EA",
      "secondaryColor": "#7C3AED"
    }'::jsonb,
    '{
      "basicAnalysis": true,
      "productRecommendations": true,
      "riskAssessment": true,
      "earlyWarning": false,
      "conversationalAI": false,
      "whiteLabel": true,
      "customAgents": false,
      "advancedAnalytics": true
    }'::jsonb,
    '{
      "maxUsers": 100000,
      "maxRequestsPerMinute": 500,
      "maxRequestsPerDay": 500000,
      "maxTokensPerRequest": 4096
    }'::jsonb,
    '{
      "regulatoryFramework": ["FDIC", "FINRA", "CFPB"],
      "requiredDisclosures": [],
      "autoComplianceCheck": true,
      "auditRetentionDays": 2555
    }'::jsonb,
    '{
      "billingEmail": "billing@demobank.com",
      "usageBasedBilling": false
    }'::jsonb,
    'system'
  )
  RETURNING id INTO new_tenant_id;

  -- Generate a secure API key
  new_api_key := 'sk_live_' || encode(gen_random_bytes(32), 'base64');
  new_api_key_hash := encode(sha256(new_api_key::bytea), 'hex');

  -- Insert API key
  INSERT INTO tenant_api_keys (
    tenant_id,
    name,
    key_prefix,
    key_hash,
    permissions,
    status,
    created_by
  ) VALUES (
    new_tenant_id,
    'Demo API Key',
    substring(new_api_key, 1, 15),
    new_api_key_hash,
    ARRAY['read', 'write'],
    'active',
    'system'
  );

  -- Create some demo products
  INSERT INTO tenant_products (tenant_id, product_type, name, description, features, terms, eligibility, disclosures, active)
  VALUES
    (
      new_tenant_id,
      'credit_card',
      'Premium Rewards Card',
      'Earn 3% cash back on all purchases with no annual fee',
      ARRAY['3% cashback on all purchases', 'No annual fee', 'Travel insurance', 'Purchase protection'],
      '{
        "apr": 15.99,
        "fees": {"late_fee": 39, "foreign_transaction": 0},
        "rewards": "3% cashback on all purchases"
      }'::jsonb,
      '{
        "minCreditScore": 700,
        "minIncome": 50000,
        "employmentRequired": true
      }'::jsonb,
      ARRAY['APR varies by creditworthiness', 'Late payment fee applies', 'Rewards subject to terms'],
      true
    ),
    (
      new_tenant_id,
      'savings',
      'High-Yield Savings Account',
      'Earn 4.5% APY with no minimum balance or fees',
      ARRAY['4.5% APY', 'No minimum balance', 'No monthly fees', 'FDIC insured up to $250k'],
      '{
        "apr": 4.5,
        "fees": {},
        "minimumBalance": 0
      }'::jsonb,
      '{
        "minCreditScore": 0,
        "minIncome": 0,
        "employmentRequired": false
      }'::jsonb,
      ARRAY['APY subject to change', 'FDIC insured', 'Member FDIC'],
      true
    ),
    (
      new_tenant_id,
      'loan',
      'Personal Loan',
      'Borrow up to $50,000 at competitive rates',
      ARRAY['Up to $50,000', 'Fixed rates from 5.99%', 'No prepayment penalty', 'Fast approval'],
      '{
        "apr": 5.99,
        "fees": {"origination": 1}
      }'::jsonb,
      '{
        "minCreditScore": 650,
        "minIncome": 40000,
        "employmentRequired": true
      }'::jsonb,
      ARRAY['APR varies by creditworthiness', 'Origination fee applies', 'Terms up to 7 years'],
      true
    );

  -- Output results
  RAISE NOTICE '=======================================================';
  RAISE NOTICE 'DEMO TENANT CREATED SUCCESSFULLY!';
  RAISE NOTICE '=======================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Tenant ID: %', new_tenant_id;
  RAISE NOTICE 'Organization: demo-bank-*';
  RAISE NOTICE 'Tier: Growth';
  RAISE NOTICE 'Status: Active';
  RAISE NOTICE '';
  RAISE NOTICE '-------------------------------------------------------';
  RAISE NOTICE 'API KEY (SAVE THIS - IT WON''T BE SHOWN AGAIN!):';
  RAISE NOTICE '-------------------------------------------------------';
  RAISE NOTICE '%', new_api_key;
  RAISE NOTICE '-------------------------------------------------------';
  RAISE NOTICE '';
  RAISE NOTICE 'Test your API with:';
  RAISE NOTICE '';
  RAISE NOTICE 'curl -X POST http://localhost:3000/api/v1/enterprise/analyze \';
  RAISE NOTICE '  -H "Authorization: Bearer %s" \', new_api_key;
  RAISE NOTICE '  -H "Content-Type: application/json" \';
  RAISE NOTICE '  -d ''{"userId":"test_user_001","financialData":{"monthlyIncome":7500,"monthlyExpenses":4200,"savings":25000,"investments":150000,"debt":200000}}''';
  RAISE NOTICE '';
  RAISE NOTICE '=======================================================';

END $$;

-- 2. Verify tenant was created
SELECT
  id,
  organization_name,
  display_name,
  status,
  tier,
  created_at
FROM tenants
ORDER BY created_at DESC
LIMIT 1;

-- 3. Verify API key was created (key_hash shown, not actual key)
SELECT
  id,
  name,
  key_prefix,
  permissions,
  status,
  created_at
FROM tenant_api_keys
ORDER BY created_at DESC
LIMIT 1;

-- 4. Verify products were created
SELECT
  product_type,
  name,
  description,
  active
FROM tenant_products
WHERE tenant_id = (SELECT id FROM tenants ORDER BY created_at DESC LIMIT 1);

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
-- 1. The API key is displayed in the NOTICE output above
-- 2. Copy and save it immediately - it cannot be retrieved later
-- 3. If you miss it, run this script again to create a new tenant
-- 4. For production, use the TypeScript script: scripts/create-tenant.ts
-- ============================================================================
