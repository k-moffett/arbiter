# Context System Implementation - Hybrid JSONL + Qdrant with MCP Integration

**Status**: Pending
**Created**: 2024-10-20
**Estimated Duration**: 7 weeks
**Type**: Major Feature Implementation

---

## Overview

### What
Implement a production-ready context system that tracks all agent interactions using:
- **Dual Storage**: JSONL (primary, streaming) + Qdrant (semantic via MCP tools)
- **Success/Failure Tracking**: User-defined tags and feedback for learning
- **Multi-Layer Caching**: L1 (memory) + L2 (embeddings) + L3 (retrieval results)
- **Queue-Based Processing**: BaseQueue abstraction with Redis backend
- **Request ID Hierarchy**: Full traceability including sub-agent sidechains
- **MCP Tool Integration**: All Qdrant access through MCP server tools

### Why
**Critical Need**: Agents currently have no conversational memory or learning capability. This system provides:
- ✅ **Conversational Awareness**: Remember past discussions across sessions
- ✅ **Success Learning**: Filter and retrieve only successful interactions
- ✅ **Sidechain Isolation**: Sub-agents maintain separate but linked context
- ✅ **Performance**: Multi-layer caching for <150ms total latency
- ✅ **Scalability**: Queue-based async processing with worker agents
- ✅ **Traceability**: Full request chains for debugging and monitoring

---

## Architecture Principles

### Core Decisions
1. **JSONL as Primary**: Fast, reliable, local writes. MUST succeed or fail.
2. **Qdrant as Secondary**: Semantic enhancement via MCP tools. Best-effort.
3. **MCP Tool Gateway**: No direct Qdrant access from agents.
4. **Hierarchical Request IDs**: `req_abc123.1.2` for sub-agent chains.
5. **Docker-First**: Everything runs in containers with shared volumes.

### Success Metrics
| Metric | Target |
|--------|--------|
| JSONL write latency | < 5ms |
| Qdrant write latency (via MCP) | < 200ms |
| L1 cache hit rate | > 80% |
| L2 semantic cache hit rate | > 60% |
| L3 retrieval cache hit rate | > 40% |
| Embedding queue size | < 100 |
| Request ID propagation | 100% |
| Overall system latency | < 150ms |

---

## Implementation Phases

### Week 1: MCP Tool Integration ⏳

**Status**: Pending
**Goal**: Create MCP tools for all Qdrant context operations

#### Tasks
- [ ] Define `vector_upsert_context` tool in MCP server
- [ ] Define `vector_search_context` tool in MCP server
- [ ] Define `get_request_context` tool in MCP server
- [ ] Create MCPClient wrapper for agent tool calls
- [ ] Test tool invocation from agent containers
- [ ] Update Qdrant collection schema with request ID indexes

#### Acceptance Criteria
- ✅ Agents can call context tools without direct Qdrant access
- ✅ Request ID properly indexed in Qdrant
- ✅ Tool calls complete in < 200ms
- ✅ Error handling returns clear messages

#### Checkpoints
- Day 2: Tool schemas defined and registered
- Day 4: MCPClient wrapper tested
- Day 5: End-to-end tool call working

---

### Week 2: Base Queue Infrastructure + Local JSONL ⏳

**Status**: Pending
**Goal**: Create reusable queue abstraction and local storage

#### Tasks
- [ ] Create `BaseQueue` abstract class in `src/_shared/_base/BaseQueue/`
- [ ] Create `InMemoryQueue` implementation (dev/testing)
- [ ] Create `RedisQueue` implementation with BullMQ wrapper
- [ ] Add Redis container to docker-compose.services.yml
- [ ] Create `JSONLStore` repository with agent namespacing
- [ ] Implement JSONL append, read, filter operations
- [ ] Configure volume mounts for context data
- [ ] Write unit tests for BaseQueue and JSONLStore

#### Acceptance Criteria
- ✅ BaseQueue abstraction follows project patterns
- ✅ RedisQueue persists jobs across container restarts
- ✅ JSONLStore writes to agent-specific files
- ✅ Volume mounts work across all agent containers
- ✅ Unit test coverage > 80%

#### Checkpoints
- Day 2: BaseQueue abstract class complete
- Day 4: Both queue implementations working
- Day 5: JSONLStore with volume mounts tested

---

### Week 3: Request ID Hierarchy for Sidechains ⏳

**Status**: Pending
**Goal**: Implement hierarchical request tracking for sub-agents

#### Tasks
- [ ] Create `RequestIdGenerator` utility class
- [ ] Update `ContextMessage` schema with parent/root fields
- [ ] Update JSONL schema to include request hierarchy
- [ ] Update Qdrant payload schema with request hierarchy
- [ ] Implement parent/child request linking
- [ ] Create request chain retrieval methods
- [ ] Test multi-level sidechain scenarios

#### Acceptance Criteria
- ✅ Request IDs follow format: `req_abc123.1.2`
- ✅ Sub-agents generate correct sidechain IDs
- ✅ Can retrieve entire request chain (parent + all sidechains)
- ✅ JSONL and Qdrant schemas aligned

#### Checkpoints
- Day 2: RequestIdGenerator with sidechain logic
- Day 3: Schemas updated in both storage layers
- Day 5: Multi-level sidechain test passing

---

### Week 4: Embedding Pipeline with Worker Agents ⏳

**Status**: Pending
**Goal**: Create async embedding queue with dedicated workers

#### Tasks
- [ ] Create `EmbeddingQueue` (extends BaseQueue)
- [ ] Create `EmbeddingService` with NLP enrichment
- [ ] Create `EmbeddingWorkerAgent` implementation
- [ ] Implement batch embedding optimization
- [ ] Implement priority-based dequeuing (critical > high > medium > low)
- [ ] Create Docker container for embedding workers
- [ ] Configure worker replicas (2-3 instances)
- [ ] Implement MCP tool calls from worker
- [ ] Create semantic cache (L2) for embedding reuse
- [ ] Write integration tests

#### Acceptance Criteria
- ✅ Workers process 50+ jobs/sec
- ✅ Priority queue orders correctly
- ✅ NLP enrichment includes tags, feedback, intent
- ✅ Workers call MCP tools (not direct Qdrant)
- ✅ Semantic cache reduces duplicate embeddings by 60%
- ✅ Multiple worker instances handle load

#### Checkpoints
- Day 2: EmbeddingQueue with priority logic
- Day 4: EmbeddingWorkerAgent with MCP integration
- Day 5: Workers deployed and processing queue

---

### Week 5: Sidechain Context Support ⏳

**Status**: Pending
**Goal**: Implement context isolation for sub-agent chains

#### Tasks
- [ ] Create `ContextManager` with dual-write logic
- [ ] Implement sidechain context isolation
- [ ] Implement success/failure marking with re-queuing
- [ ] Create context invalidation strategies
- [ ] Implement sub-agent spawning with sidechain IDs
- [ ] Create sidechain context retrieval
- [ ] Test complex multi-level agent hierarchies

#### Acceptance Criteria
- ✅ JSONL writes succeed or fail (synchronous)
- ✅ Qdrant writes are async/best-effort
- ✅ Sub-agents isolated from parent context
- ✅ Can retrieve full request chain
- ✅ Success marking triggers re-embedding with critical priority
- ✅ Sub-agents write to own JSONL namespace

#### Checkpoints
- Day 2: ContextManager with dual-write
- Day 3: Success/failure marking working
- Day 5: Sidechain isolation tested with 3-level hierarchy

---

### Week 6: Multi-Layer Caching + Agent Integration ⏳

**Status**: Pending
**Goal**: Implement caching layers and integrate with agents

#### Tasks
- [ ] Create `ContextCache` (L1 - memory, LRU)
- [ ] Create `SemanticCache` (L2 - embedding cache)
- [ ] Create `RetrievalCache` (L3 - query results)
- [ ] Implement cache invalidation strategies
- [ ] Create `ContextRetriever` with hybrid strategies
- [ ] Implement request-scoped filtering
- [ ] Implement success-only retrieval mode
- [ ] Update `AgentTaskParams` with requestId
- [ ] Integrate context system into agent execution
- [ ] Test end-to-end flow: request → context → response → storage

#### Acceptance Criteria
- ✅ L1 cache hit rate > 80%
- ✅ L2 cache hit rate > 60%
- ✅ L3 cache hit rate > 40%
- ✅ Cache invalidation works correctly
- ✅ Context retrieval completes in < 50ms
- ✅ Agents use requestId throughout execution
- ✅ End-to-end latency < 150ms

#### Checkpoints
- Day 2: All three cache layers implemented
- Day 4: ContextRetriever with strategies working
- Day 5: Full agent integration complete

---

### Week 7: Unit Tests & Monitoring ⏳

**Status**: Pending
**Goal**: Comprehensive testing and monitoring setup

#### Tasks
- [ ] Write unit tests for all queue implementations
- [ ] Write unit tests for all cache layers
- [ ] Write unit tests for JSONLStore operations
- [ ] Write integration tests for context manager
- [ ] Write integration tests for embedding pipeline
- [ ] Write integration tests for sidechain flows
- [ ] Write integration tests for MCP tool calls
- [ ] Create `ContextMetrics` monitoring
- [ ] Create `QueueMetrics` dashboard
- [ ] Add health check endpoints
- [ ] Load testing with 1000+ messages
- [ ] Performance benchmarking

#### Acceptance Criteria
- ✅ Unit test coverage > 80%
- ✅ Integration test coverage > 70%
- ✅ All performance targets met
- ✅ Monitoring dashboards functional
- ✅ Load test passes without failures
- ✅ Zero linting errors
- ✅ Zero TypeScript errors

#### Checkpoints
- Day 2: All unit tests written
- Day 4: Integration tests passing
- Day 5: Load testing complete, metrics verified

---

## Technical Architecture

### Data Flow: Write Path
```
User Message (Client)
    │
    ▼
MCP Server (generates requestId: req_abc123)
    │
    ▼
Agent Container (ENV: REQUEST_ID=req_abc123)
    │
    ├─────────────────┬────────────────────┐
    │                 │                    │
    ▼                 ▼                    ▼
JSONL Write      L1 Cache Update    Queue for Embedding
(Sync, MUST)     (Sync, MUST)      (Async, Best-Effort)
    │                 │                    │
    ▼                 ▼                    ▼
Volume Mount     In-Memory          Redis Queue
Agent-Specific   Request-Scoped     Priority: critical
                                         │
                                         ▼
                                 EmbeddingWorkerAgent
                                         │
                                         ▼
                                 MCP Tool: vector_upsert_context
                                         │
                                         ▼
                                    Qdrant Storage
```

### Data Flow: Read Path
```
Agent Request for Context
    │
    ▼
Check L3 Cache (retrieval results)
    │ (miss)
    ▼
ContextRetriever (determine strategy)
    │
    ├─────────────┬──────────────┬─────────────┐
    │             │              │             │
    ▼             ▼              ▼             ▼
JSONL        MCP Tool:      JSONL         L2 Cache
Recent       vector_search  Thread        (embeddings)
(last 20)    (semantic)     (parent)
    │             │              │             │
    └─────────────┴──────────────┴─────────────┘
                  │
                  ▼
         Assemble + Deduplicate
                  │
                  ▼
         Store in L3 Cache (1 min TTL)
                  │
                  ▼
         Return to Agent
```

### Request ID Hierarchy
```
Main Request: req_abc123
  ├─ QueryAgent processes
  │    └─ Spawns ResearchAgent: req_abc123.1
  │         └─ Spawns ValidationAgent: req_abc123.1.1
  └─ Spawns SynthesisAgent: req_abc123.2
```

---

## File Structure

### New Modules (65 files total)

**Base Infrastructure**:
```
src/_shared/_base/BaseQueue/
  ├── index.ts
  ├── BaseQueueImplementation.ts
  ├── interfaces.ts
  ├── types.ts
  └── enums.ts

src/_shared/_infrastructure/InMemoryQueue/
  ├── index.ts
  ├── InMemoryQueueImplementation.ts
  ├── interfaces.ts
  └── utils.ts

src/_shared/_infrastructure/RedisQueue/
  ├── index.ts
  ├── RedisQueueImplementation.ts
  ├── interfaces.ts
  ├── redisTypes.ts
  └── utils.ts

src/_shared/_infrastructure/QueueMetrics/
  ├── index.ts
  ├── QueueMetricsImplementation.ts
  └── interfaces.ts
```

**Data Layer**:
```
src/_data/_repositories/JSONLStore/
  ├── index.ts
  ├── JSONLStoreImplementation.ts
  ├── interfaces.ts
  ├── types.ts
  └── utils.ts

src/_data/_implementations/QdrantContextAdapter/
  ├── index.ts
  ├── QdrantContextAdapterImplementation.ts
  ├── interfaces.ts
  ├── qdrantTypes.ts
  └── utils.ts
```

**Context Layer**:
```
src/_agents/_context/ContextManager/
  ├── index.ts
  ├── ContextManagerImplementation.ts
  ├── interfaces.ts
  └── types.ts

src/_agents/_context/ContextRetriever/
  ├── index.ts
  ├── ContextRetrieverImplementation.ts
  ├── interfaces.ts
  ├── types.ts
  └── utils.ts

src/_agents/_context/EmbeddingQueue/
  ├── index.ts
  ├── EmbeddingQueueImplementation.ts
  ├── interfaces.ts
  ├── types.ts
  └── utils.ts

src/_agents/_context/EmbeddingService/
  ├── index.ts
  ├── EmbeddingServiceImplementation.ts
  ├── interfaces.ts
  └── utils.ts

src/_agents/_context/ContextCache/
  ├── index.ts
  ├── ContextCacheImplementation.ts
  └── interfaces.ts

src/_agents/_context/SemanticCache/
  ├── index.ts
  ├── SemanticCacheImplementation.ts
  └── interfaces.ts

src/_agents/_context/RetrievalCache/
  ├── index.ts
  ├── RetrievalCacheImplementation.ts
  └── interfaces.ts

src/_agents/_context/ContextMetrics/
  ├── index.ts
  ├── ContextMetricsImplementation.ts
  └── interfaces.ts

src/_agents/_context/RequestIdGenerator/
  ├── index.ts
  ├── RequestIdGeneratorImplementation.ts
  └── utils.ts
```

**Agent Workers**:
```
src/_agents/_types/EmbeddingWorkerAgent/
  ├── index.ts
  ├── EmbeddingWorkerAgentImplementation.ts
  ├── interfaces.ts
  └── types.ts
```

**MCP Integration**:
```
src/_agents/_shared/_lib/MCPClient/
  ├── index.ts
  ├── MCPClientImplementation.ts
  ├── interfaces.ts
  └── mcpTypes.ts
```

**Docker**:
```
docker/agents/Dockerfile.embedding-worker
```

---

## Risk Mitigation

### Risk 1: Qdrant Downtime
**Impact**: High (no semantic search)
**Mitigation**:
- JSONL remains functional (primary storage)
- Queue persists jobs in Redis
- System degrades gracefully
- Re-process queue when Qdrant recovers

### Risk 2: Embedding Queue Backup
**Impact**: Medium (slower semantic indexing)
**Mitigation**:
- Monitor queue depth (alert at 500)
- Scale workers horizontally (2 → 4)
- Implement batch size tuning
- Dead letter queue for failed jobs

### Risk 3: Cache Invalidation Bugs
**Impact**: Medium (stale context)
**Mitigation**:
- Short TTLs (1-5 minutes)
- Event-based invalidation on writes
- Cache versioning with request IDs
- Comprehensive integration tests

### Risk 4: Request ID Collisions
**Impact**: Low (context contamination)
**Mitigation**:
- UUID v4 (collision probability ~0)
- Validation on generation
- Monitoring for duplicates
- Unit tests for sidechain logic

### Risk 5: Volume Mount Performance
**Impact**: Medium (slow JSONL writes)
**Mitigation**:
- Use SSD-backed volumes
- Implement write buffering
- Monitor I/O latency
- Compaction for large files

---

## Rollback Plan

### Feature Flags
```bash
# Disable features if needed
ENABLE_QDRANT_WRITES=false
ENABLE_SEMANTIC_SEARCH=false
ENABLE_CONTEXT_CACHE=false
```

### Graceful Degradation
1. **Qdrant Disabled**: JSONL-only mode, no semantic search
2. **Queue Disabled**: Direct Qdrant writes (blocking)
3. **Cache Disabled**: Direct retrieval (slower)

### Rollback Procedure
1. Set feature flags in environment
2. Restart affected services
3. Verify JSONL still working
4. Monitor performance impact
5. Re-enable when ready

---

## Dependencies

### NPM Packages
- `ioredis@^5.3.2` - Redis client
- `bullmq@^5.1.0` - Queue management (wraps ioredis)
- `uuid@^9.0.0` - Request ID generation

### Docker Services
- Redis 7 (queue backend)
- Qdrant v1.7+ (vector DB)
- Ollama (embeddings)

---

## Progress Tracking

**Status Legend**: ⏳ Pending | 🔄 In Progress | ✅ Completed | ❌ Blocked

| Week | Phase | Status | Completion % |
|------|-------|--------|--------------|
| 1 | MCP Tool Integration | ⏳ Pending | 0% |
| 2 | Base Queue + JSONL | ⏳ Pending | 0% |
| 3 | Request ID Hierarchy | ⏳ Pending | 0% |
| 4 | Embedding Pipeline | ⏳ Pending | 0% |
| 5 | Sidechain Support | ⏳ Pending | 0% |
| 6 | Caching + Integration | ⏳ Pending | 0% |
| 7 | Unit Tests | ⏳ Pending | 0% |

**Overall Progress**: 0%

---

## Next Steps

1. **Immediate** (Week 1, Day 1):
   - Define MCP context tool schemas
   - Register tools in MCP server
   - Create MCPClient wrapper

2. **Short-term** (Week 1-2):
   - Complete MCP integration
   - Build BaseQueue abstraction
   - Set up Redis and JSONL storage

3. **Medium-term** (Week 3-5):
   - Implement request ID hierarchy
   - Build embedding pipeline
   - Add sidechain support

4. **Long-term** (Week 6-7):
   - Integrate caching
   - Full agent integration
   - Comprehensive testing

---

## References

- [ContextSystemImprovements.md](./.claude/aiContext/ContextSystemImprovements.md) - Original architecture doc
- [project-standards.md](./.claude/aiContext/codingStandards/typescript/project-standards.md) - Coding standards
- MCP Tool Specification: https://spec.modelcontextprotocol.io/
- BullMQ Documentation: https://docs.bullmq.io/

---

**Last Updated**: 2024-10-20
**Next Review**: End of Week 1 (2024-10-27)
