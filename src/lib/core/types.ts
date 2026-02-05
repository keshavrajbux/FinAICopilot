/**
 * Core Agent Framework Types
 *
 * These types are domain-agnostic. They define the contracts for
 * AI providers, agents, and orchestration pipelines.
 * Nothing in this file should reference finance, tenants, or any product domain.
 */

/** A message in a conversation with an AI provider */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Configuration for an AI provider call */
export interface ProviderConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

/** Result of a provider call */
export interface ProviderResult {
  text: string;
  model: string;
  tokensUsed?: number;
}

/** Configuration for agent fallback behavior */
export interface FallbackConfig<T> {
  /** Ordered list of strategies to try. Each returns T or throws. */
  strategies: Array<{
    name: string;
    execute: () => Promise<T>;
  }>;
  /** Final fallback that must always succeed */
  finalFallback?: () => T;
}

/** Agent execution result with metadata */
export interface AgentResult<T> {
  data: T;
  provider: string;
  durationMs: number;
}
