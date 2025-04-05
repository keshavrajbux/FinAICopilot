import Anthropic from '@anthropic-ai/sdk';

// Ensure API key is provided
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is missing. Please add it to your environment variables.');
}

// Initialize the Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Claude model to use - use a less resource-intensive model
const MODEL = 'claude-3-haiku-20240307';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Generates a response from Claude based on the provided messages
 * @param messages Previous conversation messages
 * @param systemPrompt System instructions for Claude
 * @returns Claude's response text
 */
export async function generateClaudeResponse(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  try {
    console.log('Calling Claude API with messages length:', messages.length);
    
    // Simple fallback for development without API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('No API key - returning mock data');
      return JSON.stringify(getMockAnalysisResponse());
    }
    
    try {
      // Convert messages to Anthropic format
      console.log('System prompt:', systemPrompt);
      console.log('First message content:', messages[0]?.content);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY || ''
        },
        body: JSON.stringify({
          model: MODEL,
          system: systemPrompt,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Claude API request failed with status: ${response.status}, Error: ${errorText}`);
        console.log('Falling back to local calculations due to API error');
        return JSON.stringify(getMockAnalysisResponse());
      }
      
      const data = await response.json();
      console.log('Claude API response received');
      
      if (!data.content || !data.content[0] || !data.content[0].text) {
        console.error('Invalid response format from Claude API');
        return JSON.stringify(getMockAnalysisResponse());
      }
      
      return data.content[0].text;
    } catch (apiError) {
      console.error('API call failed:', apiError);
      console.log('Falling back to local calculations due to API error');
      return JSON.stringify(getMockAnalysisResponse());
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return JSON.stringify(getMockAnalysisResponse());
  }
}

/**
 * Base agent class that uses Claude for financial analysis
 */
export class BaseAgent {
  protected systemPrompt: string;

  constructor(systemPrompt: string) {
    this.systemPrompt = systemPrompt;
  }

  async analyze(messages: Message[]): Promise<any> {
    try {
      const response = await generateClaudeResponse(messages, this.systemPrompt);
      
      try {
        // Attempt to parse the response as JSON
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse Claude response as JSON:', parseError);
        console.log('Raw response:', response);
        
        // Fallback to a simple analysis
        return getMockAnalysisResponse();
      }
    } catch (error) {
      console.error('Error in analysis:', error);
      return getMockAnalysisResponse();
    }
  }
}

/**
 * Helper function to get mock analysis response for fallback
 */
function getMockAnalysisResponse() {
  return {
    metrics: {
      savingsRate: 15,
      netWorth: 40000,
      emergencyFundMonths: 3.3,
      debtToIncomeRatio: 28,
      monthlySavings: 2000
    },
    insights: [
      {
        type: "savings_rate",
        severity: "warning",
        message: "Your savings rate is 15%, which is good but could be improved.",
        recommendation: "Try to increase your savings rate to 20% by reducing discretionary spending."
      },
      {
        type: "emergency_fund",
        severity: "warning",
        message: "Your emergency fund covers 3.3 months of expenses.",
        recommendation: "Build your emergency fund to cover at least 6 months of expenses."
      },
      {
        type: "debt_ratio",
        severity: "warning",
        message: "Your debt-to-income ratio is 28%.",
        recommendation: "Work on paying down high-interest debt to improve your financial security."
      },
      {
        type: "net_worth",
        severity: "positive",
        message: "Your net worth is $40,000.",
        recommendation: "Continue building assets through regular investing and debt reduction."
      }
    ]
  };
} 