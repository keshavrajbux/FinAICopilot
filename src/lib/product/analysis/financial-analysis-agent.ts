/**
 * Financial Analysis Agent
 *
 * A domain-specific agent that extends the core BaseAgent framework
 * to provide AI-powered financial analysis.
 *
 * Part of the PRODUCT layer -- this is where fintech meets the orchestrator.
 *
 * Fallback strategy:
 *   1. OpenAI (primary, cost-effective)
 *   2. Claude (secondary, more capable)
 *   3. Local deterministic calculations (always works)
 */

import { BaseAgent, callOpenAI, Message } from '@/lib/core';
import {
  FinancialData,
  AnalysisResults,
  calculateAnalysis,
} from './calculations';

// Re-export for consumers
export type { FinancialData, AnalysisResults } from './calculations';

const FINANCIAL_SYSTEM_PROMPT = `You are a Financial Analysis Agent that analyzes user financial data and provides insights.

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

function buildFinancialPrompt(data: FinancialData): string {
  return `Please analyze my financial situation with the following data:
Monthly Income: $${data.monthlyIncome}
Monthly Expenses: $${data.monthlyExpenses}
Savings: $${data.savings}
Investments: $${data.investments}
Total Debt: $${data.debt}

Calculate these metrics:
- Monthly Savings = Income - Expenses
- Savings Rate = (Monthly Savings / Income) * 100
- Net Worth = Savings + Investments - Debt
- Emergency Fund Months = Savings / Monthly Expenses
- Debt-to-Income Ratio = (Debt / (Income * 12)) * 100

Provide me with an analysis of my financial health with personalized recommendations.`;
}

export class FinancialAnalysisAgent extends BaseAgent<AnalysisResults> {
  constructor() {
    super(FINANCIAL_SYSTEM_PROMPT);
  }

  protected parseResponse(text: string): AnalysisResults {
    try {
      return JSON.parse(text) as AnalysisResults;
    } catch {
      throw new Error('Failed to parse AI response as financial analysis JSON');
    }
  }

  /**
   * Analyze financial data using AI with tiered fallback.
   */
  async analyze(data: FinancialData): Promise<AnalysisResults>;
  async analyze(messages: Message[]): Promise<AnalysisResults>;
  async analyze(input: FinancialData | Message[]): Promise<AnalysisResults> {
    // Legacy path: raw messages
    if (Array.isArray(input)) {
      const result = await this.run(input);
      return result.data;
    }

    const data = input;

    // Use the core framework's fallback orchestration
    const result = await this.runWithFallback({
      strategies: [
        {
          name: 'openai',
          execute: () => this.analyzeWithOpenAI(data),
        },
        {
          name: 'claude',
          execute: async () => {
            const messages: Message[] = [{
              role: 'user',
              content: buildFinancialPrompt(data),
            }];
            const agentResult = await this.run(messages);
            return agentResult.data;
          },
        },
      ],
      finalFallback: () => calculateAnalysis(data),
    });

    return result.data;
  }

  /**
   * OpenAI-specific financial analysis with structured output.
   */
  private async analyzeWithOpenAI(data: FinancialData): Promise<AnalysisResults> {
    const prompt = `
Please analyze this financial data and provide insights:
- Monthly Income: $${data.monthlyIncome}
- Monthly Expenses: $${data.monthlyExpenses}
- Savings: $${data.savings}
- Investments: $${data.investments}
- Total Debt: $${data.debt}

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

    return this.parseResponse(result.text);
  }
}
