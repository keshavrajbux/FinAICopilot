# Database Setup for Financial Decision Copilot

## Prerequisites
- A Supabase account and project
- Your Supabase URL and API keys

## Setting up the Required Tables

To make the Financial Decision Copilot work correctly, you need to set up two essential tables in your Supabase database. You can do this through the Supabase SQL Editor.

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL code below
5. Run the query

```sql
-- Create financial_data table
CREATE TABLE IF NOT EXISTS financial_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  financial_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create financial_analyses table
CREATE TABLE IF NOT EXISTS financial_analyses (
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
  ON financial_data FOR ALL
  USING (user_id = 'demo-user-123');

CREATE POLICY "Allow demo user access to financial analyses"
  ON financial_analyses FOR ALL
  USING (user_id = 'demo-user-123');
```

## Verifying the Setup

After running the SQL, verify that your tables were created successfully:

1. Go to the "Table Editor" in your Supabase dashboard
2. You should see `financial_data` and `financial_analyses` tables
3. Check the structure of each table to ensure they match the SQL above

## Troubleshooting

If you encounter any errors when the app tries to save data to Supabase:

1. Check that your environment variables are set correctly in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Verify that your RLS (Row Level Security) policies are set up correctly
3. For testing, you can temporarily disable RLS to rule out permission issues 