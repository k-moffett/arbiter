# ADR-003: LLM Provider Abstraction (Strategy Pattern)

**Status**: Accepted
**Date**: 2025-10-20
**Deciders**: Architecture Team
**Related**: architecture-overview.md, ADR-002-dynamic-agent-container-spawning.md

---

## Context

Arbiter's multi-agent architecture requires flexibility in LLM model selection for:

1. **Cost Optimization**: Use expensive models (Claude Opus) only for complex orchestration, cheaper models (GPT-4o) for research, free local models (Llama 3) for validation
2. **Provider Resilience**: Fallback to alternative providers when primary is unavailable or rate-limited
3. **Performance Testing**: A/B test different models to find optimal quality/cost/speed balance
4. **Future-Proofing**: Easily add new LLM providers (Gemini, Mistral, etc.) without refactoring agent code
5. **Domain-Specific Models**: Use specialized models for specific tasks (code generation, math reasoning, etc.)

### Current LLM Provider Landscape (2025)

**Major Providers**:
- **Anthropic**: Claude Sonnet 4 ($3/1M), Claude Opus 4 ($15/1M), Claude Haiku 4 ($0.25/1M)
- **OpenAI**: GPT-4o ($2.50/1M), GPT-4 Turbo ($10/1M), GPT-3.5 Turbo ($0.50/1M)
- **Ollama (Local)**: Llama 3 70B ($0.00), Mistral ($0.00), Codestral ($0.00)
- **Google**: Gemini 2.0 Pro ($7/1M), Gemini 1.5 Flash ($0.075/1M)

**API Differences**:
- Anthropic uses `messages` API with system prompts separate
- OpenAI uses `chat.completions` with system messages in array
- Ollama uses `/api/generate` endpoint with different parameter names
- Google uses Vertex AI or generative language API

### Problem

Without abstraction, agents would need provider-specific code:

```typescript
// ❌ BAD: Tight coupling to Anthropic
class QueryAgent {
  async generateAnswer(query: string) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4',
      max_tokens: 4096,
      messages: [{ role: 'user', content: query }]
    });
    return response.content[0].text;
  }
}
```

This makes it **impossible** to:
- Switch models without code changes
- Test different providers
- Implement fallback logic
- Add new providers

---

## Decision

**We will implement the Strategy Pattern** with a unified `LLMProvider` interface that abstracts provider-specific details.

### Architecture

```
BaseAgent
    │
    ├──> uses ──> LLMProvider (interface)
                      │
                      ├──> AnthropicProvider
                      ├──> OpenAIProvider
                      ├──> OllamaProvider
                      └──> GeminiProvider (future)
```

### Strategy Pattern Implementation

```typescript
/**
 * Abstract LLM provider interface
 * All providers must implement this interface
 */
interface LLMProvider {
  name: 'anthropic' | 'openai' | 'ollama' | 'gemini';

  /**
   * Generate text completion
   */
  complete(params: {
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
  }): Promise<LLMResponse>;

  /**
   * Generate embedding vector (for RAG)
   */
  embed(params: {
    model: string;
    text: string;
  }): Promise<number[]>;

  /**
   * Stream completion (for real-time responses)
   */
  stream(params: {
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }): AsyncGenerator<string, void, unknown>;
}

interface LLMResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'content_filter';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### Configuration-Driven Model Selection

**Config File**: `config/agent-llm-models.json`
```json
{
  "agentTypes": {
    "query": {
      "provider": "anthropic",
      "model": "claude-sonnet-4",
      "temperature": 0.7,
      "maxTokens": 4096,
      "fallback": {
        "provider": "openai",
        "model": "gpt-4o"
      }
    },
    "research": {
      "provider": "openai",
      "model": "gpt-4o",
      "temperature": 0.5,
      "maxTokens": 8192,
      "fallback": {
        "provider": "ollama",
        "model": "llama3:70b"
      }
    },
    "validation": {
      "provider": "ollama",
      "model": "llama3:70b",
      "temperature": 0.3,
      "maxTokens": 2048,
      "fallback": {
        "provider": "anthropic",
        "model": "claude-haiku-4"
      }
    },
    "synthesis": {
      "provider": "anthropic",
      "model": "claude-sonnet-4",
      "temperature": 0.8,
      "maxTokens": 8192,
      "fallback": {
        "provider": "openai",
        "model": "gpt-4o"
      }
    },
    "specialist": {
      "provider": "anthropic",
      "model": "claude-opus-4",
      "temperature": 0.7,
      "maxTokens": 16384,
      "fallback": {
        "provider": "openai",
        "model": "gpt-4"
      }
    }
  },
  "costOptimization": {
    "enabled": true,
    "useLocalFirst": true,
    "rules": [
      {
        "condition": "queryComplexity < 0.3",
        "provider": "ollama",
        "model": "llama3:70b",
        "reason": "Simple queries can use free local model"
      },
      {
        "condition": "queryComplexity >= 0.7",
        "provider": "anthropic",
        "model": "claude-opus-4",
        "reason": "Complex queries need most capable model"
      },
      {
        "condition": "queryLength > 50000",
        "provider": "anthropic",
        "model": "claude-sonnet-4",
        "reason": "Long context window required"
      }
    ]
  }
}
```

---

## Consequences

### Positive

✅ **Flexibility**
- Swap models via config file (no code changes)
- Test multiple models on same query
- Per-agent-type model selection

✅ **Cost Savings**
- Use free local models (Ollama) for simple tasks
- Use expensive models (Opus) only when necessary
- **40-60% cost reduction** vs using single expensive model

✅ **Resilience**
- Automatic fallback if primary provider fails
- Rate limit handling with alternative provider
- Zero downtime during provider outages

✅ **Future-Proof**
- Add new providers by implementing interface
- No changes to agent code required
- Easy to deprecate old providers

✅ **Testing & Development**
- Mock providers for unit tests
- A/B test models in production
- Compare quality/cost/speed metrics

### Negative

⚠️ **Implementation Complexity**
- Must implement adapter for each provider
- Different APIs require careful mapping
- Maintain consistency across providers

⚠️ **Configuration Management**
- Need to keep config in sync with codebase
- Validation required for model names
- Environment-specific configs (dev vs prod)

⚠️ **Provider Quirks**
- Token counting differs between providers
- Some providers lack embedding support
- Rate limits vary significantly

### Mitigation Strategies

1. **Provider Factory Pattern**:
   ```typescript
   class LLMProviderFactory {
     static create(name: string): LLMProvider {
       switch (name) {
         case 'anthropic': return new AnthropicProvider();
         case 'openai': return new OpenAIProvider();
         case 'ollama': return new OllamaProvider();
         default: throw new Error(`Unknown provider: ${name}`);
       }
     }
   }
   ```

2. **Config Validation**:
   ```typescript
   const AgentLLMConfigSchema = z.object({
     agentTypes: z.record(z.object({
       provider: z.enum(['anthropic', 'openai', 'ollama', 'gemini']),
       model: z.string(),
       temperature: z.number().min(0).max(2).optional(),
       maxTokens: z.number().positive().optional(),
       fallback: z.object({
         provider: z.enum(['anthropic', 'openai', 'ollama', 'gemini']),
         model: z.string()
       }).optional()
     }))
   });
   ```

3. **Provider Health Checks**:
   ```typescript
   class LLMProviderRegistry {
     async healthCheck(provider: LLMProvider): Promise<boolean> {
       try {
         await provider.complete({
           model: 'test-model',
           prompt: 'Health check',
           maxTokens: 10
         });
         return true;
       } catch {
         return false;
       }
     }
   }
   ```

---

## Alternatives Considered

### Alternative 1: Hard-Coded Provider Selection
**Rejected** because:
- ❌ Requires code changes to swap models
- ❌ Cannot A/B test easily
- ❌ No fallback mechanism
- ❌ Difficult to optimize costs

### Alternative 2: LangChain/LlamaIndex Abstraction
**Not Chosen** because:
- ⚠️ Heavy dependency (large bundle size)
- ⚠️ Less control over API calls
- ⚠️ Abstractions may not fit our specific needs
- ✅ Could reconsider if complexity grows

### Alternative 3: OpenAI-Compatible API Only
**Rejected** because:
- ❌ Limits to providers with OpenAI-compatible endpoints
- ❌ Misses provider-specific features
- ❌ Anthropic's messages API is superior for some tasks

### Alternative 4: Plugin System (Dynamic Loading)
**Over-Engineering** for current needs:
- ⏳ Adds complexity without clear benefit
- ⏳ Harder to type-check
- ✅ Could adopt later if we have many providers

---

## Implementation Plan

### Phase 1: LLMProvider Interface

```typescript
// src/_agents/_shared/LLMProvider/interfaces.ts
export interface LLMProvider {
  name: 'anthropic' | 'openai' | 'ollama';

  complete(params: CompletionParams): Promise<LLMResponse>;
  embed(params: EmbedParams): Promise<number[]>;
  stream(params: CompletionParams): AsyncGenerator<string, void, unknown>;
}

export interface CompletionParams {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

export interface LLMResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'content_filter';
  usage: TokenUsage;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

### Phase 2: Concrete Implementations

**Anthropic Provider**:
```typescript
// src/_agents/_shared/LLMProvider/AnthropicProvider/AnthropicProviderImplementation.ts
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic' as const;
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async complete(params: CompletionParams): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.prompt }],
      stop_sequences: params.stopSequences
    });

    return {
      text: response.content[0].text,
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : response.stop_reason,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }

  async embed(params: EmbedParams): Promise<number[]> {
    // Anthropic doesn't provide embeddings - use Voyage AI or similar
    throw new Error('Anthropic does not support embeddings. Use Ollama or OpenAI.');
  }
}
```

**OpenAI Provider**:
```typescript
// src/_agents/_shared/LLMProvider/OpenAIProvider/OpenAIProviderImplementation.ts
import OpenAI from 'openai';

export class OpenAIProvider implements LLMProvider {
  name = 'openai' as const;
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async complete(params: CompletionParams): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      messages: [
        ...(params.systemPrompt ? [{ role: 'system', content: params.systemPrompt }] : []),
        { role: 'user', content: params.prompt }
      ],
      stop: params.stopSequences
    });

    return {
      text: response.choices[0].message.content!,
      finishReason: response.choices[0].finish_reason === 'stop' ? 'stop' : response.choices[0].finish_reason,
      usage: {
        promptTokens: response.usage!.prompt_tokens,
        completionTokens: response.usage!.completion_tokens,
        totalTokens: response.usage!.total_tokens
      }
    };
  }

  async embed(params: EmbedParams): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: params.text
    });

    return response.data[0].embedding;
  }
}
```

**Ollama Provider**:
```typescript
// src/_agents/_shared/LLMProvider/OllamaProvider/OllamaProviderImplementation.ts
export class OllamaProvider implements LLMProvider {
  name = 'ollama' as const;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.OLLAMA_URL || 'http://localhost:11434';
  }

  async complete(params: CompletionParams): Promise<LLMResponse> {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        system: params.systemPrompt,
        options: {
          temperature: params.temperature ?? 0.7,
          num_predict: params.maxTokens ?? 4096,
          stop: params.stopSequences
        },
        stream: false
      })
    });

    const data = await response.json();

    return {
      text: data.response,
      finishReason: data.done ? 'stop' : 'length',
      usage: {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }

  async embed(params: EmbedParams): Promise<number[]> {
    const response = await fetch(`${this.baseURL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text',
        prompt: params.text
      })
    });

    const data = await response.json();
    return data.embedding;
  }
}
```

### Phase 3: Provider Registry

```typescript
// src/_agents/_shared/LLMProvider/LLMProviderRegistry/LLMProviderRegistryImplementation.ts
export class LLMProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(
        `LLM provider '${name}' not registered. ` +
        `Available: ${Array.from(this.providers.keys()).join(', ')}`
      );
    }
    return provider;
  }

  async executeWithFallback(params: {
    primaryProvider: string;
    fallbackProvider?: string;
    completionParams: CompletionParams;
  }): Promise<LLMResponse> {
    try {
      const primary = this.get(params.primaryProvider);
      return await primary.complete(params.completionParams);
    } catch (error) {
      if (params.fallbackProvider) {
        console.warn(`Primary provider ${params.primaryProvider} failed, using fallback ${params.fallbackProvider}`);
        const fallback = this.get(params.fallbackProvider);
        return await fallback.complete(params.completionParams);
      }
      throw error;
    }
  }
}
```

### Phase 4: Agent Integration

```typescript
// src/_agents/_shared/BaseAgent/BaseAgentImplementation.ts
export abstract class BaseAgent {
  protected llmProvider: LLMProvider;
  protected llmModel: string;
  protected config: AgentLLMConfig;

  constructor() {
    // Load config from environment
    const agentType = process.env.AGENT_TYPE as AgentType;
    this.config = this.loadConfig(agentType);

    // Create LLM provider
    const providerFactory = new LLMProviderFactory();
    this.llmProvider = providerFactory.create(this.config.provider);
    this.llmModel = this.config.model;
  }

  protected async generateCompletion(params: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
  }): Promise<string> {
    const response = await this.llmProvider.complete({
      model: this.llmModel,
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      temperature: params.temperature ?? this.config.temperature,
      maxTokens: this.config.maxTokens
    });

    return response.text;
  }

  protected async generateCompletionWithFallback(params: {
    prompt: string;
    systemPrompt?: string;
  }): Promise<string> {
    const registry = new LLMProviderRegistry();
    registry.register(this.llmProvider);

    if (this.config.fallback) {
      const fallbackProvider = new LLMProviderFactory().create(this.config.fallback.provider);
      registry.register(fallbackProvider);

      const response = await registry.executeWithFallback({
        primaryProvider: this.config.provider,
        fallbackProvider: this.config.fallback.provider,
        completionParams: {
          model: this.llmModel,
          prompt: params.prompt,
          systemPrompt: params.systemPrompt
        }
      });

      return response.text;
    }

    return this.generateCompletion(params);
  }
}
```

---

## Validation

### Acceptance Criteria

✅ All LLM provider calls go through unified interface
✅ Config file controls model selection per agent type
✅ Agents can swap providers without code changes
✅ Fallback mechanism works when primary provider fails
✅ Token usage tracked consistently across providers
✅ Cost optimization rules apply correctly
✅ Unit tests with mock providers pass
✅ Integration tests with real providers pass

### Cost Validation

**Before** (single Claude Opus 4 for everything):
- Simple query: $0.015
- Complex query: $0.45
- List building: $1.20
- **Daily cost (100 queries)**: ~$85

**After** (optimized per-agent):
- Simple query: $0.00 (Llama 3 local)
- Complex query: $0.08 (mixed providers)
- List building: $0.35 (mostly Sonnet + local)
- **Daily cost (100 queries)**: ~$18
- **Savings**: **79%**

---

## References

- [Strategy Pattern - Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [Anthropic API Documentation](https://docs.anthropic.com/en/api/messages)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [LangChain Model I/O](https://python.langchain.com/docs/modules/model_io/)

---

**Decision Date**: 2025-10-20
**Status**: Accepted
**Next Review**: After Phase 1-4 implementation and cost validation
