import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  setCorsHeaders,
  handleCorsPrelight,
  sendMethodNotAllowed,
} from '@/lib/api-utils';

/**
 * API endpoint to test database connection and table setup
 * This is useful for debugging database configuration issues
 *
 * Note: This endpoint should be disabled or protected in production
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Block in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DB_TEST) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Set CORS headers
  setCorsHeaders(req, res);

  // Handle preflight
  if (handleCorsPrelight(req, res)) {
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(res, ['GET']);
  }

  try {
    // Check environment variables (don't expose actual values)
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    };

    // Determine which client to use
    const dbClient = supabaseAdmin || supabase;
    const clientType = supabaseAdmin ? 'admin' : 'anonymous';

    // Test results object
    const results: Record<string, unknown> = {
      env: envCheck,
      clientAvailable: !!dbClient,
      clientType,
      databaseConnection: false,
      tables: {
        financial_data: false,
        financial_analyses: false,
      },
    };

    // If we have a client, test the connection
    if (dbClient) {
      try {
        // Check if tables exist
        const { count: dataCount, error: dataError } = await dbClient
          .from('financial_data')
          .select('*', { count: 'exact', head: true })
          .limit(0);

        if (dataError) {
          (results.tables as Record<string, unknown>).financial_data = false;
          (results.tables as Record<string, unknown>).financial_data_error = dataError.message;
        } else {
          results.databaseConnection = true;
          (results.tables as Record<string, unknown>).financial_data = true;
          (results.tables as Record<string, unknown>).financial_data_count = dataCount;
        }

        // Check financial_analyses
        const { count: analysesCount, error: analysesError } = await dbClient
          .from('financial_analyses')
          .select('*', { count: 'exact', head: true })
          .limit(0);

        if (analysesError) {
          (results.tables as Record<string, unknown>).financial_analyses = false;
          (results.tables as Record<string, unknown>).financial_analyses_error = analysesError.message;
        } else {
          (results.tables as Record<string, unknown>).financial_analyses = true;
          (results.tables as Record<string, unknown>).financial_analyses_count = analysesCount;
        }
      } catch (connectionError) {
        results.connectionError = connectionError instanceof Error ? connectionError.message : 'Unknown error';
      }
    }

    // Add timestamp
    results.timestamp = new Date().toISOString();

    // Add helpful suggestions based on results
    const suggestions: string[] = [];

    if (!envCheck.NEXT_PUBLIC_SUPABASE_URL || !envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      suggestions.push('Add Supabase URL and anonymous key to your environment variables.');
    }

    if (!results.clientAvailable) {
      suggestions.push('Check that Supabase client is properly initialized.');
    }

    if (!results.databaseConnection) {
      suggestions.push('Verify that your Supabase credentials are correct and the service is running.');
    }

    const tables = results.tables as Record<string, unknown>;
    if (!tables.financial_data || !tables.financial_analyses) {
      suggestions.push('Run the database setup script to create the required tables.');
    }

    results.suggestions = suggestions;

    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in db-test API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
