import { BaseAgent, Message } from './claude';

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
}

For severity ratings:
- "positive" = Good financial indicator
- "warning" = Issue that needs attention
- "critical" = Serious problem requiring immediate action

Possible insight types: "savings_rate", "emergency_fund", "debt_ratio", "net_worth"

Make calculations based on these formulas:
- Monthly Savings = Income - Expenses
- Savings Rate = (Monthly Savings / Income) * 100
- Net Worth = Savings + Investments - Debt
- Emergency Fund Months = Savings / Monthly Expenses
- Debt-to-Income Ratio = (Debt / (Income * 12)) * 100

Your analysis should be accurate, helpful, and actionable.`;

    super(systemPrompt);
  }

  /**
   * Analyze financial data and generate insights
   * @param financialData User's financial data
   * @returns Analysis results including metrics and insights
   */
  async analyzeFinancialData(financialData: FinancialData): Promise<AnalysisResults> {
    // Prepare the message with the financial data
    const message: Message = {
      role: 'user',
      content: `Please analyze my financial situation with the following data:
- Monthly Income: $${financialData.monthlyIncome}
- Monthly Expenses: $${financialData.monthlyExpenses}
- Savings: $${financialData.savings}
- Investments: $${financialData.investments}
- Total Debt: $${financialData.debt}

Provide me with an analysis of my financial health, including key metrics and personalized recommendations.`
    };

    // Get analysis from Claude
    return await this.analyze([message]);
  }
} 