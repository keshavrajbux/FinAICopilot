import { NextApiRequest, NextApiResponse } from 'next';
import { createRouteHandler } from '@supabase/auth-helpers-nextjs';
import { FinancialAnalysisAgent, FinancialData } from '@/lib/financial-analysis-agent';
import supabase from '@/lib/supabase';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for valid user session
    // const { user } = await supabase.auth.getUser();
    // Using a demo user ID for now - in production, use authenticated user
    const userId = 'demo-user-123'; // Replace with user.id in production

    // Get financial data from request body
    const financialData = req.body;

    // Validate data
    if (!validateFinancialData(financialData)) {
      return res.status(400).json({ error: 'Invalid financial data' });
    }

    // Create the financial analysis agent and get analysis
    const agent = new FinancialAnalysisAgent();
    const analysisResults = await agent.analyzeFinancialData(financialData);

    // Store financial data in Supabase
    const { error: dataError } = await supabase
      .from('financial_data')
      .insert([{
        user_id: userId,
        financial_data: financialData,
        created_at: new Date().toISOString()
      }]);

    if (dataError) {
      console.error('Error storing financial data:', dataError);
    }

    // Store analysis results in Supabase
    const { error: analysisError } = await supabase
      .from('financial_analyses')
      .insert([{
        user_id: userId,
        analysis_data: analysisResults,
        created_at: new Date().toISOString()
      }]);

    if (analysisError) {
      console.error('Error storing analysis:', analysisError);
    }

    // Return the analysis results
    return res.status(200).json(analysisResults);
  } catch (error) {
    console.error('Error in financial analysis:', error);
    return res.status(500).json({ error: 'Failed to analyze financial data' });
  }
} 