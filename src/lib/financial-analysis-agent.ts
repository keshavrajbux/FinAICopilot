import { BaseAgent, Message } from './claude';
import { analyzeWithOpenAI } from './openai';
import {
  FinancialData,
  AnalysisResults,
  calculateAnalysis,
} from './calculations';

// Re-export types for backward compatibility
export type { FinancialData, AnalysisResults } from './calculations';

/**
 * Specialized agent for financial data analysis
 *
 * Uses a tiered approach:
 * 1. Try OpenAI (primary, cost-effective)
 * 2. Fall back to Claude (secondary)
 * 3. Fall back to local calculations (always works)
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

  /**
   * Analyze financial data using AI with fallback to local calculations
   */
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

    // If we have original data, try the tiered approach
    if (originalData) {
      // Try OpenAI first (primary)
      try {
        return await analyzeWithOpenAI(originalData);
      } catch (openaiError) {
        console.error('OpenAI analysis failed:', openaiError);

        // Try Claude as fallback
        try {
          return await super.analyze(messages);
        } catch (claudeError) {
          console.error('Claude analysis failed:', claudeError);

          // Use local calculations as final fallback
          return calculateAnalysis(originalData);
        }
      }
    }

    // If we only have messages (legacy path), try Claude
    try {
      return await super.analyze(messages);
    } catch (error) {
      console.error('Claude analysis failed:', error);
      throw error;
    }
  }
}
