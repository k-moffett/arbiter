# ARB-002: Context System Foundation

**Status**: 🔶 READY
**Priority**: P0 - Blocker
**Epic**: ARB-EPIC-001
**Effort**: 25-30 hours
**Assignee**: @kmoffett

---

## Description

Build the core context system incorporating modern RAG patterns: HyDE (Hypothetical Document Embeddings), query decomposition, step-back prompting, and intelligent context management. This is the **foundation** of Arbiter and the most critical component to get right.

---

## Goals

1. Implement HyDE for better retrieval
2. Build query decomposition for complex multi-hop queries
3. Add step-back prompting for conceptual understanding
4. Create robust context memory management
5. Validate all patterns work together

---

## Acceptance Criteria

### Must Have

- [ ] **HyDE Engine** implemented and working
  - [ ] Generate hypothetical answers from queries
  - [ ] Embed hypothetical answers using Ollama
  - [ ] Search with hypothetical embeddings
  - [ ] Fallback to standard search if HyDE fails

- [ ] **Query Decomposition** for complex queries
  - [ ] Classify query types (simple, comparative, multi-hop, list-building)
  - [ ] Decompose complex queries into atomic sub-queries
  - [ ] Generate execution plans (parallel vs sequential)
  - [ ] Handle dependencies between sub-queries

- [ ] **Step-Back Prompting** for conceptual queries
  - [ ] Generate high-level step-back questions
  - [ ] Execute step-back retrieval first
  - [ ] Use step-back context for main query

- [ ] **Context Memory Manager**
  - [ ] Short-term session context (in-memory)
  - [ ] Long-term persistent context (JSONL)
  - [ ] Message storage with parent-child relationships
  - [ ] Reference resolution (pronouns, "it", "that", etc.)
  - [ ] Temporal relevance scoring

- [ ] **Integration Tests**
  - [ ] Test HyDE with 10+ sample queries
  - [ ] Test query decomposition with complex queries
  - [ ] Test context persistence and retrieval
  - [ ] End-to-end test: query → context → result

### Should Have

- [ ] Context compaction strategies (remove old messages)
- [ ] Semantic similarity search for context recall
- [ ] Query expansion for better decomposition

### Nice to Have

- [ ] Adaptive HyDE (learn when to use HyDE vs standard search)
- [ ] Query rewriting for better results
- [ ] Multi-turn conversation tracking

---

## Implementation Plan

### Phase 1: HyDE Engine (8-10 hours)

**Files to Create**:
```
src/engine/context/
├── HyDEEngine.ts
├── HypotheticalGenerator.ts
└── interfaces/
    └── IHyDEEngine.ts
```

**Implementation Steps**:

1. **Create IHyDEEngine interface**
```typescript
interface IHyDEEngine {
  generateHypothetical(query: string, domain: string): Promise<string>;
  embedHypothetical(hypothetical: string): Promise<number[]>;
  searchWithHyDE(
    query: string,
    collection: string,
    filters?: Record<string, unknown>
  ): Promise<SearchResult[]>;
  shouldUseHyDE(query: string): boolean;
}
```

2. **Implement HypotheticalGenerator**
   - Use Anthropic Claude to generate hypothetical answers
   - Prompt: "Given this question, write a detailed, factual answer as if you had the information"
   - Temperature: 0.7 (creative but not too random)
   - Max tokens: 500-800

3. **Integrate with Vector DB**
   - Reuse `OllamaEmbeddingService` from Cogitator
   - Reuse `QdrantVectorRepository` from Cogitator
   - Embed hypothetical answer
   - Search vector DB with embedding

4. **Add Fallback Logic**
   - If HyDE fails (LLM error, embedding error), fall back to standard search
   - Log fallback events for analysis

**Testing**:
- Test with vague queries: "What can a terminator do?"
- Test with specific queries: "What is the toughness of a terminator?"
- Verify HyDE improves retrieval for vague queries
- Verify standard search is sufficient for specific queries

---

### Phase 2: Query Decomposition (10-12 hours)

**Files to Create**:
```
src/engine/context/
├── QueryDecomposer.ts
├── QueryClassifier.ts
├── ExecutionPlanner.ts
└── interfaces/
    ├── IQueryDecomposer.ts
    └── IDecomposedQuery.ts
```

**Implementation Steps**:

1. **Create Query Classifier**
```typescript
enum QueryType {
  SIMPLE_LOOKUP = 'simple_lookup',
  PROCEDURAL = 'procedural',
  COMPARATIVE = 'comparative',
  MULTI_HOP = 'multi_hop',
  LIST_BUILDING = 'list_building',
  CONVERSATIONAL = 'conversational'
}

interface IQueryClassifier {
  classify(query: string): Promise<QueryType>;
}
```

   - Use LLM (Anthropic or local) to classify query
   - Provide examples for each type in prompt
   - Return confidence score with classification

2. **Implement QueryDecomposer**
```typescript
interface IDecomposedQuery {
  originalQuery: string;
  queryType: QueryType;
  subQueries: SubQuery[];
  executionPlan: ExecutionPlan;
  synthesisRequired: boolean;
  synthesisPrompt?: string;
  extractedEntities: string[];
}

interface SubQuery {
  id: string;
  query: string;
  suggestedTool: string;
  dependencies: string[];  // IDs of sub-queries this depends on
  priority: number;
}
```

   - For `SIMPLE_LOOKUP`: Return single sub-query (no decomposition)
   - For `COMPARATIVE`: Decompose into N lookups + 1 comparison
   - For `MULTI_HOP`: Decompose into chain of reasoning steps
   - For `LIST_BUILDING`: Decompose into constraints → selection → validation

3. **Build ExecutionPlanner**
```typescript
interface ExecutionPlan {
  stages: ExecutionStage[];
  totalSteps: number;
  estimatedDuration: number;
}

interface ExecutionStage {
  stageId: number;
  subQueries: SubQuery[];
  executionMode: 'parallel' | 'sequential';
}
```

   - Group sub-queries into stages
   - Stage N can only execute after Stage N-1 completes
   - Within a stage, independent queries execute in parallel

4. **Add Entity Extraction**
   - Extract key entities from query (units, weapons, factions, etc.)
   - Use for filtering and relevance checking
   - Can reuse patterns from Cogitator's `EntityExtractor.ts`

**Testing**:
- Simple: "What is a terminator's toughness?" → Single query
- Comparative: "Terminator vs Dreadnought" → 2 lookups + comparison
- Multi-hop: "Can my terminators with storm shields deep strike turn 1?" → 3+ queries
- List-building: "Build a 2000pt list" → Constraints + selection + validation

---

### Phase 3: Step-Back Prompting (3-4 hours)

**Files to Create**:
```
src/engine/context/
├── StepBackEngine.ts
└── interfaces/
    └── IStepBackEngine.ts
```

**Implementation Steps**:

1. **Create IStepBackEngine interface**
```typescript
interface IStepBackEngine {
  generateStepBack(query: string): Promise<string>;
  executeWithStepBack(
    query: string,
    collection: string
  ): Promise<StepBackResult>;
  shouldUseStepBack(query: string): boolean;
}

interface StepBackResult {
  stepBackQuery: string;
  stepBackResults: SearchResult[];
  mainResults: SearchResult[];
  combinedContext: string;
}
```

2. **Implement Step-Back Generation**
   - Use LLM to generate high-level conceptual question
   - Prompt: "What is the high-level concept behind this specific question?"
   - Example:
     - Original: "Can terminators deep strike turn 1?"
     - Step-back: "What are the universal deep strike rules?"

3. **Execute Step-Back + Main Query**
   - Execute step-back query first → get conceptual context
   - Execute main query → get specific answer
   - Combine both contexts for better synthesis

4. **Add Heuristics for When to Use**
   - Use step-back for rule questions
   - Use step-back for "why" questions
   - Skip step-back for simple stat lookups

**Testing**:
- Rule questions: "Can I do X?" → Step-back to general rules
- Why questions: "Why is unit X good?" → Step-back to role/purpose
- Stat lookups: "What is X's toughness?" → No step-back needed

---

### Phase 4: Context Memory Manager (5-6 hours)

**Files to Copy from Cogitator**:
```
src/vector/storage/JsonlStorage.ts  → src/engine/context/storage/JsonlStorage.ts
```

**Files to Create**:
```
src/engine/context/
├── ContextMemoryManager.ts
├── SessionManager.ts
├── ReferenceResolver.ts
└── interfaces/
    ├── IContextMemoryManager.ts
    ├── IMessage.ts
    └── IInsight.ts
```

**Implementation Steps**:

1. **Create Message & Insight Types**
```typescript
interface IMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  parentId?: string;
  metadata: {
    toolsUsed?: string[];
    confidence?: number;
    validated?: boolean;
    queryType?: QueryType;
  };
}

interface IInsight {
  id: string;
  summary: string;
  fullContext: string;
  timestamp: Date;
  usageCount: number;
  lastAccessed: Date;
  relevanceScore: number;
}
```

2. **Implement SessionManager**
   - Create/resume sessions
   - Store session metadata
   - Session expiration (30 days default)

3. **Implement ContextMemoryManager**
```typescript
interface IContextMemoryManager {
  // Short-term (session)
  saveMessage(message: IMessage): Promise<void>;
  getRecentMessages(sessionId: string, limit: number): Promise<IMessage[]>;
  getConversationThread(messageId: string): Promise<IMessage[]>;

  // Long-term (persistent)
  saveInsight(insight: IInsight): Promise<void>;
  recallSimilar(query: string, limit: number): Promise<IInsight[]>;

  // Reference resolution
  resolveReference(query: string, sessionId: string): Promise<IMessage[]>;
}
```

4. **Implement ReferenceResolver**
   - Detect references: "it", "that", "the previous one", "what you said"
   - Resolve to specific messages in conversation history
   - Use patterns from Cogitator's `ReferenceResolver.ts` (good foundation)
   - Enhance with semantic search for "tell me more about that"

5. **Add Temporal Relevance Scoring**
   - Recent messages have higher relevance
   - Decay function: `score = base_score * exp(-age_in_hours / decay_constant)`
   - Default decay constant: 24 hours (relevance halves every day)

**Testing**:
- Save and retrieve messages
- Test reference resolution: "What did you just say?"
- Test session persistence across restarts
- Test temporal relevance (recent messages score higher)

---

### Phase 5: Integration & Testing (3-4 hours)

**Files to Create**:
```
test/integration/context/
├── hyde.integration.test.ts
├── query-decomposition.integration.test.ts
├── step-back.integration.test.ts
├── context-memory.integration.test.ts
└── end-to-end.integration.test.ts
```

**Test Scenarios**:

1. **HyDE Integration**
   - Vague query with HyDE vs without
   - Verify HyDE improves retrieval quality
   - Verify fallback works if HyDE fails

2. **Query Decomposition**
   - Complex query → verify correct decomposition
   - Verify sub-queries execute in correct order
   - Verify synthesis combines results correctly

3. **Step-Back Prompting**
   - Rule question → verify step-back query generated
   - Verify conceptual context improves answer

4. **Context Memory**
   - Multi-turn conversation → verify context persists
   - Reference resolution → verify "it" resolves correctly
   - Session resumption → verify context reloads

5. **End-to-End**
   - User query → HyDE → Decomposition → Execution → Result
   - Verify all components work together
   - Verify performance <5 seconds for simple queries

---

## Technical Details

### Reusable Components from Cogitator

**Direct Copy (No Changes)**:
- `src/vector/services/implementations/OllamaEmbeddingService.ts`
- `src/vector/repositories/implementations/QdrantVectorRepository.ts`
- `src/vector/storage/JsonlStorage.ts`
- `src/shared/logger/`

**Reference Patterns (Don't Copy Code)**:
- `src/agent/services/context/ReferenceResolver.ts` - Good reference patterns
- `src/context/strategies/` - Context selection ideas
- `src/agent/processors/RequestProcessor.ts` - Session management concepts

### New Dependencies

None (all dependencies in base repo from ARB-001)

### Configuration

**Environment Variables**:
```bash
# Context System
CONTEXT_STORAGE_PATH=./data/contexts
CONTEXT_SESSION_EXPIRY_DAYS=30
CONTEXT_MAX_MESSAGES=100

# HyDE
HYDE_ENABLED=true
HYDE_TEMPERATURE=0.7
HYDE_MAX_TOKENS=800
HYDE_FALLBACK_TO_STANDARD=true

# Query Decomposition
DECOMPOSE_COMPLEX_QUERIES=true
MAX_SUB_QUERIES=10

# Step-Back
STEP_BACK_ENABLED=true
```

---

## Risks & Mitigations

### Risk: Complexity Overload
**Mitigation**: Build incrementally. HyDE → Decomposition → Step-Back → Memory. Test each phase independently.

### Risk: HyDE Degrades Simple Queries
**Mitigation**: Add heuristics for when to use HyDE vs standard search. Start conservative (only for vague queries).

### Risk: Query Decomposition Fails
**Mitigation**: Always have fallback to simple query. Log decomposition failures for analysis.

### Risk: Performance Degradation
**Mitigation**: Set timeouts. If decomposition takes >2 seconds, fall back to simple query.

---

## Success Metrics

- [ ] HyDE improves retrieval for vague queries (measured by relevance score)
- [ ] Query decomposition correctly handles 90%+ of test cases
- [ ] Step-back provides useful context for conceptual queries
- [ ] Context memory persists across sessions
- [ ] Reference resolution works for common patterns
- [ ] End-to-end flow completes in <5 seconds for simple queries

---

## Dependencies

- **Blockers**: ARB-001 (Base Repo Setup) - ✅ Complete
- **Nice to Have**: ARB-005 (MCP Server) - Can develop context system independently

---

## Follow-up Tasks

After completion:
- ARB-003: Tool Planning Engine (uses context system)
- ARB-004: Self-RAG Validation (uses context system)

---

## Notes

- This is the **most important ticket** in the epic
- Take time to get this right - don't rush
- Test thoroughly at each phase
- Document any deviations from the plan
- If a pattern doesn't work, iterate - don't force it

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for Development
