/**
 * Claude AI Provider
 *
 * Domain-agnostic client for the Anthropic Claude API.
 * Part of the core orchestration layer -- no knowledge of finance or any product domain.
 */

import { Message, ProviderConfig, ProviderResult } from '../types';

const DEFAULT_CONFIG: ProviderConfig = {
  model: 'claude-3-haiku-20240307',
  maxTokens: 2000,
  temperature: 0.7,
  timeoutMs: 15000,
};

interface ClaudeTextBlock {
  type: 'text';
  text: string;
}

interface ClaudeResponse {
  content: ClaudeTextBlock[];
}

/**
 * Send a request to the Claude API and get a text response.
 * This is a pure provider call -- it knows nothing about what the text means.
 */
export async function callClaude(
  messages: Message[],
  systemPrompt: string,
  config: Partial<ProviderConfig> = {}
): Promise<ProviderResult> {
  const { model, maxTokens, temperature, timeoutMs } = { ...DEFAULT_CONFIG, ...config };

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Claude API key not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Filter out system messages -- Claude uses a separate system field
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: chatMessages,
        max_tokens: maxTokens,
        temperature,
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

    return {
      text: textContent.text,
      model,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Claude API request timed out');
    }

    throw error;
  }
}
