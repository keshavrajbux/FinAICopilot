import { BaseAgent, Message } from './claude';
import { analyzeWithOpenAI } from './openai';

/**
 * Financial data input schema
 */
export interface FinancialData {
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  investments: number;
  debt: number;
}

/**
 * Analysis results schema
 */
export interface AnalysisResults {
  metrics: {
    savingsRate: number;
    netWorth: number;
    emergencyFundMonths: number;
    debtToIncomeRatio: number;
    monthlySavings: number;
  };
  insights: Array<{
    type: string;
    severity: 'positive' | 'warning' | 'critical';
    message: string;
    recommendation: string;
  }>;
}

/**
 * Specialized agent for financial data analysis
 */
export class FinancialAnalysisAgent extends BaseAgent {
  constructor() {
    const systemPrompt = `You are a Financial Analysis Agent that analyzes user financial data and provides insights.

Your task is to analyze financial data and generate the following:
1. Key financial metrics
2. Insights about the user's financial health
3. Recommendations for improvement

Always respond with valid JSON matching this schema:
{
  "metrics": {
    "savingsRate": number,
    "netWorth": number,
    "emergencyFundMonths": number,
    "debtToIncomeRatio": number,
    "monthlySavings": number
  },
  "insights": [
    {
      "type": string,
      "severity": "positive" | "warning" | "critical",
      "message": string,
      "recommendation": string
    }
  ]
}`;
    super(systemPrompt);
  }

  // Override the base analyze method to maintain compatibility
  async analyze(messages: Message[]): Promise<AnalysisResults>;
  async analyze(data: FinancialData): Promise<AnalysisResults>;
  async analyze(input: Message[] | FinancialData): Promise<AnalysisResults> {
    let messages: Message[];
    let originalData: FinancialData | null = null;
    
    // Check if input is FinancialData or Message[]
    if (Array.isArray(input)) {
      messages = input;
    } else {
      originalData = input;
      // Convert FinancialData to Message[]
      messages = [{
        role: 'user',
        content: `Please analyze my financial situation with the following data:
Monthly Income: $${input.monthlyIncome}
Monthly Expenses: $${input.monthlyExpenses}
Savings: $${input.savings}
Investments: $${input.investments}
Total Debt: $${input.debt}

Calculate these metrics:
- Monthly Savings = Income - Expenses
- Savings Rate = (Monthly Savings / Income) * 100
- Net Worth = Savings + Investments - Debt
- Emergency Fund Months = Savings / Monthly Expenses
- Debt-to-Income Ratio = (Debt / (Income * 12)) * 100

Provide me with an analysis of my financial health with personalized recommendations.`
      }];
    }

    try {
      // Try to use Claude first
      console.log('Attempting to analyze with Claude...');
      try {
        // Call the parent's analyze method with the properly formatted messages
        return await super.analyze(messages);
      } catch (claudeError) {
        console.error('Claude analysis failed:', claudeError);
        
        // If we have the original data and Claude fails, try OpenAI
        if (originalData) {
          console.log('Falling back to OpenAI for analysis...');
          try {
            return await analyzeWithOpenAI(originalData);
          } catch (openaiError) {
            console.error('OpenAI analysis failed:', openaiError);
            // If both Claude and OpenAI fail, use local calculations
            console.log('Using local calculations as final fallback...');
            return this.calculateLocalMetrics(originalData);
          }
        } else {
          // If we only have messages (not the original data), we can't use OpenAI
          // so we throw the original error
          throw claudeError;
        }
      }
    } catch (error) {
      console.error('Error in AI analysis:', error);
      // Fallback to local calculations if AI fails
      if (originalData) {
        return this.calculateLocalMetrics(originalData);
      }
      throw error;
    }
  }

  // Helper method to calculate metrics locally if needed
  calculateLocalMetrics(data: FinancialData): AnalysisResults {
    const monthlySavings = data.monthlyIncome - data.monthlyExpenses;
    const savingsRate = data.monthlyIncome > 0 ? (monthlySavings / data.monthlyIncome) * 100 : 0;
    const netWorth = data.savings + data.investments - data.debt;
    const emergencyFundMonths = data.monthlyExpenses > 0 ? data.savings / data.monthlyExpenses : 0;
    const debtToIncomeRatio = data.monthlyIncome > 0 ? (data.debt / (data.monthlyIncome * 12)) * 100 : 0;
    const investmentToNetWorthRatio = netWorth > 0 ? (data.investments / netWorth) * 100 : 0;
    
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
        },
        {
          type: "investments",
          severity: investmentToNetWorthRatio >= 40 ? "positive" : investmentToNetWorthRatio >= 20 ? "warning" : "critical",
          message: `Investments make up ${investmentToNetWorthRatio.toFixed(1)}% of your net worth`,
          recommendation: investmentToNetWorthRatio < 40 ? "Consider increasing your investment allocations for long-term growth" : "Your investment allocation looks good"
        }
      ]
    };
  }
} 