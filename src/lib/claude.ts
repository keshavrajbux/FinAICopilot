import { Anthropic } from '@anthropic-ai/sdk';

// Ensure API key is provided
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is missing. Please add it to your environment variables.');
}

// Initialize the Claude client
const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Claude model to use
const MODEL = 'claude-3-opus-20240229';

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
    const response = await claude.messages.create({
      model: MODEL,
      system: systemPrompt,
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error('Failed to process financial analysis');
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
      return JSON.parse(response);
    } catch (error) {
      console.error('Error in analysis:', error);
      throw new Error('Failed to analyze financial data');
    }
  }
} 