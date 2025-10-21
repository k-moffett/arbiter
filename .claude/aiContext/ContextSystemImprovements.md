# Context Storage Architecture: Hybrid JSONL + Qdrant

## Executive Summary

**Decision**: Implement hybrid storage combining JSONL (primary) for chronological data with Qdrant (semantic layer) for intelligent context retrieval.

**Rationale**: JSONL provides fast, reliable chronological storage. Qdrant enables semantic similarity search for enhanced AI context. Balance operational simplicity with advanced capabilities.

**Status**: Phase 1 (JSONL) implemented. Phase 2 (Qdrant semantic layer) ready for implementation.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CONTEXT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌─────────────────────┐       │
│  │  JSONL Storage   │         │  Qdrant Storage     │       │
│  │  (Primary)       │         │  (Semantic Layer)   │       │
│  └──────────────────┘         └─────────────────────┘       │
│         │                              │                     │
│         ├─ Session persistence         ├─ Message embeddings │
│         ├─ Recent messages (N=20)      ├─ Semantic search   │
│         ├─ Thread relationships        ├─ Similar contexts  │
│         ├─ Metadata (user/channel)     └─ Pattern detection │
│         └─ Chronological retrieval                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  Context Retrieval    │
              │  Strategy (Hybrid)    │
              └───────────────────────┘
                          │
        ┌─────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌───────────────┐                    ┌────────────────┐
│ Recent        │                    │ Relevant       │
│ (JSONL)       │                    │ (Qdrant)       │
│ - Last 20 msg │                    │ - Similar past │
│ - Thread flow │                    │ - Cross-thread │
└───────────────┘                    └────────────────┘
```

---

## Storage Layer Responsibilities

### JSONL Storage (Primary)
**Purpose**: Fast, reliable chronological storage

**Responsibilities**:
- Session persistence across restarts
- Recent message retrieval (last N messages)
- Thread relationship tracking (parent-child)
- User/channel metadata storage
- Chronological conversation flow

**Why Primary**: Simple, reliable, zero external dependencies, perfect for recent context.

### Qdrant Storage (Semantic Layer)
**Purpose**: Intelligent context discovery

**Responsibilities**:
- Message embedding storage
- Semantic similarity search
- Cross-conversation discovery
- Historical context retrieval
- Conversation pattern detection

**Why Secondary**: Enhances AI responses without replacing core functionality. Failure doesn't break system.

---

## Data Flow

### Write Path (Dual-Write)

```
User Message
    │
    ▼
┌─────────────────────┐
│ Context Layer       │
└─────────────────────┘
    │
    ├─────────────────┬────────────────────┐
    │                 │                    │
    ▼                 ▼                    ▼
┌──────────┐    ┌──────────┐      ┌──────────────┐
│ JSONL    │    │ In-Memory│      │ Qdrant Queue │
│ (Sync)   │    │ (Sync)   │      │ (Async)      │
│          │    │          │      │              │
│ Append   │    │ Update   │      │ Queue for    │
│ Required │    │ Cache    │      │ embedding    │
│ ✅ Must   │    │ ✅ Must   │      │ ⚠️ Best      │
│  succeed │    │  succeed │      │  effort      │
└──────────┘    └──────────┘      └──────────────┘
    │                 │                    │
    └─────────────────┴────────────────────┘
                      │
                      ▼
                ✅ Write Complete
```

**Key Principle**: JSONL write must succeed. Qdrant failure is logged but non-blocking.

### Read Path (Hybrid Retrieval)

```
AI Request for Context
    │
    ▼
┌─────────────────────────┐
│ Query Classifier        │
│ - Analyze intent        │
│ - Select strategy       │
└─────────────────────────┘
    │
    ├────────────────┬─────────────────┐
    │                │                 │
    ▼                ▼                 ▼
┌──────────┐   ┌──────────┐    ┌──────────┐
│ Recent   │   │ Semantic │    │ Thread   │
│ (JSONL)  │   │ (Qdrant) │    │ (JSONL)  │
│          │   │          │    │          │
│ Last N   │   │ Vector   │    │ Follow   │
│ Fast     │   │ search   │    │ parents  │
└──────────┘   └──────────┘    └──────────┘
    │                │                 │
    └────────────────┴─────────────────┘
                     │
                     ▼
          ┌──────────────────┐
          │ Context Assembler│
          │ - Deduplicate    │
          │ - Sort relevance │
          │ - Format for AI  │
          └──────────────────┘
                     │
                     ▼
              📤 Return Context
```

---

## Implementation Phases

### Phase 1: Current State ✅
**Status**: Implemented and operational

**Components**:
- JSONL file-based storage
- In-memory session cache
- Parent-child message tracking
- Auto-persistence with compaction

**No changes required** - this layer continues as-is.

---

### Phase 2: Add Qdrant Semantic Layer 🎯
**Status**: Ready for implementation

#### 2.1 Qdrant Collection Setup

**Collection**: `conversation-history`

**Vector Config**:
- Size: 768 dimensions (nomic-embed-text)
- Distance: Cosine similarity
- Storage: On-disk payload (optimize memory)

**Payload Schema**:
```
- id: unique message ID
- channelId, userId, guildId: for filtering
- timestamp: Unix timestamp
- content: original message
- threadId, parentMessageId: thread tracking
- gameSystem: "40k", "aos", etc.
- messageType: "user" | "bot"
- intentCategory: "rule_query", "unit_lookup", etc.
- embeddedText: text that was embedded
- sessionId, conversationTopic: session context
```

**Indexes** (for fast filtering):
- channelId (keyword)
- userId (keyword)
- timestamp (integer)
- gameSystem (keyword)

#### 2.2 Embedding Strategy

**What to Embed**:
- Core message content
- Conversation topic (if set)
- Game system context
- Intent category (if detected)
- Previous message context (optional, for continuity)

**Embedding Process**:
- Use Ollama nomic-embed-text (already running)
- Compose contextual text from message + metadata
- Batch process for efficiency (10 messages at a time)

#### 2.3 Dual-Write Implementation

**Primary Path** (JSONL - Synchronous):
1. Append to JSONL file
2. Update in-memory cache
3. Must succeed or throw error

**Secondary Path** (Qdrant - Asynchronous):
1. Queue message for embedding
2. Batch process queue (10 at a time)
3. Best-effort: log failures, don't block

**Failure Handling**:
- JSONL failure → Block operation, return error
- Qdrant failure → Log warning, continue operation

#### 2.4 Hybrid Retrieval Strategy

**Retrieval Components**:
1. **Recent Context** (JSONL): Last N chronological messages
2. **Semantic Context** (Qdrant): Similar historical messages
3. **Thread Context** (JSONL): Parent-child message walk

**Strategy Selection** (based on query type):

| Query Type | Recent Msgs | Semantic Msgs | Thread Walk | Time Window |
|------------|-------------|---------------|-------------|-------------|
| Continuation | 20 | 5 | Yes | 1 hour |
| New Topic | 5 | 10 | No | 1 week |
| Rule Clarification | 10 | 15 | Yes | All history |
| Quick Lookup | 5 | 3 | No | 24 hours |
| Default | 15 | 8 | Yes | 1 hour |

**Context Assembly**:
1. Fetch from all sources (parallel)
2. Deduplicate by message ID
3. Sort chronologically
4. Return assembled context with stats

---

### Phase 3: Backfill Historical Data 📅
**Status**: Future enhancement (not required for Phase 2)

**Purpose**: Embed existing JSONL messages for semantic search

**Approach**:
- Read historical messages from JSONL
- Process in batches (10 messages)
- Rate limit (1 second between batches)
- Run during low-traffic periods
- Track progress and errors

**Priority**: Low - system works without backfill. Semantic search only covers new messages initially.

---

## Query Pattern Examples

### Example 1: Recent Conversation
**Query**: "What were we just discussing?"

**Strategy**:
- Recent: 20 messages (heavy)
- Semantic: 0 messages (not needed)
- Thread: Yes (follow conversation)

**Sources**: JSONL only (fast chronological retrieval)

---

### Example 2: Historical Discussion
**Query**: "We talked about Tyranid tactics before, what did we decide?"

**Strategy**:
- Recent: 5 messages (light)
- Semantic: 15 messages (heavy)
- Thread: No (historical search)
- Time: All history

**Sources**:
- JSONL: Current state (5 messages)
- Qdrant: Semantic search for "Tyranid tactics"

**Qdrant Filter**:
- channelId = current channel
- gameSystem = "40k"
- Score threshold ≥ 0.7

---

### Example 3: Rule Clarification
**Query**: "How does the feel no pain rule work again?"

**Strategy**:
- Recent: 10 messages (context of why asking)
- Semantic: 20 messages (all rule discussions)
- Thread: Yes (current conversation)
- Time: All history

**Sources**:
- JSONL: Last 10 + thread messages
- Qdrant: All "feel no pain" discussions

---

## Performance Characteristics

### JSONL Layer
| Metric | Performance |
|--------|-------------|
| Write latency | ~1ms |
| Read latency (20 msgs) | ~5ms |
| Throughput | ~1000 msg/sec |
| Storage | ~500 bytes/msg |

**Bottleneck**: Disk I/O (SSD recommended)

### Qdrant Layer
| Metric | Performance |
|--------|-------------|
| Write latency | ~100-200ms (incl. embedding) |
| Read latency | ~20-100ms |
| Throughput | ~5-10 msg/sec (limited by embedding) |
| Storage | ~3.5KB/msg (vector + payload) |

**Bottleneck**: Embedding generation (optimize with batching)

---

## Configuration

### Environment Variables
```bash
# JSONL
CONTEXT_STORAGE_PATH=./data/context
CONTEXT_MAX_FILE_SIZE=10485760  # 10MB
CONTEXT_COMPACTION_INTERVAL=3600000  # 1 hour

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=conversation-history
QDRANT_VECTOR_SIZE=768

# Embedding
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=nomic-embed-text
EMBEDDING_BATCH_SIZE=10
EMBEDDING_QUEUE_MAX=1000

# Retrieval
CONTEXT_RECENT_MESSAGES=20
CONTEXT_SEMANTIC_MESSAGES=10
CONTEXT_SEMANTIC_THRESHOLD=0.7
CONTEXT_TIME_WINDOW=3600000  # 1 hour
```

---

## Implementation Checklist

### Phase 2 Tasks

#### Qdrant Setup
- [ ] Create `conversation-history` collection
- [ ] Configure vector dimensions (768)
- [ ] Create payload indexes
- [ ] Test basic upsert operations

#### Embedding Pipeline
- [ ] Implement embedding text composition
- [ ] Integrate Ollama embedding API
- [ ] Create async embedding queue
- [ ] Add batch processing logic
- [ ] Implement error handling and retry

#### Dual-Write Integration
- [ ] Modify message storage to queue for Qdrant
- [ ] Ensure JSONL remains synchronous
- [ ] Ensure Qdrant is asynchronous/best-effort
- [ ] Add embedding queue status logging

#### Hybrid Retrieval
- [ ] Implement hybrid context retriever
- [ ] Implement semantic search with filters
- [ ] Implement context assembly and deduplication
- [ ] Create query-based strategy selector

#### Agent Integration
- [ ] Update Agent to use hybrid retrieval
- [ ] Implement query classification
- [ ] Pass enriched context to AI
- [ ] Test end-to-end flow

#### Monitoring
- [ ] Add embedding queue metrics
- [ ] Add semantic search latency metrics
- [ ] Add context assembly metrics
- [ ] Create health dashboard

#### Testing
- [ ] Unit tests for embedding functions
- [ ] Unit tests for hybrid retrieval
- [ ] Integration tests for dual-write
- [ ] Integration tests for semantic search
- [ ] End-to-end conversation tests

#### Documentation
- [ ] Update Context Layer README
- [ ] Document configuration variables
- [ ] Create troubleshooting guide
- [ ] Add query strategy examples

---

## Success Metrics

### Performance Targets
| Metric | Target |
|--------|--------|
| JSONL write latency | < 5ms |
| Qdrant write latency | < 200ms |
| Embedding queue size | < 100 |
| Recent context latency | < 10ms |
| Semantic search latency | < 100ms |
| Context assembly latency | < 20ms |

### Quality Targets
| Metric | Target |
|--------|--------|
| Semantic search hit rate | > 70% (score ≥ 0.7) |
| Context relevance | > 80% (user satisfaction) |
| Deduplication rate | < 5% duplicates |
| Embedding success rate | > 95% |
| Qdrant uptime | > 99% |
| JSONL persistence | 100% |

---

## Troubleshooting

### Issue: Embedding Queue Backup
**Symptom**: Queue size growing over time

**Solutions**:
- Increase batch size (process more per batch)
- Decrease queue max (reject if full)
- Add more Ollama instances
- Temporarily disable Qdrant writes

### Issue: Slow Semantic Search
**Symptom**: Search latency > 200ms

**Solutions**:
- Add more payload indexes
- Reduce result limit
- Add time window filter
- Increase Qdrant memory

### Issue: Low Match Quality
**Symptom**: Search hit rate < 50%

**Solutions**:
- Improve embedding text composition
- Lower score threshold
- Use larger embedding model
- Backfill more historical data

---

## Rollback Plan

### Feature Flags
```bash
# Disable Qdrant features if needed
ENABLE_QDRANT_WRITES=false
ENABLE_SEMANTIC_SEARCH=false
```

### Graceful Degradation
- JSONL remains primary source of truth
- System continues functioning without Qdrant
- No data loss (Qdrant is supplementary)
- Can re-enable once issues resolved

### Rollback Procedure
1. Set feature flags to disable Qdrant
2. Restart application
3. Monitor system stability
4. JSONL-only retrieval continues working
5. Re-enable when ready

---

## Decision Rationale

### Why NOT Elasticsearch?

**Wrong Query Patterns**:
- Elasticsearch: Full-text search, aggregations, log analysis
- Our needs: Chronological retrieval + semantic similarity

**Operational Overhead**:
- Adds another service to manage
- Complex setup (Elasticsearch + Kibana)
- Overkill for conversation context

**Performance Mismatch**:
- JSONL append: ~1ms
- Elasticsearch index: ~10-50ms
- Recent messages faster with JSONL

**When to Reconsider**:
Only if we need:
- Cross-channel conversation search
- User behavior analytics
- Compliance/audit logging
- Multi-tenant analytics

None of these are current requirements.

---

### Why Qdrant Over Elasticsearch?

**Purpose-Built for Vectors**:
- Optimized for cosine similarity
- Efficient vector storage
- Fast approximate nearest neighbor search

**Already Deployed**:
- Using Qdrant for rules/units
- No new infrastructure needed
- Shared operational knowledge

**Better Semantic Search**:
- Natural language understanding
- Conversation similarity detection
- Cross-conversation discovery

**Simpler Integration**:
- Familiar API (already using for rules)
- Same team expertise
- Consistent architecture

---

### Why Hybrid Over Qdrant-Only?

**JSONL Strengths**:
- Simple and reliable
- Perfect for chronological data
- Zero external dependencies
- Fast recent context retrieval

**Qdrant Limitations**:
- Not optimized for recent messages
- Overkill for chronological retrieval
- Embedding costs for all messages
- Slower for "last N messages" queries

**Best of Both Worlds**:
- JSONL: Fast recent context (primary need)
- Qdrant: Smart historical discovery (enhancement)
- Simple base + powerful addition
- Graceful degradation if Qdrant fails

---

## Next Steps

### Immediate (Week 1)
1. Review architecture with team
2. Create feature branch
3. Set up Qdrant collection in dev
4. Implement embedding pipeline
5. Test basic embedding/storage

### Short-term (Week 2-3)
1. Implement dual-write integration
2. Implement hybrid retrieval
3. Add unit tests
4. Deploy to staging

### Medium-term (Week 4-6)
1. Integrate with Agent layer
2. Add monitoring and metrics
3. Run integration tests
4. Deploy to production with feature flags

### Long-term (Month 2+)
1. Monitor performance and satisfaction
2. Tune retrieval strategies
3. Implement historical backfill
4. Consider optimizations

---

## Conclusion

**Why This Works**:
1. ✅ Simple primary storage (JSONL) - reliable, fast
2. ✅ Advanced semantic layer (Qdrant) - enhances without replacing
3. ✅ Graceful degradation - works without Qdrant if needed
4. ✅ Clear migration path - phased, low-risk
5. ✅ Aligned with stack - already using Qdrant
6. ✅ Performance optimized - hybrid balances speed and quality

**Expected Impact**:
- 🎯 Better AI context awareness
- ⚡ Fast recent context retrieval
- 🧠 Smarter conversation continuity
- 🛡️ Reliable core functionality

This positions Cogitator for intelligent, context-aware interactions while maintaining operational simplicity.

# User-Facing Improvements: JSONL → Hybrid System

## Before (JSONL Only)
**Limited to Recent Memory**
- Bot only remembers last 20 messages in current conversation
- Cannot recall similar discussions from days/weeks ago
- No cross-conversation learning
- Context resets between sessions

**Example Interaction:**
```
User: "We discussed Tyranid tactics last week, what did we decide?"
Bot: "I don't have access to that conversation. Can you remind me?"
```

---

## After (Hybrid JSONL + Qdrant)
**Enhanced Conversational Intelligence**

### 1. **Historical Context Recall**
Bot can find and reference past relevant discussions automatically.

```
User: "We discussed Tyranid tactics last week, what did we decide?"
Bot: "Based on our conversation from last Tuesday, we concluded that 
     Genestealer-heavy lists work best for early pressure. You mentioned 
     using Hive Guard for backfield control..."
```

### 2. **Cross-Conversation Learning**
Bot connects related discussions across different sessions.

```
User: "How do I counter Death Guard?"
Bot: "We've discussed this before - three weeks ago you asked about 
     dealing with high toughness armies. The anti-tank weapons we 
     identified (meltas, lascannons) also work well against Death Guard..."
```

### 3. **Smarter Rule Clarifications**
Bot recalls when you've asked similar questions before.

```
User: "How does Feel No Pain work?"
Bot: "We covered this last month when building your Space Marine list. 
     Feel No Pain gives a 5+ save after damage is allocated..."
```

### 4. **Contextual Suggestions**
Bot proactively pulls relevant past context.

```
User: "Building a new Astra Militarum list"
Bot: "I remember you preferred mechanized builds in our previous 
     discussions. Should we focus on similar tactics with Chimeras 
     and Taurox?"
```

### 5. **Conversation Continuity**
Bot maintains context even after long breaks.

```
User: [Returns after 3 days] "So about that army list..."
Bot: "Continuing our discussion about your Death Guard list with 
     Mortarion. You were deciding between Plague Marines and 
     Terminators for troops..."
```

---

## Key Improvements Summary

| Feature | Before (JSONL) | After (Hybrid) |
|---------|----------------|----------------|
| **Memory Depth** | Last 20 messages only | Entire conversation history |
| **Context Awareness** | Current session only | All past relevant discussions |
| **Question Recall** | Cannot recall previous asks | Remembers past similar questions |
| **Learning** | No cross-session learning | Learns from all interactions |
| **Proactive Help** | Reactive only | Suggests based on history |
| **Continuity** | Resets between sessions | Maintains long-term context |

---

## The "Aha!" Moment

**Instead of treating each conversation as isolated, the bot now has "memory" of your entire relationship with it.**

It's like talking to someone who:
- ❌ **Before**: Has amnesia and only remembers the last 2 minutes
- ✅ **After**: Actually remembers your past conversations and references them naturally

**Bottom line**: The bot goes from feeling like a stateless chatbot to feeling like a knowledgeable assistant who's been working with you for months.
