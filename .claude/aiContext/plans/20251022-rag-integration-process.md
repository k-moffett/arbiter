# RAG System Integration Process

**Date**: October 22, 2025
**Status**: Planning Complete → Integration In Progress
**Purpose**: Replace MVP AgentOrchestrator with Advanced RAG System

---

## Table of Contents

1. [Current MVP Analysis](#current-mvp-analysis)
2. [Advanced RAG Architecture](#advanced-rag-architecture)
3. [Integration Strategy](#integration-strategy)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Configuration Management](#configuration-management)
6. [Testing Strategy](#testing-strategy)
7. [Rollback Plan](#rollback-plan)

---

## Current MVP Analysis

### What the MVP Does

**File**: `AgentOrchestratorImplementation.ts`

**Current Flow**:
```
User Query
  ↓
1. Generate Embedding (Ollama embed)
  ↓
2. Search Context (MCP vector search - basic)
   - Fetches 20 results
   - Simple 60/40 mix: recent vs semantic
   - Sorts chronologically
  ↓
3. Build Simple Prompt
   - System instruction
   - Context dump (no citations)
   - Current query
  ↓
4. LLM Completion (Ollama)
  ↓
5. Store Messages (user + bot)
  ↓
Return QueryResult
```

**Limitations**:
- ❌ No query classification/routing
- ❌ No HyDE or query enhancement
- ❌ No query decomposition for complex queries
- ❌ No hybrid search (BM25 + dense)
- ❌ No relevance validation/filtering
- ❌ No context window management
- ❌ No citations in responses
- ❌ No quality grading feedback loop
- ❌ No tool planning
- ❌ Static confidence scores (0.8)
- ❌ No performance optimization (caching)

### What the MVP Does Well

- ✅ Implements `AgentOrchestrator` interface correctly
- ✅ Handles message storage properly
- ✅ Request ID generation (hierarchical)
- ✅ Basic context awareness
- ✅ Error handling for search failures
- ✅ Structured logging

### Interface Contract (Must Maintain)

```typescript
interface AgentOrchestrator {
  health(): Promise<{ status: 'ok'; uptime: number; activeAgents: number }>;

  processQuery(params: {
    query: string;
    userId: string;
    sessionId: string;
    context?: Record<string, unknown>;
  }): Promise<QueryResult>;
}

interface QueryResult {
  answer: string;
  sources: Source[];
  confidence: number;
  agentsUsed: number;
  totalCost: number;
  totalDuration: number;
}
```

---

## Advanced RAG Architecture

### Component Dependency Graph

```
AgentOrchestratorImplementation
  └── RAGOrchestrationService
        ├── QueryRouter
        │     └── CacheManager
        │     └── OllamaProvider
        │
        ├── QueryEnhancer
        │     ├── CacheManager
        │     └── OllamaProvider
        │
        ├── QueryDecomposer
        │     ├── CacheManager
        │     └── OllamaProvider
        │
        ├── HybridSearchRetriever
        │     ├── EmbeddingProvider (adapter)
        │     └── VectorSearchTool (adapter)
        │
        ├── RAGValidator
        │     └── OllamaProvider
        │
        ├── ContextWindowManager
        │     (standalone)
        │
        ├── AdvancedPromptBuilder
        │     (standalone)
        │
        ├── ToolPlanner
        │     └── OllamaProvider
        │
        └── QualityGrader
              └── OllamaProvider
```

### Data Flow

```
processQuery(query, userId, sessionId)
  ↓
RAGOrchestrationService.orchestrate()
  ↓
1. QueryRouter.route() → QueryRoute
   ├─ FAST PATH (complexity ≤ 7)
   │   Skip: HyDE, decomposition, tool planning
   │   Use: basic retrieval + validation
   │
   └─ COMPLEX PATH (complexity > 7)
       Use: All components
  ↓
2. [Conditional] QueryEnhancer.enhance()
   ├─ HyDE (hypothetical answer)
   └─ Query Expansion (alternatives + related)
  ↓
3. [Conditional] QueryDecomposer.decompose()
   └─ Sub-queries with dependencies
  ↓
4. HybridSearchRetriever.retrieve()
   ├─ Parallel searches (original + HyDE + alternatives + related)
   ├─ BM25 scoring (client-side)
   ├─ Dense semantic scoring
   └─ Weighted combination (60% dense, 40% BM25)
  ↓
5. RAGValidator.validate()
   ├─ LLM-based relevance scoring
   └─ Threshold filtering (min 0.3)
  ↓
6. ContextWindowManager.fitContext()
   └─ Token budget management
  ↓
7. [Conditional] ToolPlanner.planTools()
   └─ LLM-guided tool selection
  ↓
8. AdvancedPromptBuilder.buildPrompt()
   ├─ Intent-specific instructions
   ├─ Citations [1], [2], [3]
   └─ Formatted context
  ↓
Return: BuiltPrompt + Metadata
  ↓
[Back in processQuery()]
9. LLM Completion (using built prompt)
  ↓
10. Store Messages
  ↓
11. Background: QualityGrader.grade()
    ├─ Quality scoring (relevance, completeness, clarity)
    ├─ Entity extraction
    └─ [Future] Update Qdrant metadata
  ↓
Return QueryResult
```

---

## Integration Strategy

### Adapter Pattern Approach

**Why**: RAGOrchestrationService has different interfaces than what AgentOrchestrator expects

**Solution**: Create adapter layers to bridge the gap

```
AgentOrchestrator Interface (External Contract)
  ↓
AgentOrchestratorImplementation (Adapter)
  ↓
RAGOrchestrationService (Advanced RAG)
  ↓
10 RAG Components
```

### Gradual Integration Steps

1. **Phase 1**: Create adapters (no breaking changes)
2. **Phase 2**: Create factory (component initialization)
3. **Phase 3**: Modify AgentOrchestratorImplementation (replace processQuery logic)
4. **Phase 4**: Test thoroughly
5. **Phase 5**: Deploy

### Backwards Compatibility

- **Interface**: Zero changes to `AgentOrchestrator` interface
- **Config**: Extend `AgentOrchestratorConfig` with RAG configs
- **Behavior**: Same inputs/outputs, better quality
- **Rollback**: Keep MVP code in separate methods (can switch back if needed)

---

## Step-by-Step Integration

### Step 1: Create Adapter - EmbeddingProvider

**File**: `src/_agents/_orchestration/AgentOrchestrator/adapters/EmbeddingProviderAdapter.ts`

**Purpose**: Adapt Ollama's single-text `embed()` to batch interface

```typescript
class EmbeddingProviderAdapter {
  constructor(private ollamaProvider: OllamaProvider) {}

  async embed(params: { texts: string[] }): Promise<{ embeddings: number[][] }> {
    // Call Ollama for each text
    const embeddings = await Promise.all(
      params.texts.map(text =>
        this.ollamaProvider.embed({ model: 'nomic-embed-text', text })
      )
    );
    return { embeddings };
  }
}
```

**Dependencies**: None
**Testing**: Mock Ollama, verify batch processing

---

### Step 2: Create Adapter - VectorSearchTool

**File**: `src/_agents/_orchestration/AgentOrchestrator/adapters/VectorSearchToolAdapter.ts`

**Purpose**: Adapt MCP client to VectorSearchTool interface

```typescript
class VectorSearchToolAdapter {
  constructor(private mcpClient: MCPClient) {}

  async execute(params: VectorSearchContextParams): Promise<VectorSearchContextResult> {
    // Map params and call MCP
    const result = await this.mcpClient.searchContext({
      userId: params.userId,
      queryVector: params.queryVector,
      limit: params.limit,
      filters: params.filters
    });

    // Map result to expected format
    return {
      count: result.count,
      results: result.results
    };
  }
}
```

**Dependencies**: MCPClient
**Testing**: Mock MCP, verify mapping

---

### Step 3: Create Configuration

**File**: `src/_agents/_orchestration/AgentOrchestrator/config/RAGComponentConfigs.ts`

**Purpose**: Centralized configuration for all components

```typescript
export interface RAGSystemConfig {
  // Global
  llmModel: string;
  embeddingModel: string;

  // Per-component configs
  queryRouter: QueryRouterConfig;
  cacheManager: CacheManagerConfig;
  queryDecomposer: QueryDecomposerConfig;
  queryEnhancer: QueryEnhancerConfig;
  hybridSearchRetriever: HybridSearchRetrieverConfig;
  contextWindowManager: ContextWindowManagerConfig;
  ragValidator: RAGValidatorConfig;
  qualityGrader: QualityGraderConfig;
  toolPlanner: ToolPlannerConfig;
  advancedPromptBuilder: AdvancedPromptBuilderConfig;
}

export const DEFAULT_RAG_CONFIG: RAGSystemConfig = {
  llmModel: 'llama3.1:8b',
  embeddingModel: 'nomic-embed-text',

  queryRouter: {
    complexityThreshold: 7,
    llmModel: 'llama3.1:8b',
    temperature: 0.3,
  },

  cacheManager: {
    maxSize: 1000,
    defaultTTL: 3600000, // 1 hour
    cleanupInterval: 300000, // 5 minutes
  },

  // ... (all other component configs with sensible defaults)
};
```

**Dependencies**: All component type definitions
**Testing**: Validate all configs are complete

---

### Step 4: Create Factory

**File**: `src/_agents/_orchestration/AgentOrchestrator/factories/RAGComponentFactory.ts`

**Purpose**: Initialize all components with proper dependencies

```typescript
export class RAGComponentFactory {
  static create(params: {
    config: RAGSystemConfig;
    mcpClient: MCPClient;
    ollamaProvider: OllamaProvider;
    logger: Logger;
  }): RAGOrchestrationService {

    // 1. Create shared components
    const cacheManager = new CacheManager({
      config: params.config.cacheManager,
      logger: params.logger
    });

    // 2. Create adapters
    const embeddingProvider = new EmbeddingProviderAdapter(params.ollamaProvider);
    const vectorSearchTool = new VectorSearchToolAdapter(params.mcpClient);

    // 3. Create all RAG components
    const queryRouter = new QueryRouter({
      config: params.config.queryRouter,
      cacheManager,
      ollamaProvider: params.ollamaProvider,
      logger: params.logger,
      userId: 'system' // Will be overridden per request
    });

    // ... create all 10 components

    // 4. Create orchestration service
    return new RAGOrchestrationService({
      queryRouter,
      queryEnhancer,
      queryDecomposer,
      hybridSearchRetriever,
      ragValidator,
      contextWindowManager,
      advancedPromptBuilder,
      toolPlanner,
      qualityGrader,
      logger: params.logger
    });
  }
}
```

**Dependencies**: All 10 components + adapters
**Testing**: Verify all components initialized correctly

---

### Step 5: Create Utility - ConfidenceCalculator

**File**: `src/_agents/_orchestration/AgentOrchestrator/utils/ConfidenceCalculator.ts`

**Purpose**: Calculate dynamic confidence from RAG metadata

```typescript
export class ConfidenceCalculator {
  static calculate(params: {
    metadata: RAGOrchestrationMetadata;
    citations: Citation[];
  }): number {
    // Factors:
    // - Number of validated results
    // - Average relevance score
    // - Path taken (complex path = higher confidence)
    // - Whether HyDE was used

    let confidence = 0.5; // Base

    // Boost for validated results
    if (params.metadata.contextStats.validated > 5) {
      confidence += 0.2;
    }

    // Boost for complex path
    if (params.metadata.enhanced) {
      confidence += 0.1;
    }

    // Boost for high relevance
    const avgRelevance = params.citations.reduce((sum, c) => sum + c.relevanceScore, 0) / params.citations.length;
    confidence += avgRelevance * 0.2;

    return Math.min(1.0, Math.max(0.0, confidence));
  }
}
```

**Dependencies**: RAG types
**Testing**: Unit tests with various scenarios

---

### Step 6: Modify AgentOrchestratorImplementation

**File**: `src/_agents/_orchestration/AgentOrchestrator/AgentOrchestratorImplementation.ts`

**Changes**:

1. **Add field**:
```typescript
private readonly ragService: RAGOrchestrationService;
```

2. **Initialize in constructor**:
```typescript
constructor(config: AgentOrchestratorConfig) {
  // ... existing code ...

  // Initialize RAG system
  const ragConfig = config.ragConfig ?? DEFAULT_RAG_CONFIG;
  this.ragService = RAGComponentFactory.create({
    config: ragConfig,
    mcpClient: this.mcpClient,
    ollamaProvider: this.ollamaProvider,
    logger: this.logger
  });
}
```

3. **Replace processQuery()**:
```typescript
public async processQuery(params: {
  context?: Record<string, unknown>;
  query: string;
  sessionId: string;
  userId: string;
}): Promise<QueryResult> {
  const startTime = Date.now();
  const requestId = this.generateRequestId();
  const rootRequestId = requestId;
  const messageId = randomUUID();

  // Step 1: RAG Orchestration
  const ragResult = await this.ragService.orchestrate({
    messageId,
    query: params.query,
    userId: params.userId,
    sessionId: params.sessionId
  });

  this.logger.info({
    message: 'RAG orchestration complete',
    metadata: {
      pathTaken: ragResult.pathTaken,
      contextRetrieved: ragResult.metadata.contextStats.retrieved,
      contextValidated: ragResult.metadata.contextStats.validated,
      contextFitted: ragResult.metadata.contextStats.fitted
    }
  });

  // Step 2: LLM Completion with built prompt
  const llmResponse = await this.ollamaProvider.complete({
    maxTokens: 2048,
    model: this.llmModel,
    prompt: ragResult.builtPrompt.prompt,
    temperature: 0.7
  });

  // Step 3: Store user message
  await this.storeMessage({
    agentType: 'orchestrator',
    content: params.query,
    requestId,
    rootRequestId,
    role: 'user',
    sessionId: params.sessionId,
    userId: params.userId
  });

  // Step 4: Store bot response
  await this.storeMessage({
    agentType: 'orchestrator',
    content: llmResponse.text,
    requestId,
    rootRequestId,
    role: 'bot',
    sessionId: params.sessionId,
    userId: params.userId
  });

  // Step 5: Background quality grading (non-blocking)
  this.ragService.gradeResponse({
    messageId,
    query: params.query,
    response: llmResponse.text,
    retrievedContext: ragResult.builtPrompt.citations.map(c => c.content)
  }).catch(err => {
    this.logger.error({
      message: 'Background quality grading failed',
      metadata: { error: err, messageId }
    });
  });

  // Step 6: Calculate dynamic confidence
  const confidence = ConfidenceCalculator.calculate({
    metadata: ragResult.metadata,
    citations: ragResult.builtPrompt.citations
  });

  const duration = Date.now() - startTime;

  // Step 7: Build result with citations
  return {
    answer: llmResponse.text,
    sources: ragResult.builtPrompt.citations.map(citation => ({
      id: citation.messageId,
      content: citation.content,
      score: citation.relevanceScore,
      metadata: {
        timestamp: citation.timestamp,
        citationId: citation.citationId
      }
    })),
    confidence,
    agentsUsed: 1,
    totalCost: 0,
    totalDuration: duration
  };
}
```

**Keep Unchanged**:
- `health()`
- `generateRequestId()`
- `storeMessage()`
- All sorting/comparison methods

---

## Configuration Management

### Environment Variables

```bash
# Core
LLM_MODEL=llama3.1:8b
EMBEDDING_MODEL=nomic-embed-text

# QueryRouter
QUERY_ROUTER_COMPLEXITY_THRESHOLD=7
QUERY_ROUTER_TEMPERATURE=0.3

# CacheManager
CACHE_MAX_SIZE=1000
CACHE_TTL=3600000
CACHE_CLEANUP_INTERVAL=300000

# HybridSearchRetriever
HYBRID_SEARCH_BM25_K1=1.5
HYBRID_SEARCH_BM25_B=0.75
HYBRID_SEARCH_DENSE_WEIGHT=0.6
HYBRID_SEARCH_BM25_WEIGHT=0.4

# RAGValidator
RAG_VALIDATOR_MIN_SCORE=0.3
RAG_VALIDATOR_MAX_PARALLEL=5

# ContextWindowManager
CONTEXT_MAX_TOKENS=4096
CONTEXT_MIN_RESPONSE_TOKENS=512
CONTEXT_CHARS_PER_TOKEN=4

# QualityGrader
QUALITY_GRADER_RELEVANCE_WEIGHT=0.4
QUALITY_GRADER_COMPLETENESS_WEIGHT=0.3
QUALITY_GRADER_CLARITY_WEIGHT=0.3
```

### Default Values (Production-Ready)

All defaults in `DEFAULT_RAG_CONFIG` are tuned based on:
- Research papers (2024-2025 RAG best practices)
- Typical LLM token limits (4096 for Llama 3.1)
- Performance targets (3-5s fast, 8-12s complex)
- Memory constraints (1000 cache entries ≈ 10MB)

### Tuning Guidelines

**Performance Tuning**:
- Increase `CACHE_MAX_SIZE` for better hit rates
- Decrease `QUERY_ROUTER_COMPLEXITY_THRESHOLD` to route more to fast path
- Increase `HYBRID_SEARCH_DENSE_WEIGHT` for better semantic matching

**Quality Tuning**:
- Increase `RAG_VALIDATOR_MIN_SCORE` for stricter filtering
- Decrease `QUERY_ROUTER_COMPLEXITY_THRESHOLD` for more complex path usage
- Increase `CONTEXT_MAX_TOKENS` for more context

**Cost/Latency Tuning**:
- Increase `CACHE_TTL` to reduce LLM calls
- Decrease `RAG_VALIDATOR_MAX_PARALLEL` to avoid rate limits
- Decrease query expansion limits to reduce parallel searches

---

## Testing Strategy

### Unit Tests

**Per Component**:
- Test each adapter independently
- Mock all dependencies
- Verify interface compliance
- Test error handling

**Coverage Target**: >80% for adapters and factory

### Integration Tests

**RAGComponentFactory**:
- Test all components initialize correctly
- Test dependencies are wired properly
- Test configs are applied

**AgentOrchestratorImplementation**:
- Test processQuery() with RAG service
- Test message storage still works
- Test request ID generation unchanged

### End-to-End Tests

**Query Types**:
1. **Simple Query** (fast path)
   - "What is X?"
   - Expected: <5s, basic retrieval, no HyDE

2. **Complex Query** (complex path)
   - "Compare X and Y, then summarize their key differences"
   - Expected: 8-12s, HyDE, decomposition, validation

3. **Temporal Query**
   - "What did we discuss last time about X?"
   - Expected: Temporal filtering, chronological context

4. **Comparative Query**
   - "How does A compare to B?"
   - Expected: Multiple retrievals, analysis

**Assertions**:
- Response quality (manual evaluation)
- Citations present and accurate
- Latency within targets
- Confidence scores reasonable
- Background grading completes

### Performance Tests

**Benchmarks**:
- Simple queries: 3-5s (P95)
- Complex queries: 8-12s (P95)
- Cache hit rate: >40%
- Memory usage: <100MB for 1000 cache entries

**Load Tests**:
- 100 concurrent queries
- No memory leaks
- No rate limit errors

---

## Rollback Plan

### If Integration Fails

**Option 1: Feature Flag**
```typescript
const USE_ADVANCED_RAG = process.env.USE_ADVANCED_RAG === 'true';

public async processQuery(params) {
  if (USE_ADVANCED_RAG) {
    return this.processQueryAdvanced(params);
  } else {
    return this.processQueryMVP(params);
  }
}
```

**Option 2: Git Revert**
- Tag current commit before integration
- Can revert to MVP in seconds

**Option 3: Blue-Green Deployment**
- Keep MVP running
- Deploy advanced RAG alongside
- Switch traffic gradually

### Monitoring

**Metrics to Track**:
- Query latency (P50, P95, P99)
- Cache hit rates
- Quality grading scores
- Error rates
- LLM call counts
- Memory usage

**Alerts**:
- P95 latency >15s
- Error rate >5%
- Cache hit rate <20%
- Memory usage >500MB

---

## Success Criteria

✅ **Functional**:
- All queries return valid responses
- Citations included in responses
- Background grading completes without errors

✅ **Performance**:
- Fast path: <5s (P95)
- Complex path: <12s (P95)
- Cache hit rate: >40%

✅ **Quality**:
- User satisfaction improves (subjective)
- Response accuracy improves (eval set)
- Confidence scores correlate with quality

✅ **Reliability**:
- No regressions in existing functionality
- All tests pass
- Zero production errors in first week

---

## Timeline

| Phase | Tasks | Duration | Status |
|-------|-------|----------|--------|
| 1 | Documentation | 1 hour | ✅ Complete |
| 2 | Adapters | 2 hours | Pending |
| 3 | Factory + Config | 2 hours | Pending |
| 4 | Integration | 2 hours | Pending |
| 5 | Testing | 3 hours | Pending |
| **Total** | | **10 hours** | **10% Complete** |

---

## References

- Original Plan: `.claude/aiContext/plans/20251022-210000-optimized-rag-dual-path.md`
- Implementation Summary: `.claude/aiContext/compactHistory/2025-10-22_advanced-rag-system-complete.md`
- RAG Components: `src/_agents/_orchestration/AgentOrchestrator/*/`
- Current MVP: `src/_agents/_orchestration/AgentOrchestrator/AgentOrchestratorImplementation.ts`

---

**Last Updated**: October 22, 2025
**Author**: Claude Code
**Status**: Ready for Implementation
