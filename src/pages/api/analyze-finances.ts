import { NextApiRequest, NextApiResponse } from 'next';
import { FinancialAnalysisAgent, FinancialData, AnalysisResults } from '@/lib/financial-analysis-agent';
import supabase, { supabaseAdmin } from '@/lib/supabase';

// Data validation
const validateFinancialData = (data: any): data is FinancialData => {
  return (
    typeof data === 'object' &&
    typeof data.monthlyIncome === 'number' &&
    typeof data.monthlyExpenses === 'number' &&
    typeof data.savings === 'number' &&
    typeof data.investments === 'number' &&
    typeof data.debt === 'number'
  );
};

// Calculate metrics locally as a fallback
const calculateLocalMetrics = (data: FinancialData): AnalysisResults => {
  const monthlySavings = data.monthlyIncome - data.monthlyExpenses;
  const savingsRate = data.monthlyIncome > 0 ? (monthlySavings / data.monthlyIncome) * 100 : 0;
  const netWorth = data.savings + data.investments - data.debt;
  const emergencyFundMonths = data.monthlyExpenses > 0 ? data.savings / data.monthlyExpenses : 0;
  const debtToIncomeRatio = data.monthlyIncome > 0 ? (data.debt / (data.monthlyIncome * 12)) * 100 : 0;
  
  return {
    metrics: {
      savingsRate,
      netWorth,
      emergencyFundMonths,
      debtToIncomeRatio,
      monthlySavings
    },
    insights: [
      {
        type: "savings_rate",
        severity: savingsRate >= 20 ? "positive" : savingsRate >= 10 ? "warning" : "critical",
        message: `Your savings rate is ${savingsRate.toFixed(1)}%`,
        recommendation: savingsRate < 20 ? "Aim to save at least 20% of your income" : "Keep up the good work!"
      },
      {
        type: "emergency_fund",
        severity: emergencyFundMonths >= 6 ? "positive" : emergencyFundMonths >= 3 ? "warning" : "critical",
        message: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses`,
        recommendation: emergencyFundMonths < 6 ? "Build an emergency fund covering 3-6 months of expenses" : "Consider investing excess emergency savings"
      },
      {
        type: "debt_ratio",
        severity: debtToIncomeRatio <= 36 ? "positive" : debtToIncomeRatio <= 43 ? "warning" : "critical",
        message: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%`,
        recommendation: debtToIncomeRatio > 36 ? "Reduce your debt load to improve financial flexibility" : "Your debt level is manageable"
      },
      {
        type: "net_worth",
        severity: netWorth > 0 ? "positive" : "critical",
        message: `Your net worth is ${netWorth >= 0 ? '$' + netWorth.toFixed(0) : '-$' + Math.abs(netWorth).toFixed(0)}`,
        recommendation: netWorth < 0 ? "Focus on paying down debts to achieve a positive net worth" : "Continue building assets to increase your net worth"
      }
    ]
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for development
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Analyze finances API called');
  
  try {
    // Using a demo user ID for now - in production, use authenticated user
    const userId = 'demo-user-123'; // Replace with user.id in production

    // Get financial data from request body
    const financialData = req.body;
    console.log('Received financial data:', financialData);

    // Validate data
    if (!validateFinancialData(financialData)) {
      console.error('Invalid financial data format:', financialData);
      return res.status(400).json({ error: 'Invalid financial data format' });
    }

    // Choose the appropriate client - use admin client if available, otherwise fallback to regular client
    const dbClient = supabaseAdmin || supabase;
    
    // Save financial data to Supabase
    let dataSaved = false;
    try {
      // Output the client being used for debugging
      console.log('Using database client:', dbClient ? (supabaseAdmin ? 'admin client' : 'regular client') : 'no client available');
      
      // Check if Supabase URL and key are configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase environment variables not configured properly.');
        console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        throw new Error('Database configuration missing');
      }
      
      if (!dbClient) {
        console.error('No database client available');
        throw new Error('Database connection not available');
      }
      
      // First, check if the table exists before attempting to insert
      try {
        // Supabase doesn't have a direct "table exists" query, but we can try to select from it
        const { count, error: checkError } = await dbClient
          .from('financial_data')
          .select('*', { count: 'exact', head: true })
          .limit(0);
          
        if (checkError) {
          console.error('Table check error - table may not exist:', checkError);
          throw new Error(`Table check failed: ${checkError.message}`);
        }
        
        console.log('Table check successful, count:', count);
      } catch (tableCheckError) {
        console.error('Error checking if table exists:', tableCheckError);
        throw new Error('Database table does not exist or is not accessible');
      }
      
      // Now attempt the insert
      const { data, error: saveError } = await dbClient
        .from('financial_data')
        .insert([{
          user_id: userId,
          financial_data: financialData,
          created_at: new Date().toISOString()
        }]);

      if (saveError) {
        console.error('Error saving financial data:', saveError);
        
        // Check policy issues - might be RLS related
        if (saveError.message && saveError.message.includes('permission denied')) {
          console.error('Permission denied error - likely RLS policy issue');
          console.log('Attempting with demo user ID:', userId);
        }
        
        throw new Error(`Failed to save data: ${saveError.message}`);
      } else {
        console.log('Financial data saved successfully', data);
        dataSaved = true;
      }
    } catch (dbError) {
      console.error('Database error saving financial data:', dbError);
      // Continue with analysis even if data saving fails
    }

    let analysisResults: AnalysisResults;
    
    try {
      // Try to get analysis from AI agent
      const analysisAgent = new FinancialAnalysisAgent();
      
      // The analyze method now accepts FinancialData directly
      analysisResults = await analysisAgent.analyze(financialData);
      console.log('AI analysis successfully generated');
      
      // Try to save analysis results if we have a client
      if (dbClient) {
        try {
          const { error: analysisError } = await dbClient
            .from('financial_analyses')
            .insert([{
              user_id: userId,
              analysis_data: analysisResults
            }]);
  
          if (analysisError) {
            console.error('Error saving analysis:', analysisError);
          } else {
            console.log('Analysis saved successfully');
          }
        } catch (analysisDbError) {
          console.error('Database error saving analysis:', analysisDbError);
        }
      }
    } catch (aiError) {
      console.error('Error generating AI analysis:', aiError);
      // Add more detailed error logging
      console.warn({
        message: 'API Fallback: Using local calculations',
        error: aiError instanceof Error ? aiError.message : String(aiError),
        timestamp: new Date().toISOString(),
        financialDataId: userId // for debugging/tracing
      });
      
      // Fallback to local calculations
      analysisResults = calculateLocalMetrics(financialData);
      console.log('Using local calculations instead of AI');
    }

    // Include data saving status in the response
    return res.status(200).json({
      ...analysisResults,
      _meta: {
        dataSaved,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in analyze-finances API:', error);
    
    // If an error occurs, return local calculations as fallback
    try {
      const financialData = req.body;
      if (validateFinancialData(financialData)) {
        const fallbackResults = calculateLocalMetrics(financialData);
        return res.status(200).json({
          ...fallbackResults,
          _note: 'Using local calculations due to server error',
          _error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    } catch (fallbackError) {
      console.error('Error generating fallback analysis:', fallbackError);
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
} 