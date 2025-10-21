/**
 * Agent Shared Type Definitions
 *
 * Type definitions shared across all agent implementations.
 */

/**
 * Agent task parameters
 */
export interface AgentTaskParams {
  context: Record<string, unknown>;
  domain?: string;
  query: string;
  sessionId: string;
  taskId: string;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  confidence?: number;
  data?: unknown;
  duration: number;
  error?: string;
  success: boolean;
  tokensUsed?: number;
  type: string;
}

/**
 * LLM completion parameters
 */
export interface CompletionParams {
  maxTokens?: number;
  model: string;
  prompt: string;
  stopSequences?: string[];
  systemPrompt?: string;
  temperature?: number;
}

/**
 * LLM response
 */
export interface LLMResponse {
  finishReason: 'stop' | 'length' | 'content_filter';
  text: string;
  usage: TokenUsage;
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  completionTokens: number;
  promptTokens: number;
  totalTokens: number;
}

/**
 * Embedding parameters
 */
export interface EmbedParams {
  model: string;
  text: string;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  fallback?: {
    model: string;
    provider: 'anthropic' | 'openai' | 'ollama';
  };
  llmModel: string;
  llmProvider: 'anthropic' | 'openai' | 'ollama';
  maxTokens?: number;
  temperature?: number;
  type: string;
}
