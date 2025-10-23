# Optimized Advanced RAG System - Dual Path Architecture

**Status**: In Progress
**Start Date**: 2025-10-22
**Estimated Duration**: 28-36 hours (3.5-4.5 working days)
**Type**: Major Feature Implementation

---

## Executive Summary

Implement a production-ready, dual-path RAG system that optimizes for both speed (fast path) and sophistication (complex path). The system includes query routing, caching, conditional enhancements (HyDE, decomposition), hybrid search, quality grading feedback loop, and context window management.

**Key Innovation**: Dual-path architecture routes 70% of simple queries through a fast 3-5s pipeline, while 30% of complex queries use the full 8-12s RAG pipeline.

---

## Research Foundation

This implementation is based on 2024-2025 RAG research and best practices:

### Academic Research
- **Query Decomposition**: October 2025 research on adaptive retrieval budgets (arxiv.org/abs/2510.18633)
- **HyDE**: Hypothetical Document Embeddings for improved retrieval (arxiv.org/abs/2212.10496)
- **RAG Best Practices**: Latest techniques from Haystack, LangChain, and academic literature

### Industry Standards
- **Model Context Protocol (MCP)**: Anthropic's 2024 standard for structured context (already implemented)
- **Hybrid Search**: BM25 + Dense embeddings = +15% accuracy improvement
- **Two-Stage Retrieval**: Fast retrieval → Slow reranking pattern
- **LLM-as-Judge**: For relevance scoring and validation

### Framework Patterns
- **LangGraph**: State machine patterns for agent orchestration
- **Haystack**: Query decomposition and HyDE implementation patterns
- **Anthropic Recommendations**: "Start simple, add complexity only when needed"

### Key Finding
Research shows **planning is less mature** than other RAG techniques. Therefore, we defer AgenticStepPlanner to Phase 2 (after Docker spawning infrastructure exists), focusing first on proven techniques.

---

## Architecture Overview

```
User Query
    ↓
QueryRouter (classify + route decision)
    ↓
    ├─→ FAST PATH (70% of queries, ~3-5s)
    │   ├─ Cache check
    │   ├─ Simple dense retrieval
    │   ├─ Basic filtering
    │   ├─ Simple prompt
    │   └─ LLM response
    │
    └─→ COMPLEX PATH (30% of queries, ~8-12s)
        ├─ Cache check
        ├─ Query Decomposition (conditional)
        ├─ Query Enhancement: HyDE + Expansion (conditional)
        ├─ Hybrid Search (BM25 + Dense + Metadata filters)
        ├─ RAG Validation + Reranking
        ├─ Context Window Management
        ├─ Tool Planning (conditional)
        ├─ Advanced Prompting with Citations
        └─ LLM Response

All responses ↓
Message Queue → Quality Grader (background) → Enriched Storage (Qdrant)
                    ↓
            Feedback improves future searches
```

---

## Component Architecture

### Core Components (10 total)

1. **QueryRouter** - Combined classification and routing
   - Determines fast vs complex path
   - Sets strategy flags (useHyDE, useDecomposition, etc.)
   - Includes caching logic
   - Target: <500ms

2. **CacheManager** - Performance optimization
   - In-memory cache (Redis-ready)
   - Caches: routes, decompositions, HyDE, search results, query results
   - TTL-based expiration
   - Target: >40% hit rate, <10ms retrieval

3. **QueryDecomposer** - Complex query breakdown
   - Only called when complexity >7
   - Breaks multi-part questions into sub-queries
   - Identifies dependencies
   - Target: <2s, ~30% of queries

4. **QueryEnhancer** - HyDE + Query Expansion
   - Combines HyDE and query expansion
   - Conditional based on route strategy
   - Weighted embedding combination
   - Target: <1.5s when used

5. **HybridSearchRetriever** - BM25 + Dense search
   - Sparse (BM25) + Dense (semantic) fusion
   - Metadata filtering (temporal, roles, tags)
   - Weighted score combination
   - Target: <1s, +15% accuracy vs dense-only

6. **ContextWindowManager** - Token limit management
   - Fits context to LLM token limits
   - Smart truncation (keeps high-scoring contexts)
   - Summarization for overflow
   - Target: Never exceed limits, maintain quality

7. **RAGValidator** - Two-stage retrieval validation
   - LLM-as-judge relevance scoring
   - Recency scoring with time decay
   - Filtering + reranking
   - Citation tracking
   - Target: <1.5s, >90% precision

8. **QualityGrader** - Feedback loop (CRITICAL NEW FEATURE)
   - Background async processing
   - Multi-dimensional quality scoring
   - Entity extraction + enhanced summaries
   - Enriches Qdrant storage
   - Target: Non-blocking, improves future searches

9. **ToolPlanner** - LLM-guided tool selection
   - Only called when tools needed (~10-15% of queries)
   - Scalable tool registry
   - LLM explains tool selection rationale
   - Target: <1s when used

10. **AdvancedPromptBuilder** - Sophisticated prompting
    - Chain-of-thought reasoning
    - Self-reflection
    - Citation formatting
    - Context window aware
    - Target: <300ms

### Supporting Infrastructure

- **Inversify DI Container**: Manages all dependencies
- **Logger**: Structured logging throughout
- **Config Objects**: Per-component configuration

---

## Dual-Path Routing Logic

### Fast Path Criteria (70% of queries)
- Complexity ≤7
- No decomposition needed
- Single-part question
- Examples: "What is X?", "Tell me about Y", "What did we discuss?"

### Fast Path Pipeline
1. Check cache (<10ms)
2. Dense-only retrieval (<800ms)
3. Simple score filtering (<100ms)
4. Basic prompt (<200ms)
5. LLM response (~2-3s)
6. **Total: 3-5s**

### Complex Path Criteria (30% of queries)
- Complexity >7
- Multi-part questions
- Comparisons
- Requires tools
- Examples: "Compare X and Y then summarize", "What did we discuss about A and how does it relate to B?"

### Complex Path Pipeline
1. Check cache (<10ms)
2. Decomposition if complexity >7 (<1.5s)
3. HyDE + Expansion if enabled (<1.5s)
4. Hybrid search with metadata (<1s)
5. RAG validation + reranking (<1.5s)
6. Context window management (<200ms)
7. Tool planning if needed (<800ms)
8. Advanced prompt building (<300ms)
9. LLM response (~2-3s)
10. **Total: 8-12s**

---

## Quality Grading Feedback Loop

### Problem
Current system stores messages immediately without quality assessment. No mechanism to improve future retrieval based on response quality.

### Solution
**Background Quality Grading Pipeline**:

```
LLM generates response
    ↓
Queue message (user + bot responses)
    ↓
Background worker (every 5s)
    ↓
For each queued message:
    ├─ Grade quality (0-1 score)
    ├─ Extract key entities
    ├─ Generate enhanced summary
    ├─ Add quality metadata
    └─ Store to Qdrant with enrichment
```

### Quality Dimensions Graded
1. **Relevance**: Does it answer the query? (0-1)
2. **Completeness**: Thorough answer? (0-1)
3. **Accuracy**: Factually correct? (0-1)
4. **Clarity**: Well-structured? (0-1)
5. **Citation Quality**: Proper source usage? (0-1)

### Enrichment Added to Qdrant
- `qualityScore` (overall)
- `enhancedSummary` (optimized for retrieval)
- `extractedEntities` (key terms)
- `citationQuality` (source usage score)
- Auto-generated tags

### Benefits
- Future searches can filter by quality score
- Enhanced summaries improve retrieval accuracy
- Extracted entities aid semantic search
- System learns from high-quality responses
- **Non-blocking**: No impact on query latency

---

## Metadata Filtering

### Existing ContextPayload Fields
```typescript
interface ContextPayload {
  agentType: string;           // 'orchestrator', etc.
  role: 'user' | 'bot';
  timestamp: number;
  userId: string;
  sessionId: string;
  tags: string[];
  channelId: string;           // 'cli', 'discord', etc.
  containerInstanceId: string;
  content: string;
  embeddedText: string;

  // NEW (from QualityGrader):
  qualityScore?: number;
  enhancedSummary?: string;
  extractedEntities?: string[];
  citationQuality?: number;
}
```

### Filterable Dimensions
1. **Temporal**: Last hour, last day, last week, all time
2. **Roles**: User messages only, bot responses only, both
3. **Agent Types**: Filter by which agent generated it
4. **Tags**: Conversation, important, topics, etc.
5. **Quality Score**: Filter by minimum quality threshold
6. **Channel**: CLI, Discord, web, etc.

### Usage Examples
```typescript
// "What did we discuss yesterday?"
filters: {
  temporalScope: 'last_day',
  roles: ['user', 'bot']
}

// "What were the high-quality responses about X?"
filters: {
  minQualityScore: 0.8,
  tags: ['topic-X']
}

// "What did the orchestrator say about Y?"
filters: {
  agentTypes: ['orchestrator'],
  roles: ['bot']
}
```

---

## Context Window Management Strategy

### Problem
Qdrant may return 10-30 high-quality contexts, but LLM has token limits (~8K for llama3.1:8b, ~4K reserved for query/response).

### Solution
**Smart Context Fitting**:

1. **Estimate Tokens**: ~4 chars = 1 token (rough approximation)
2. **Sort by Score**: Descending by `validation.finalScore`
3. **Pack Greedily**: Take highest-scoring contexts until limit reached
4. **Re-sort Chronologically**: Present in temporal order for LLM
5. **Fallback**: If still exceeds, summarize contexts

### Strategies
- **keep-all**: No truncation (fails if exceeds limit)
- **truncate-tail**: Remove oldest (loses temporal context)
- **truncate-middle**: Keep first and last (loses middle context)
- **smart** (default): Keep highest-scoring regardless of position
- **summarize**: LLM summarizes entire context into fixed tokens

### Configuration
```typescript
{
  maxContextTokens: 4000,           // Leave room for query + response
  summarizationThreshold: 6000,     // Summarize if raw >6000 tokens
  truncationStrategy: 'smart'
}
```

---

## Caching Strategy

### What to Cache
1. **Query Routes**: Same query → same route
2. **Decompositions**: Repeated complex queries
3. **HyDE Results**: Expensive LLM call
4. **Search Results**: Repeated searches
5. **Query Results**: Complete answers

### Cache Keys
Format: `{type}:{userId}:{queryHash}`

Examples:
- `route:user123:a8f3b9c1`
- `hyde:user123:7e2d4f6a`
- `result:user123:5c9b1e8d`

### TTL Strategy
- Routes: 1 hour
- Decompositions: 1 hour
- HyDE: 30 minutes
- Search results: 15 minutes
- Query results: 5 minutes

### Cache Invalidation
- User-specific (different users get different caches)
- TTL-based automatic expiration
- Manual invalidation when user preferences change

### Expected Performance
- Cache hit rate: >40% for repeated queries
- Cache miss penalty: <10ms
- Cache hit response: <100ms total (for complete query results)

---

## Performance Optimization for Local Ollama

### Challenge
Each LLM call to local Ollama (on RTX 4070) is slower than cloud APIs:
- Ollama completion: ~2-3s
- Cloud API (Claude/GPT-4): ~0.5-1s

### Optimizations

1. **Minimize LLM Calls**
   - Fast path: Only 1 LLM call (final response)
   - Complex path: 3-4 LLM calls maximum (route/decompose, HyDE, validate, response)
   - Background: Quality grading is async (non-blocking)

2. **Conditional Components**
   - HyDE only if complexity >6 (~30% of queries)
   - Decomposition only if complexity >7 (~20% of queries)
   - Tools only if needed (~10% of queries)
   - Validation only for complex path

3. **Caching Aggressively**
   - Cache all LLM-generated results
   - 40%+ hit rate = 40% fewer LLM calls

4. **Parallel Where Possible**
   - Embedding + BM25 search in parallel
   - Future: Multiple sub-queries in parallel

5. **Smart Truncation**
   - Avoid summarization LLM call when possible
   - Use score-based truncation first

### Target Latency
- Fast path: 3-5s (1 LLM call)
- Complex path: 8-12s (3-4 LLM calls)
- Overall average: ~5-7s (weighted by path distribution)

---

## Implementation Phases

### Phase 0: Planning & Documentation ✅
**Duration**: 30 minutes
**Deliverable**: This document

### Phase 1: QueryRouter
**Duration**: 2-2.5 hours
**Files**: 5 (index, Implementation, interfaces, types, prompts)
**Key**: Single component handles classification AND routing
**Validation**: Routes 70% to fast path, <500ms latency

### Phase 2: CacheManager
**Duration**: 1.5-2 hours
**Files**: 4 (index, Implementation, interfaces, types)
**Key**: In-memory Map, Redis-ready interface
**Validation**: >40% hit rate, <10ms retrieval

### Phase 3: QueryDecomposer (Simplified)
**Duration**: 1.5-2 hours
**Files**: 5
**Key**: Only called conditionally (~30% of queries)
**Validation**: Accurate sub-query generation, <2s

### Phase 4: QueryEnhancer (HyDE + Expansion)
**Duration**: 2.5-3 hours
**Files**: 5
**Key**: Combines HyDE and query expansion
**Validation**: +10-15% retrieval accuracy, <1.5s

### Phase 5: HybridSearchRetriever
**Duration**: 2.5-3 hours
**Files**: 5
**Key**: BM25 + Dense + Metadata filtering
**Validation**: +15% vs dense-only, <1s

### Phase 6: ContextWindowManager
**Duration**: 2 hours
**Files**: 5
**Key**: Smart truncation + summarization
**Validation**: Never exceeds limits, maintains quality

### Phase 7: RAGValidator (Enhanced)
**Duration**: 2-3 hours
**Files**: 5
**Key**: LLM-as-judge + citation tracking
**Validation**: >90% precision, <1.5s

### Phase 8: QualityGrader (Feedback Loop) ⭐
**Duration**: 3-3.5 hours
**Files**: 5
**Key**: Background async processing, multi-dimensional grading
**Validation**: Non-blocking, improves future searches

### Phase 9: ToolPlanner (Simplified)
**Duration**: 1.5-2 hours
**Files**: 5
**Key**: Conditional, scalable registry
**Validation**: Correct tool selection, <1s

### Phase 10: AdvancedPromptBuilder
**Duration**: 2 hours
**Files**: 5
**Key**: Chain-of-thought + citations
**Validation**: Improved answer quality, <300ms

### Phase 11: Integration - Dual Path
**Duration**: 4-5 hours
**Files**: Modify AgentOrchestratorImplementation.ts
**Key**: Fast path vs Complex path logic
**Validation**: Correct routing, performance targets met

### Phase 12: Testing & Validation
**Duration**: 3-4 hours
**Files**: ~15-20 test files
**Key**: Unit, integration, performance, quality tests
**Validation**: 80% coverage, all benchmarks met

---

## Success Metrics

### Performance Targets
- ✅ Fast path: 3-5s average (70% of queries)
- ✅ Complex path: 8-12s average (30% of queries)
- ✅ Overall average: 5-7s (30-40% improvement vs current)
- ✅ Cache hit rate: >40%
- ✅ Background processing: <5s per message (non-blocking)

### Quality Targets
- ✅ Query routing accuracy: >90%
- ✅ HyDE retrieval improvement: +10-15%
- ✅ Hybrid search improvement: +15% vs dense-only
- ✅ Context filtering precision: >90%
- ✅ Citation accuracy: >90%
- ✅ Quality grading average: >0.7

### Code Quality Targets
- ✅ TypeScript: 0 errors (strict mode)
- ✅ ESLint: 0 errors, 0 warnings
- ✅ Test coverage: ≥80%
- ✅ SOLID principles followed
- ✅ Inversify DI used throughout
- ✅ All files follow directory-based structure
- ✅ All methods use typed object parameters

---

## Risk Mitigation

### Risk: Routing errors (wrong path selection)
**Mitigation**: Extensive testing, logging, manual review of routing decisions

### Risk: Cache coherency issues
**Mitigation**: Short TTLs, user-scoped keys, clear invalidation logic

### Risk: Background queue memory leak
**Mitigation**: Max queue size, timeout processing, memory monitoring

### Risk: Context window truncation loses important info
**Mitigation**: Smart truncation prioritizes high-scoring contexts, summarization fallback

### Risk: Quality grading slows down system
**Mitigation**: Async processing, separate worker, no blocking on main path

### Risk: LLM latency too high
**Mitigation**: Caching, conditional components, fast path bypass

---

## Future Enhancements (Phase 2)

After this RAG system is proven, implement:

1. **AgenticStepPlanner** - Plan agent spawning + execution
2. **DockerAgentSpawner** - Spawn agent containers dynamically
3. **AgentPoolManager** - Manage agent lifecycle
4. **Multi-Agent Coordination** - Parallel sub-query processing
5. **Anthropic/OpenAI Providers** - Cloud LLM support
6. **Advanced Tool Registry** - Database-backed, dynamic discovery
7. **Redis Cache** - Distributed caching
8. **Self-RAG** - LLM validates own answers
9. **Streaming Responses** - Stream LLM output
10. **Cost Optimization** - Track and minimize API costs

---

## File Structure

```
src/_agents/_orchestration/AgentOrchestrator/
├── QueryRouter/
│   ├── index.ts
│   ├── QueryRouterImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── prompts.ts
├── CacheManager/
│   ├── index.ts
│   ├── CacheManagerImplementation.ts
│   ├── interfaces.ts
│   └── types.ts
├── QueryDecomposer/
│   ├── index.ts
│   ├── QueryDecomposerImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── prompts.ts
├── QueryEnhancer/
│   ├── index.ts
│   ├── QueryEnhancerImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── prompts.ts
├── HybridSearchRetriever/
│   ├── index.ts
│   ├── HybridSearchRetrieverImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── utils.ts (BM25 implementation)
├── ContextWindowManager/
│   ├── index.ts
│   ├── ContextWindowManagerImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── utils.ts
├── RAGValidator/
│   ├── index.ts
│   ├── RAGValidatorImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── prompts.ts
├── QualityGrader/
│   ├── index.ts
│   ├── QualityGraderImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── prompts.ts
├── ToolPlanner/
│   ├── index.ts
│   ├── ToolPlannerImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── prompts.ts
├── AdvancedPromptBuilder/
│   ├── index.ts
│   ├── AdvancedPromptBuilderImplementation.ts
│   ├── interfaces.ts
│   ├── types.ts
│   └── templates.ts
├── container.ts (Inversify setup)
├── AgentOrchestratorImplementation.ts (MAJOR REFACTOR)
├── interfaces.ts (updated)
├── types.ts (updated)
└── server.ts (minimal changes)
```

**Total Files**: ~55-60 new files + modifications

---

## Testing Strategy

### Unit Tests (80% coverage minimum)
- One test file per component
- Mock LLM responses for determinism
- Test happy path, edge cases, errors
- Performance assertions

### Integration Tests
- Fast path end-to-end
- Complex path end-to-end
- Cache hit/miss scenarios
- Queue processing
- Dual-path routing accuracy

### Performance Tests
- Latency benchmarks per component
- Overall path latency
- Cache performance
- Memory usage
- Concurrent query handling

### Quality Tests
- A/B comparison: new vs old system
- Retrieval accuracy measurements
- Citation accuracy validation
- Subjective answer quality assessment

### Manual Testing Script
```bash
# Setup
npm run docker:mvp
npm run cli

# Fast Path Tests
> Hello!
> What is 2+2?
> Tell me about Python

# Complex Path Tests
> Compare X and Y, then summarize
> What did we discuss last time and how does it relate to previous topics?

# Cache Tests
> What is 2+2? (first time, ~3-5s)
> What is 2+2? (cached, <100ms)

# Quality Grading
# Wait 5-10s, check logs for "Message graded and stored"
```

---

## Validation Protocol

**After EVERY file creation**:
```bash
npm run typecheck  # Must pass (0 errors)
npm run lint       # Must pass (0 errors, 0 warnings)
```

**After each Phase**:
1. Create all files
2. Run type/lint checks
3. Write unit tests
4. Run tests: `npm test`
5. Manual verification
6. Mark phase complete in todos

**Final Validation**:
```bash
npm run validate   # typecheck + lint + tests
npm run build      # Production build
docker-compose up  # Start services
npm run cli        # End-to-end testing
```

---

## Timeline

**Start Date**: 2025-10-22
**Estimated Completion**: 2025-10-25 or 2025-10-26
**Total Hours**: 28-36 hours
**Working Days**: 3.5-4.5 days

### Daily Breakdown (assuming 8-hour days)

**Day 1** (8 hours):
- Phase 1: QueryRouter (2.5h)
- Phase 2: CacheManager (2h)
- Phase 3: QueryDecomposer (2h)
- Phase 4: QueryEnhancer (start, 1.5h)

**Day 2** (8 hours):
- Phase 4: QueryEnhancer (finish, 1h)
- Phase 5: HybridSearchRetriever (2.5h)
- Phase 6: ContextWindowManager (2h)
- Phase 7: RAGValidator (start, 2.5h)

**Day 3** (8 hours):
- Phase 7: RAGValidator (finish, 0.5h)
- Phase 8: QualityGrader (3.5h)
- Phase 9: ToolPlanner (2h)
- Phase 10: AdvancedPromptBuilder (2h)

**Day 4** (8-12 hours):
- Phase 11: Integration (4-5h)
- Phase 12: Testing (3-4h)
- Buffer time for issues

---

## Approval & Sign-Off

**Plan Created**: 2025-10-22
**Plan Approved**: 2025-10-22
**Implementation Start**: 2025-10-22

**Approved By**: User
**Research Validated**: ✅
**Architecture Reviewed**: ✅
**Performance Targets Agreed**: ✅
**Timeline Accepted**: ✅

---

## Conclusion

This plan implements a production-ready, research-backed RAG system optimized for local Ollama deployment. The dual-path architecture ensures fast responses for simple queries while providing sophisticated reasoning for complex queries. The quality grading feedback loop ensures continuous improvement of retrieval quality.

**Key Innovation**: Most queries (70%) get 3-5s responses via fast path, while complex queries (30%) get full RAG treatment in 8-12s. Background quality grading improves future searches without impacting latency.

**Next Phase** (after completion): Agentic orchestration with Docker agent spawning, multi-agent coordination, and advanced provider support (Anthropic, OpenAI).

---

**Status**: ✅ Plan Documented, Ready for Implementation
