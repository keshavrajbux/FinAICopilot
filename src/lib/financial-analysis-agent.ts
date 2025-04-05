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
      // Try to use OpenAI first (reversed from original implementation)
      if (originalData) {
        console.log('Attempting to analyze with OpenAI first...');
        try {
          return await analyzeWithOpenAI(originalData);
        } catch (openaiError) {
          console.error('OpenAI analysis failed:', openaiError);
          
          // If OpenAI fails, try Claude as fallback
          console.log('Falling back to Claude for analysis...');
          try {
            // Call the parent's analyze method with the properly formatted messages
            return await super.analyze(messages);
          } catch (claudeError) {
            console.error('Claude analysis failed:', claudeError);
            // If both OpenAI and Claude fail, use local calculations
            console.log('Using local calculations as final fallback...');
            return this.calculateLocalMetrics(originalData);
          }
        }
      } else {
        // If we only have messages (not the original data), try with Claude
        try {
          return await super.analyze(messages);
        } catch (error) {
          console.error('Claude analysis failed:', error);
          throw error;
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
          message: savingsRate >= 20 
            ? `Impressive! You're saving ${savingsRate.toFixed(1)}% of your income` 
            : savingsRate >= 10 
              ? `You're saving ${savingsRate.toFixed(1)}% of your income, which is a good start` 
              : `Your savings rate of ${savingsRate.toFixed(1)}% puts your financial future at risk`,
          recommendation: savingsRate < 20 
            ? "Financial experts recommend saving at least 20% of your income. Try cutting back on non-essential expenses like dining out or subscription services you rarely use." 
            : "You're on the right track! Consider setting up automatic transfers to investment accounts to put your savings to work."
        },
        {
          type: "emergency_fund",
          severity: emergencyFundMonths >= 6 ? "positive" : emergencyFundMonths >= 3 ? "warning" : "critical",
          message: emergencyFundMonths >= 6 
            ? `Peace of mind! Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months of expenses` 
            : emergencyFundMonths >= 3 
              ? `Your emergency fund would last ${emergencyFundMonths.toFixed(1)} months - you're halfway there` 
              : `Your emergency fund would only last ${emergencyFundMonths.toFixed(1)} months, leaving you vulnerable to financial shocks`,
          recommendation: emergencyFundMonths < 6 
            ? "Aim to save enough to cover 3-6 months of essential expenses. Start small by setting aside a portion of each paycheck until you reach this goal." 
            : "Well done! Your emergency fund is well-established. Keep it in a high-yield savings account for easy access while still earning interest."
        },
        {
          type: "debt_ratio",
          severity: debtToIncomeRatio <= 36 ? "positive" : debtToIncomeRatio <= 43 ? "warning" : "critical",
          message: debtToIncomeRatio <= 36 
            ? `Excellent! Your debt-to-income ratio is a healthy ${debtToIncomeRatio.toFixed(1)}%` 
            : debtToIncomeRatio <= 43 
              ? `Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}% is approaching concerning levels` 
              : `Warning: Your debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}% is critically high`,
          recommendation: debtToIncomeRatio > 36 
            ? "Focus on paying down high-interest debt first. Consider the snowball method (smallest balances first) or avalanche method (highest interest first) to reduce your debt burden." 
            : "Your debt is at a manageable level. Consider setting up extra payments toward principal to reduce interest costs over time."
        },
        {
          type: "net_worth",
          severity: netWorth > data.monthlyIncome * 12 ? "positive" : netWorth > 0 ? "warning" : "critical",
          message: netWorth > data.monthlyIncome * 12 
            ? `Congratulations! Your net worth of $${netWorth.toLocaleString()} exceeds your annual income` 
            : netWorth > 0 
              ? `Your net worth is $${netWorth.toLocaleString()} - positive, but there's room for growth` 
              : `Your net worth is negative at -$${Math.abs(netWorth).toLocaleString()}, which means you owe more than you own`,
          recommendation: netWorth < 0 
            ? "Your financial priority should be shifting to positive net worth. Create a debt reduction plan, avoid taking on more debt, and focus on increasing your income." 
            : netWorth < data.monthlyIncome * 12 
              ? "Build wealth by increasing your savings rate and investment contributions. Even small, consistent contributions can grow significantly over time." 
              : "You're building wealth effectively! Consider diversifying your investments and exploring tax-advantaged accounts to protect and grow your assets."
        },
        {
          type: "investments",
          severity: investmentToNetWorthRatio >= 40 ? "positive" : investmentToNetWorthRatio >= 20 ? "warning" : "critical",
          message: investmentToNetWorthRatio >= 40 
            ? `Smart move! ${investmentToNetWorthRatio.toFixed(1)}% of your net worth is invested for growth` 
            : investmentToNetWorthRatio >= 20 
              ? `${investmentToNetWorthRatio.toFixed(1)}% of your net worth is invested, which is a decent start` 
              : `Only ${investmentToNetWorthRatio.toFixed(1)}% of your net worth is invested, limiting your future financial growth`,
          recommendation: investmentToNetWorthRatio < 40 
            ? "Consider increasing your investment allocation. Look into low-cost index funds or ETFs for long-term growth with minimal management required." 
            : "Your investment allocation looks good! Make sure your portfolio is properly diversified across different asset classes to manage risk."
        }
      ]
    };
  }
} 