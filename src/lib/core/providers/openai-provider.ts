/**
 * OpenAI Provider
 *
 * Domain-agnostic client for the OpenAI API.
 * Part of the core orchestration layer -- no knowledge of finance or any product domain.
 */

import { Message, ProviderConfig, ProviderResult } from '../types';

const DEFAULT_CONFIG: ProviderConfig = {
  model: 'gpt-3.5-turbo',
  maxTokens: 1500,
  temperature: 0.7,
  timeoutMs: 10000,
};

/**
 * Send a request to the OpenAI API and get a text response.
 * This is a pure provider call -- it knows nothing about what the text means.
 */
export async function callOpenAI(
  messages: Message[],
  config: Partial<ProviderConfig> & { jsonMode?: boolean } = {}
): Promise<ProviderResult> {
  const { model, maxTokens, temperature, timeoutMs } = { ...DEFAULT_CONFIG, ...config };
  const jsonMode = config.jsonMode ?? false;

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const openaiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const body: Record<string, unknown> = {
      model,
      messages: openaiMessages,
      temperature,
      max_tokens: maxTokens,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API Error [${response.status}]:`, errorText);
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

    return {
      text: result,
      model,
      tokensUsed: data.usage?.total_tokens,
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenAI API request timed out');
    }

    throw error;
  }
}
