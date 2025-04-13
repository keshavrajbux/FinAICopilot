-- Enable the necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create financial_data table
DROP TABLE IF EXISTS financial_data;
CREATE TABLE financial_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  financial_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create financial_analyses table
DROP TABLE IF EXISTS financial_analyses;
CREATE TABLE financial_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS financial_data_user_id_idx ON financial_data(user_id);
CREATE INDEX IF NOT EXISTS financial_analyses_user_id_idx ON financial_analyses(user_id);

-- Set up row-level security (RLS)
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_analyses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own financial data" ON financial_data;
DROP POLICY IF EXISTS "Users can insert own financial data" ON financial_data;
DROP POLICY IF EXISTS "Users can view own financial analyses" ON financial_analyses;
DROP POLICY IF EXISTS "Users can insert own financial analyses" ON financial_analyses;
DROP POLICY IF EXISTS "Allow demo user access to financial data" ON financial_data;
DROP POLICY IF EXISTS "Allow demo user access to financial analyses" ON financial_analyses;

-- Create policies for financial_data
CREATE POLICY "Users can view own financial data"
  ON financial_data FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own financial data"
  ON financial_data FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Create policies for financial_analyses
CREATE POLICY "Users can view own financial analyses"
  ON financial_analyses FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own financial analyses"
  ON financial_analyses FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- For demo purposes, allow access with demo-user-123
CREATE POLICY "Allow demo user access to financial data"
  ON financial_data
  USING (user_id = 'demo-user-123' OR auth.uid()::text = user_id);

CREATE POLICY "Allow demo user access to financial analyses"
  ON financial_analyses
  USING (user_id = 'demo-user-123' OR auth.uid()::text = user_id);

-- Grant basic permissions
GRANT SELECT, INSERT ON financial_data TO anon, authenticated;
GRANT SELECT, INSERT ON financial_analyses TO anon, authenticated;

-- Manually insert a test record if needed for verification
INSERT INTO financial_data (user_id, financial_data)
VALUES (
  'demo-user-123', 
  '{"monthlyIncome": 5000, "monthlyExpenses": 3000, "savings": 10000, "investments": 20000, "debt": 15000}'
); 