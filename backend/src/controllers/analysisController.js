const AgentOrchestrator = require('../agents/AgentOrchestrator');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const orchestrator = new AgentOrchestrator();

class AnalysisController {
  async analyzeFinancialHealth(req, res) {
    try {
      const { userId } = req.params;
      const { transactions, portfolio, marketData, userContext } = req.body;

      // Validate required data
      if (!transactions || !userContext) {
        return res.status(400).json({
          error: 'Missing required data',
          message: 'Transactions and user context are required'
        });
      }

      // Get analysis from orchestrator
      const analysis = await orchestrator.analyzeFinancialHealth(userId, {
        transactions,
        portfolio,
        marketData,
        userContext
      });

      // Store analysis in Supabase
      const { data, error } = await supabase
        .from('financial_analyses')
        .insert([{
          user_id: userId,
          analysis_data: analysis,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error storing analysis:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to store analysis results'
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Error in financial health analysis:', error);
      res.status(500).json({
        error: 'Analysis error',
        message: 'Failed to complete financial analysis'
      });
    }
  }

  async getAnalysisHistory(req, res) {
    try {
      const { userId } = req.params;
      const { limit = 10 } = req.query;

      const { data, error } = await supabase
        .from('financial_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        console.error('Error fetching analysis history:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch analysis history'
        });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch analysis history'
      });
    }
  }

  async getLatestAnalysis(req, res) {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('financial_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest analysis:', error);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to fetch latest analysis'
        });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching latest analysis:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Failed to fetch latest analysis'
      });
    }
  }
}

module.exports = new AnalysisController(); 