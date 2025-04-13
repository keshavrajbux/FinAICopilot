#!/usr/bin/env node
/**
 * Database setup script for the Financial Decision Copilot
 * This script runs the SQL queries to create the required tables and policies in Supabase
 * 
 * Usage: 
 * 1. Make sure you have the SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file
 * 2. Run: node setup-database.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env.local file.');
  process.exit(1);
}

console.log('🔧 Setting up database for Financial Decision Copilot...');

// Create Supabase client with service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function setup() {
  try {
    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚙️ Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('pgcall', { query: statement + ';' });
      
      if (error) {
        console.warn(`⚠️ Statement ${i + 1} error:`, error.message);
      }
    }

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .in('tablename', ['financial_data', 'financial_analyses']);

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError.message);
    } else {
      const tableNames = tables.map(t => t.tablename);
      
      if (tableNames.includes('financial_data') && tableNames.includes('financial_analyses')) {
        console.log('✅ Database setup complete! Both tables created successfully.');
      } else {
        console.warn('⚠️ Some tables may be missing:', 
          !tableNames.includes('financial_data') ? 'financial_data ' : '',
          !tableNames.includes('financial_analyses') ? 'financial_analyses' : '');
      }
    }

    console.log('🎉 Setup process finished. You can now use the Financial Decision Copilot!');
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup(); 