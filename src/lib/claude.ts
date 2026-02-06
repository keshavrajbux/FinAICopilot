/**
 * Backward-compatibility re-export
 *
 * The canonical locations are now:
 *   - Core provider: @/lib/core/providers/claude-provider
 *   - Core base agent: @/lib/core/agents/base-agent
 *
 * This file bridges the old API shape to the new layered architecture.
 */

import { callClaude } from './core/providers/claude-provider';
import { AnalysisResults } from './product/analysis/calculations';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * @deprecated Use callClaude from @/lib/core instead
 */
export async function generateClaudeResponse(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  const result = await callClaude(messages, systemPrompt);
  return result.text;
}

/**
 * @deprecated Use BaseAgent from @/lib/core instead
 * Legacy BaseAgent that returns AnalysisResults (finance-specific).
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
