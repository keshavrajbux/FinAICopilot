import { NextApiRequest, NextApiResponse } from 'next';
import supabase, { supabaseAdmin } from '@/lib/supabase';

/**
 * API endpoint to test database connection and table setup
 * This is useful for debugging database configuration issues
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY
    };
    
    // Determine which client to use
    const dbClient = supabaseAdmin || supabase;
    const clientType = supabaseAdmin ? 'admin' : 'anonymous';
    
    // Test results object
    const results: any = {
      env: envCheck,
      clientAvailable: !!dbClient,
      clientType,
      databaseConnection: false,
      tables: {
        financial_data: false,
        financial_analyses: false
      },
      test_insert: {
        attempted: false,
        success: false,
        error: null
      }
    };
    
    // If we have a client, test the connection
    if (dbClient) {
      try {
        // Test basic connectivity - get Supabase version
        const { data: versionData, error: versionError } = await dbClient.rpc('version');
        
        if (versionError) {
          results.databaseConnection = false;
          results.connectionError = versionError.message;
        } else {
          results.databaseConnection = true;
          results.version = versionData;
          
          // Check if tables exist
          try {
            // Check financial_data
            const { count: dataCount, error: dataError } = await dbClient
              .from('financial_data')
              .select('*', { count: 'exact', head: true })
              .limit(0);
              
            if (dataError) {
              results.tables.financial_data = false;
              results.tables.financial_data_error = dataError.message;
            } else {
              results.tables.financial_data = true;
              results.tables.financial_data_count = dataCount;
            }
            
            // Check financial_analyses
            const { count: analysesCount, error: analysesError } = await dbClient
              .from('financial_analyses')
              .select('*', { count: 'exact', head: true })
              .limit(0);
              
            if (analysesError) {
              results.tables.financial_analyses = false;
              results.tables.financial_analyses_error = analysesError.message;
            } else {
              results.tables.financial_analyses = true;
              results.tables.financial_analyses_count = analysesCount;
            }
            
            // If both tables exist, try a test insertion with demo user
            if (results.tables.financial_data && results.tables.financial_analyses) {
              results.test_insert.attempted = true;
              
              // Using demo user for test
              const testUserId = 'demo-user-123';
              
              // Test data
              const testData = {
                user_id: testUserId,
                financial_data: {
                  monthlyIncome: 5000,
                  monthlyExpenses: 3000,
                  savings: 10000,
                  investments: 20000,
                  debt: 15000
                },
                created_at: new Date().toISOString()
              };
              
              try {
                const { data: insertData, error: insertError } = await dbClient
                  .from('financial_data')
                  .insert([testData])
                  .select();
                  
                if (insertError) {
                  results.test_insert.success = false;
                  results.test_insert.error = insertError.message;
                } else {
                  results.test_insert.success = true;
                  results.test_insert.data = insertData;
                  
                  // Delete the test data we just inserted
                  if (insertData && insertData.length > 0) {
                    const { error: deleteError } = await dbClient
                      .from('financial_data')
                      .delete()
                      .eq('id', insertData[0].id);
                      
                    results.test_insert.cleanup = !deleteError;
                  }
                }
              } catch (insertCatchError: any) {
                results.test_insert.success = false;
                results.test_insert.error = insertCatchError.message;
              }
            }
          } catch (tableCheckError: any) {
            results.tableCheckError = tableCheckError.message;
          }
        }
      } catch (connectionError: any) {
        results.connectionError = connectionError.message;
      }
    }
    
    // Add timestamp
    results.timestamp = new Date().toISOString();
    
    // Add helpful suggestions based on results
    results.suggestions = [];
    
    if (!envCheck.NEXT_PUBLIC_SUPABASE_URL || !envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      results.suggestions.push('Add Supabase URL and anonymous key to your environment variables.');
    }
    
    if (!results.clientAvailable) {
      results.suggestions.push('Check that Supabase client is properly initialized.');
    }
    
    if (!results.databaseConnection) {
      results.suggestions.push('Verify that your Supabase credentials are correct and the service is running.');
    }
    
    if (!results.tables.financial_data || !results.tables.financial_analyses) {
      results.suggestions.push('Run the database setup script to create the required tables.');
    }
    
    if (results.test_insert.attempted && !results.test_insert.success) {
      if (results.test_insert.error && results.test_insert.error.includes('permission denied')) {
        results.suggestions.push('Check the RLS (Row Level Security) policies for your tables.');
      } else {
        results.suggestions.push('Review the insert error for specific database issues.');
      }
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in db-test API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
} 