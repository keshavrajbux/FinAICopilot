/**
 * Core Agent Orchestration Framework
 *
 * This is the domain-agnostic foundation layer.
 * It provides AI providers, a generic agent base class, and orchestration primitives.
 *
 * RULES:
 * - Nothing in core/ may import from product/ or enterprise/
 * - core/ has no knowledge of finance, tenants, or any specific domain
 * - Other layers import FROM core, never the reverse
 */

// Types
export type {
  Message,
  ProviderConfig,
  ProviderResult,
  FallbackConfig,
  AgentResult,
} from './types';

// Providers
export { callClaude } from './providers/claude-provider';
export { callOpenAI } from './providers/openai-provider';

// Agents
export { BaseAgent } from './agents/base-agent';
