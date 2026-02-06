/**
 * Base Agent
 *
 * Generic agent class that orchestrates AI provider calls with fallback behavior.
 * Domain-agnostic: subclasses provide the domain-specific prompt and parsing logic.
 *
 * The type parameter T represents the structured output the agent produces.
 * For example, a financial agent might use T = AnalysisResults,
 * while a support agent might use T = SupportResponse.
 */

import { Message, FallbackConfig, AgentResult } from '../types';
import { callClaude } from '../providers/claude-provider';
import { callOpenAI } from '../providers/openai-provider';

export abstract class BaseAgent<T> {
  protected systemPrompt: string;

  constructor(systemPrompt: string) {
    this.systemPrompt = systemPrompt;
  }

  /**
   * Parse a raw text response from an AI provider into structured output.
   * Subclasses MUST implement this to define their output format.
   */
  protected abstract parseResponse(text: string): T;

  /**
   * Run the agent with the given messages using Claude as the provider.
   * Uses the agent's system prompt and parses the result.
   */
  async run(messages: Message[]): Promise<AgentResult<T>> {
    const start = Date.now();

    const result = await callClaude(messages, this.systemPrompt);

    const data = this.parseResponse(result.text);

    return {
      data,
      provider: 'claude',
      durationMs: Date.now() - start,
    };
  }

  /**
   * Run the agent with a tiered fallback strategy.
   * Tries each strategy in order; if all fail, uses the final fallback.
   */
  async runWithFallback(fallback: FallbackConfig<T>): Promise<AgentResult<T>> {
    const start = Date.now();

    for (const strategy of fallback.strategies) {
      try {
        const data = await strategy.execute();
        return {
          data,
          provider: strategy.name,
          durationMs: Date.now() - start,
        };
      } catch (error) {
        console.error(`Strategy "${strategy.name}" failed:`, error);
      }
    }

    // Final fallback (deterministic, must succeed)
    if (fallback.finalFallback) {
      return {
        data: fallback.finalFallback(),
        provider: 'local',
        durationMs: Date.now() - start,
      };
    }

    throw new Error('All agent strategies failed and no final fallback was provided');
  }
}
