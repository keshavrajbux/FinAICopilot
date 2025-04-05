import { FinancialData, AnalysisResults } from './financial-analysis-agent';

// Check if OpenAI API key is available
const hasOpenAIKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== '';

/**
 * Analyzes financial data using OpenAI
 */
export async function analyzeWithOpenAI(financialData: FinancialData): Promise<AnalysisResults> {
  if (!hasOpenAIKey) {
    console.log('No OpenAI API key provided, returning mock data');
    return getMockAnalysisResponse(financialData);
  }

  try {
    console.log('Analyzing financial data with OpenAI');
    
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
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analysis assistant that provides detailed insights and recommendations based on financial data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API request failed: ${response.status}`, errorText);
      throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices.length) {
      console.error('Invalid response structure from OpenAI:', data);
      throw new Error('Invalid response from OpenAI - missing choices');
    }
    
    const result = data.choices[0]?.message?.content;

    if (!result) {
      console.error('Invalid response from OpenAI - missing content');
      throw new Error('Invalid response from OpenAI - missing content');
    }

    try {
      // Parse JSON response
      const analysisResults = JSON.parse(result);
      return analysisResults;
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.log('Raw response:', result);
      throw new Error('Failed to parse OpenAI response as JSON');
    }
  } catch (error) {
    console.error('Error using OpenAI for analysis:', error);
    return getMockAnalysisResponse(financialData);
  }
}

/**
 * Generates realistic analysis results based on the provided financial data
 */
function getMockAnalysisResponse(data: FinancialData): AnalysisResults {
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
} 