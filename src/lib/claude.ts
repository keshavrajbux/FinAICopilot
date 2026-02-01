import { AnalysisResults } from './calculations';

// Claude model to use
const MODEL = 'claude-3-haiku-20240307';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Response types
interface ClaudeTextBlock {
  type: 'text';
  text: string;
}

interface ClaudeResponse {
  content: ClaudeTextBlock[];
}

/**
 * Generates a response from Claude based on the provided messages
 */
export async function generateClaudeResponse(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: MODEL,
        system: systemPrompt,
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API Error [${response.status}]:`, errorText);
      throw new Error(`Claude API Error: ${response.status}`);
    }

    const data: ClaudeResponse = await response.json();

    const textContent = data.content.find(
      (block): block is ClaudeTextBlock => block.type === 'text'
    );

    if (!textContent) {
      throw new Error('No text content in Claude response');
    }

    return textContent.text;
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Claude API request timed out');
    }

    throw error;
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

  async analyze(messages: Message[]): Promise<AnalysisResults> {
    const response = await generateClaudeResponse(messages, this.systemPrompt);

    try {
      return JSON.parse(response) as AnalysisResults;
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', parseError);
      throw new Error('Failed to parse Claude response');
    }
  }
}
