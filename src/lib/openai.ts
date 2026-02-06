/**
 * Backward-compatibility re-export
 *
 * The canonical locations are now:
 *   - Core provider: @/lib/core/providers/openai-provider
 *   - Financial analysis: @/lib/product/analysis/financial-analysis-agent
 *
 * This file preserves the old API for existing consumers.
 */

import { callOpenAI } from './core/providers/openai-provider';
import { FinancialData, AnalysisResults, calculateAnalysis } from './product/analysis/calculations';

export { type FinancialData, type AnalysisResults } from './product/analysis/calculations';

/**
 * @deprecated Use FinancialAnalysisAgent from @/lib/product instead
 */
export async function analyzeWithOpenAI(financialData: FinancialData): Promise<AnalysisResults> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('No OpenAI API key provided, using local calculations');
    return calculateAnalysis(financialData);
  }

  try {
    const prompt = `
Please analyze this financial data and provide insights:
- Monthly Income: $${financialData.monthlyIncome}
- Monthly Expenses: $${financialData.monthlyExpenses}
- Savings: $${financialData.savings}
- Investments: $${financialData.investments}
- Total Debt: $${financialData.debt}

Calculate these metrics:
- Monthly Savings = Income - Expenses
- Savings Rate = (Monthly Savings / Income) * 100
- Net Worth = Savings + Investments - Debt
- Emergency Fund Months = Savings / Monthly Expenses
- Debt-to-Income Ratio = (Debt / (Income * 12)) * 100

Format your response as a JSON object with the following schema:
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

    const result = await callOpenAI(
      [
        {
          role: 'system',
          content: 'You are a financial analysis assistant that provides detailed insights and recommendations based on financial data.',
        },
        { role: 'user', content: prompt },
      ],
      { jsonMode: true }
    );

    return JSON.parse(result.text) as AnalysisResults;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('OpenAI request timed out');
    } else {
      console.error('Error using OpenAI for analysis:', error);
    }

    return calculateAnalysis(financialData);
  }
}
