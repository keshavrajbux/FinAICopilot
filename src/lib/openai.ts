import { FinancialData, AnalysisResults, calculateAnalysis } from './calculations';

// Check if OpenAI API key is available
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

/**
 * Analyzes financial data using OpenAI GPT-3.5
 */
export async function analyzeWithOpenAI(financialData: FinancialData): Promise<AnalysisResults> {
  if (!hasOpenAIKey) {
    console.log('No OpenAI API key provided, using local calculations');
    return calculateAnalysis(financialData);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analysis assistant that provides detailed insights and recommendations based on financial data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API request failed: ${response.status}`, errorText);
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices?.length) {
      throw new Error('Invalid response from OpenAI - missing choices');
    }

    const result = data.choices[0]?.message?.content;

    if (!result) {
      throw new Error('Invalid response from OpenAI - missing content');
    }

    try {
      return JSON.parse(result) as AnalysisResults;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON');
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      console.error('OpenAI request timed out');
    } else {
      console.error('Error using OpenAI for analysis:', error);
    }

    // Fallback to local calculations
    return calculateAnalysis(financialData);
  }
}
