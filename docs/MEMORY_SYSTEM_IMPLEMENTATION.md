# Memory System Implementation - MVP

## Status: TEMPORARY SOLUTION ⚠️

This document describes the **temporary fixes** implemented to prove the conversation memory system works. These changes are **MVP-level implementations** and need to be replaced with proper query decomposition, HyDE, and RAG principles.

---

## Problem Statement

The agent was not remembering conversations across CLI sessions. Investigation revealed **four critical bugs**:

1. **Zero Vector Search**: `handleVectorSearchContext` used `createZeroVector()` instead of actual query embeddings
2. **Empty Query String**: Orchestrator passed `query: ""` to MCP instead of the embedding vector
3. **Ephemeral userId**: Docker containers generated random MAC addresses on each run
4. **Session Isolation**: Each CLI run created a unique `sessionId`, preventing cross-session memory

---

## Temporary Fixes Implemented

### 1. Fixed Vector Search (Core Bug)

**File**: `src/_services/_mcpServer/ContextToolRegistry/utils.ts`

**Before**:
```typescript
const results = await qdrantClient.search({
  vector: createZeroVector(), // ❌ Wrong!
  // ...
});
```

**After**:
```typescript
const results = await qdrantClient.search({
  vector: queryVector, // ✅ Use actual embedding
  // ...
});
```

**Changes**:
- Updated `vector_search_context` tool schema to accept `queryVector: number[]`
- Changed primary filter from `sessionId` to `userId`
- Updated all interfaces to pass embedding vectors

### 2. Persistent userId for Docker

**File**: `src/_shared/utils/getUserId.ts` (NEW)

**Implementation**:
```typescript
// Detects Docker environment
const isDocker = existsSync('/.dockerenv');

if (isDocker) {
  // Store UUID in volume-mounted file
  const userIdPath = '/app/.arbiter/user_id';
  if (existsSync(userIdPath)) {
    return readFileSync(userIdPath, 'utf8').trim();
  }
  const userId = randomUUID();
  writeFileSync(userIdPath, userId);
  return userId;
}
// Host: use MAC address hash
```

**Docker Volume**:
```yaml
# docker-compose.cli.yml
volumes:
  - arbiter-cli-data:/app/.arbiter

volumes:
  arbiter-cli-data:
    driver: local
```

**Dockerfile**:
```dockerfile
# Create directory with correct permissions
RUN mkdir -p /app/.arbiter && chown nodejs:nodejs /app/.arbiter
```

### 3. Hybrid Search Strategy (TEMPORARY)

**File**: `src/_agents/_orchestration/AgentOrchestrator/AgentOrchestratorImplementation.ts`

**Current Implementation**:
```typescript
private async searchRelevantContext(params: {
  queryEmbedding: number[];
  userId: string;
}): Promise<ContextSearchResult[]> {
  // Get top 20 semantic results
  const semanticResults = await this.mcpClient.searchContext({
    limit: 20,
    queryVector: params.queryEmbedding,
    userId: params.userId,
  });

  // Sort by timestamp
  const sortedByTime = [...results].sort(
    (a, b) => b.payload.timestamp - a.payload.timestamp
  );

  // Hybrid: 60% recent (6 messages) + 40% semantic (4 messages)
  const recentResults = sortedByTime.slice(0, 6);
  const semanticOnlyResults = results.slice(0, 4);

  // Merge, deduplicate, sort chronologically
  return merged.sort((a, b) => a.payload.timestamp - b.payload.timestamp);
}
```

**Why This is Temporary**:
- Simple weighted average is not intelligent
- No query analysis or intent detection
- No HyDE (Hypothetical Document Embeddings)
- No query decomposition for complex questions

### 4. Improved Prompt Engineering (TEMPORARY)

**File**: Same as above

**Current Prompt**:
```typescript
private buildPromptWithContext(params: {
  context: ContextSearchResult[];
  query: string;
}): string {
  let prompt = 'You are a helpful AI assistant. ';

  if (params.context.length > 0) {
    prompt += 'Below is relevant conversation history for context. ' +
              'Use it ONLY if relevant to the current question. ' +
              'If the current question is about a new topic, answer it directly.\n\n';
    prompt += 'Previous conversation:\n';
    // ... add context
  }

  prompt += `Current question: ${params.query}\n`;
  return prompt;
}
```

**Why This is Temporary**:
- Basic instruction without reasoning chain
- No RAG (Retrieval Augmented Generation) principles
- No context validation or relevance scoring
- No dynamic prompt adjustment based on query type

---

## Files Modified

### Core Fix - Vector Search
- `src/_services/_mcpServer/ContextToolRegistry/consts.ts` - Updated tool schema
- `src/_services/_mcpServer/ContextToolRegistry/types.ts` - Added queryVector, userId types
- `src/_services/_mcpServer/ContextToolRegistry/utils.ts` - Fixed zero vector bug
- `src/_agents/_shared/_lib/MCPClient/interfaces.ts` - Updated interface
- `src/_agents/_shared/_lib/MCPClient/MCPClientImplementation.ts` - Pass queryVector

### Persistent userId
- `src/_shared/utils/getUserId.ts` - **NEW** - Device-based ID generation
- `docker-compose.cli.yml` - Added volume for persistence
- `docker/clients/Dockerfile.cli` - Create .arbiter directory

### Agent Orchestrator
- `src/_agents/_orchestration/AgentOrchestrator/interfaces.ts` - Added userId param
- `src/_agents/_orchestration/AgentOrchestrator/AgentOrchestratorImplementation.ts` - Hybrid search + logging
- `src/_agents/_orchestration/AgentOrchestrator/server.ts` - Accept userId in API

### CLI Integration
- `src/_clients/cli/cli.ts` - Call getUserId()
- `src/_clients/cli/types.ts` - Add userId to config
- `src/_clients/cli/CLIServiceImplementation.ts` - Store userId in session
- `src/_clients/ChatService/ChatServiceImplementation.ts` - Extract and pass userId

### HTTP Client
- `src/_agents/_orchestration/AgentOrchestratorClient/AgentOrchestratorClientImplementation.ts` - Pass userId

---

## Testing Results

### ✅ What Works Now

1. **Cross-Session Memory**:
   ```bash
   npm run cli
   > Tell me about quantum computing
   > exit

   npm run cli
   > What did we discuss last time?
   # ✅ Remembers quantum computing
   ```

2. **Persistent userId**:
   - Same userId across multiple CLI runs
   - Volume persists across container restarts

3. **Hybrid Search**:
   - Temporal queries ("last time") find recent conversations
   - Topic queries ("about quantum") find semantically relevant ones

### ⚠️ Known Limitations

1. **No Query Analysis**:
   - Doesn't detect query intent (temporal vs semantic vs hybrid)
   - Simple 60/40 split regardless of question type

2. **No Validation**:
   - Doesn't verify retrieved context is actually relevant
   - No confidence scoring
   - No fallback strategies

3. **Basic Prompting**:
   - No reasoning chain
   - No chain-of-thought
   - No RAG validation step

4. **No Query Decomposition**:
   - Complex questions aren't broken down
   - Multi-part queries treated as single unit

---

## Next Steps: Proper Implementation

### Phase 1: Query Decomposition & Analysis

**File**: `src/_agents/_orchestration/AgentOrchestrator/QueryDecomposer/`

**Goals**:
- Detect query intent (temporal, semantic, hybrid, factual)
- Break complex questions into sub-queries
- Identify required context types (recent, historical, semantic)

**Example**:
```typescript
interface QueryAnalysis {
  intent: 'temporal' | 'semantic' | 'hybrid' | 'factual';
  temporalScope?: 'last_message' | 'recent' | 'session' | 'all_time';
  topics: string[];
  subQueries?: string[];
  requiresContext: boolean;
}

async analyzeQuery(query: string): Promise<QueryAnalysis>
```

### Phase 2: HyDE (Hypothetical Document Embeddings)

**Reference**: [HyDE Paper](https://arxiv.org/abs/2212.10496)

**Implementation**:
```typescript
async generateHypotheticalResponse(query: string): Promise<string> {
  // Generate ideal hypothetical answer
  const hypothetical = await llm.complete({
    prompt: `Generate a detailed answer to: ${query}`,
  });

  // Embed the hypothetical answer
  const embedding = await embed(hypothetical);

  // Search using hypothetical embedding (better than query embedding)
  return embedding;
}
```

**Why HyDE is Better**:
- Query embeddings are often too short/vague
- Hypothetical answers are in the same "space" as actual answers
- Significantly improves retrieval accuracy

### Phase 3: RAG Validation & Scoring

**File**: `src/_agents/_orchestration/AgentOrchestrator/RAGValidator/`

**Goals**:
- Score retrieved context relevance
- Filter out irrelevant context
- Re-rank based on multiple factors (recency + relevance + confidence)

**Example**:
```typescript
interface ContextScore {
  relevanceScore: number;    // 0-1: Semantic similarity
  recencyScore: number;      // 0-1: Time decay
  confidenceScore: number;   // 0-1: Retrieval confidence
  finalScore: number;        // Weighted combination
}

async validateAndScore(
  query: string,
  context: ContextSearchResult[]
): Promise<ScoredContext[]>
```

### Phase 4: Dual Context Strategy

**Current** (Temporary):
- Simple 60/40 split

**Proper Implementation**:
```typescript
interface ContextStrategy {
  recentCount: number;      // Determined by query analysis
  semanticCount: number;    // Determined by query analysis
  minRelevanceScore: number;
  timeDecayFactor: number;
}

async getDualContext(
  query: QueryAnalysis,
  embedding: number[]
): Promise<{
  recentContext: ContextSearchResult[];
  semanticContext: ContextSearchResult[];
  strategy: ContextStrategy;
}>
```

### Phase 5: Advanced Prompting

**Implement**:
1. **Chain-of-Thought**: Let LLM reason through context
2. **Self-Reflection**: Ask LLM to verify context relevance
3. **Confidence Estimation**: LLM reports answer confidence
4. **Source Attribution**: Clear citation of which context was used

**Example**:
```typescript
const prompt = `
You are a helpful AI assistant with access to conversation history.

# Task
Answer the user's question using the provided context if relevant.

# Context Evaluation
First, evaluate if the provided context is relevant:
1. Does it relate to the current question?
2. Is it recent enough to be useful?
3. Rate relevance: 0-10

# Context
${contextMessages}

# Current Question
${query}

# Your Response
Step 1: Evaluate context relevance
Step 2: Answer the question
Step 3: Cite which context you used (if any)
`;
```

### Phase 6: Agent Spawning Architecture

**Future** (Post-MVP):
- Docker agent spawning for sub-queries
- Parallel processing of decomposed queries
- Agent pool management
- Result aggregation

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Query                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    Query Decomposer           │ ◄── NEXT: Implement
         │  - Analyze intent             │
         │  - Break into sub-queries     │
         │  - Determine context needs    │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    HyDE Generator             │ ◄── NEXT: Implement
         │  - Generate hypothetical ans  │
         │  - Embed hypothetical         │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Hybrid Search (CURRENT)      │ ◄── TEMPORARY
         │  - 60% recent                 │
         │  - 40% semantic               │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    RAG Validator              │ ◄── NEXT: Implement
         │  - Score relevance            │
         │  - Filter & re-rank           │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Prompt Builder (CURRENT)     │ ◄── TEMPORARY
         │  - Basic context injection    │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    LLM Response               │
         └───────────────────────────────┘
```

---

## Performance Considerations

### Current Performance
- Average query time: ~5-10 seconds
- Context retrieval: ~200-500ms
- Embedding generation: ~100-300ms
- LLM generation: 4-9 seconds

### Future Optimizations
1. **Caching**: Cache embeddings for common queries
2. **Parallel Processing**: Generate embeddings + retrieve context simultaneously
3. **Agent Spawning**: Parallel sub-query processing
4. **Streaming**: Stream LLM responses while processing

---

## References

### Papers to Implement
1. **HyDE**: [Precise Zero-Shot Dense Retrieval without Relevance Labels](https://arxiv.org/abs/2212.10496)
2. **RAG**: [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
3. **Query Decomposition**: [Answering Complex Questions via Query Decomposition](https://arxiv.org/abs/2010.12527)

### Tools to Consider
- **LangChain**: Query decomposition & RAG patterns
- **LlamaIndex**: Context retrieval & ranking
- **Qdrant**: Advanced filtering & hybrid search

---

## Migration Path

### Step 1: Implement Query Decomposer (Week 1-2)
- Create QueryDecomposer interface
- Implement intent detection
- Add sub-query generation
- Test with various query types

### Step 2: Implement HyDE (Week 2-3)
- Add HyDE embedding generation
- Compare performance vs direct query embedding
- A/B test retrieval accuracy

### Step 3: Implement RAG Validator (Week 3-4)
- Create context scoring system
- Implement filtering & re-ranking
- Add confidence thresholds

### Step 4: Advanced Prompting (Week 4-5)
- Implement chain-of-thought
- Add self-reflection
- Improve context usage

### Step 5: Agent Spawning (Week 6+)
- Docker agent spawning
- Parallel query processing
- Result aggregation

---

## Success Metrics

### Current MVP
- ✅ Cross-session memory works
- ✅ Persistent userId
- ✅ Basic temporal + semantic search

### Target (Proper Implementation)
- 🎯 95%+ retrieval accuracy
- 🎯 <2s average query time
- 🎯 Proper query decomposition for complex questions
- 🎯 Validated context with confidence scores
- 🎯 Agent spawning for parallel processing

---

## Conclusion

The current implementation is a **proof of concept** that demonstrates:
1. The architecture is sound
2. Cross-session memory is achievable
3. Vector search + context retrieval works

However, this is **not production-ready**. The next phase requires proper implementation of:
- Query decomposition & analysis
- HyDE embeddings
- RAG validation & scoring
- Advanced prompting techniques

**Timeline**: 6-8 weeks for full proper implementation

---

**Last Updated**: 2025-10-22
**Author**: Claude Code
**Status**: MVP Complete - Awaiting Proper Implementation
