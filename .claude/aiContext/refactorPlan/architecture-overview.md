# Arbiter Architecture Overview

**Version**: 1.0 (Foundation Design)
**Last Updated**: 2025-10-20
**Status**: Design → Implementation

---

## Executive Summary

Arbiter is a next-generation RAG (Retrieval-Augmented Generation) assistant built on modern research patterns including HyDE, Self-RAG, and intelligent tool planning. Unlike traditional RAG systems, Arbiter validates every answer, supports complex multi-hop reasoning, and provides source provenance for all claims.

**Key Differentiators:**
- ✅ Self-validating answers with hallucination detection
- ✅ Multi-hop query decomposition for complex questions
- ✅ Intelligent tool planning with adaptive routing
- ✅ Pluggable domain architecture (not IP-locked)
- ✅ MCP server model for multi-client support

---

## System Architecture

### High-Level View

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Discord Bot  │  │  Slack Bot   │  │   CLI Tool   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │             │
│         └─────────────────────────────────────┘             │
└────────────────────────────┬────────────────────────────────┘
                             │ MCP Protocol (stdio/HTTP)
┌────────────────────────────▼────────────────────────────────┐
│                  Arbiter MCP Server                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Query Processing Pipeline               │  │
│  │                                                      │  │
│  │  User Query                                          │  │
│  │      ↓                                               │  │
│  │  [1] Context Engine (HyDE, Decomposition)           │  │
│  │      ↓                                               │  │
│  │  [2] Tool Planning Engine (Smart Selection)         │  │
│  │      ↓                                               │  │
│  │  [3] Tool Execution (Parallel/Sequential)           │  │
│  │      ↓                                               │  │
│  │  [4] Answer Synthesis (LLM)                          │  │
│  │      ↓                                               │  │
│  │  [5] Self-RAG Validation (Verify & Grade)           │  │
│  │      ↓                                               │  │
│  │  Validated Answer + Sources                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │  Tool Registry   │  │  Resource Mgr    │               │
│  │  - Vector Search │  │  - Documents     │               │
│  │  - Ingestion     │  │  - Entities      │               │
│  │  - Validation    │  │  - Metadata      │               │
│  └──────────────────┘  └──────────────────┘               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                 Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Qdrant Vector│  │    Ollama    │  │   Context    │  │
│  │   Database   │  │  Embeddings  │  │    Store     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Core Components

## 1. Context Engine

**Purpose**: Transform user queries into optimal retrieval queries using modern RAG patterns

### 1.1 HyDE (Hypothetical Document Embeddings)

**What it does**: Bridges the semantic gap between questions and answers

**Flow**:
```
User Query: "What weapons can a Space Marine Terminator take?"
    ↓
[HyDE Generator - LLM]
    ↓
Hypothetical Answer:
"Space Marine Terminators can be equipped with storm bolters,
power fists, lightning claws, thunder hammers, and storm shields.
They have access to heavy weapons including assault cannons,
heavy flamers, and cyclone missile launchers..."
    ↓
[Embed Hypothetical Answer]
    ↓
[Vector Search with Hypothetical Embedding]
    ↓
Real Documents Matching Hypothetical Answer
```

**Implementation**:
```typescript
interface HyDEEngine {
  /**
   * Generate hypothetical document from query
   */
  generateHypothetical(
    query: string,
    domain: string
  ): Promise<string>;

  /**
   * Embed hypothetical document
   */
  embedHypothetical(
    hypothetical: string
  ): Promise<number[]>;

  /**
   * Search with hypothetical embedding
   */
  search(
    embedding: number[],
    filters?: Record<string, unknown>
  ): Promise<SearchResult[]>;
}
```

**Benefits**:
- Better retrieval for vague queries
- Bridges terminology gaps
- Works with zero-shot queries

---

### 1.2 Query Decomposition

**What it does**: Breaks complex queries into atomic sub-queries

**Query Types**:
1. **Simple Lookup**: Direct fact retrieval
   - "What is a Terminator's toughness?"
   - No decomposition needed

2. **Procedural**: Step-by-step processes
   - "How do I build a 2000 point army?"
   - Decompose into: constraints → unit selection → validation

3. **Comparative**: Comparing multiple entities
   - "Which is better, a Dreadnought or a Land Raider?"
   - Decompose into: unit A stats → unit B stats → comparison

4. **Multi-Hop**: Requires reasoning across sources
   - "Can my Space Wolves Terminators with storm shields fight in turn 1?"
   - Decompose into: unit rules → faction rules → universal rules → synthesis

5. **List-Building**: Constructive queries
   - "Make me a 2000 point competitive Necron list"
   - Decompose into: detachment → constraints → unit selection → validation

**Implementation**:
```typescript
interface QueryDecomposer {
  /**
   * Classify query type
   */
  classify(query: string): QueryType;

  /**
   * Decompose into sub-queries
   */
  decompose(query: string): Promise<DecomposedQuery>;
}

interface DecomposedQuery {
  originalQuery: string;
  queryType: QueryType;
  subQueries: SubQuery[];
  executionPlan: ExecutionPlan;  // Parallel or sequential
  synthesisRequired: boolean;
  synthesisPrompt?: string;
}

interface SubQuery {
  query: string;
  suggestedTool: string;
  dependencies: string[];  // IDs of sub-queries this depends on
  priority: number;
}
```

**Execution Strategies**:
- **Parallel**: Independent sub-queries execute concurrently
- **Sequential**: Dependent sub-queries execute in order
- **Hybrid**: Mix of parallel batches in sequence

---

### 1.3 Step-Back Prompting

**What it does**: Asks high-level questions first for better context

**Example**:
```
Original Query: "Can Terminators deep strike on turn 1?"
    ↓
Step-Back Question: "What are the universal deep strike rules in this game?"
    ↓
[Retrieve general rules first]
    ↓
[Then answer specific question with context]
```

**Implementation**:
```typescript
interface StepBackEngine {
  /**
   * Generate step-back question
   */
  generateStepBack(query: string): Promise<string>;

  /**
   * Execute step-back query first
   */
  executeWithStepBack(
    query: string
  ): Promise<{
    stepBackAnswer: string;
    mainAnswer: string;
  }>;
}
```

---

### 1.4 Context Memory Manager

**Purpose**: Long-term conversation memory and learning

**Features**:
- Session-based context (scoped to conversation)
- Long-term memory (persisted across sessions)
- Temporal relevance scoring
- Reference resolution
- Topic tracking

**Storage**:
```typescript
interface ContextStore {
  // Short-term (session)
  saveMessage(
    sessionId: string,
    message: Message
  ): Promise<void>;

  getRecentMessages(
    sessionId: string,
    limit: number
  ): Promise<Message[]>;

  // Long-term (persistent)
  saveInsight(
    insight: Insight
  ): Promise<void>;

  recallSimilar(
    query: string,
    limit: number
  ): Promise<Insight[]>;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata: {
    tools_used?: string[];
    confidence?: number;
    validated?: boolean;
  };
}

interface Insight {
  id: string;
  summary: string;
  context: string;
  timestamp: Date;
  usageCount: number;
  lastAccessed: Date;
  relevanceScore: number;
}
```

---

## 2. Tool Planning Engine

**Purpose**: Intelligently select and orchestrate tool execution

### 2.1 Tool Selection

**How it works**: LLM-powered tool routing with chain-of-thought reasoning

**Flow**:
```
Query + Available Tools
    ↓
[LLM Tool Planner]
    ↓
Tool Selection Reasoning:
"This is a comparative query requiring stats for two units.
I need:
1. vector-search for Unit A
2. vector-search for Unit B
3. No external tools needed
4. Synthesis required to compare"
    ↓
Tool Chain Plan:
- Step 1: vector-search (Unit A) [PARALLEL]
- Step 2: vector-search (Unit B) [PARALLEL]
- Step 3: synthesize-comparison [SEQUENTIAL after 1,2]
```

**Implementation**:
```typescript
interface ToolPlanner {
  /**
   * Plan tool execution for query
   */
  plan(
    query: string,
    decomposition: DecomposedQuery,
    availableTools: ToolInfo[]
  ): Promise<ToolPlan>;
}

interface ToolPlan {
  steps: ToolStep[];
  reasoning: string;
  estimatedDuration: number;
}

interface ToolStep {
  tool: string;
  parameters: Record<string, unknown>;
  dependencies: string[];  // Step IDs this depends on
  executionMode: 'parallel' | 'sequential';
  fallback?: {
    tool: string;
    condition: 'on_error' | 'on_low_confidence';
  };
}
```

**Tool Categories**:
1. **Vector Search Tools**
   - Semantic search
   - Keyword search
   - Hybrid search (RRF)

2. **Validation Tools**
   - Fact checking
   - Hallucination detection
   - Confidence scoring

3. **Synthesis Tools**
   - Comparison synthesis
   - Multi-source synthesis
   - Summary generation

4. **External Tools**
   - Web search
   - API calls
   - Document retrieval

---

### 2.2 Tool Execution Orchestrator

**Handles**:
- Parallel execution for independent tools
- Sequential execution with context passing
- Retry logic with exponential backoff
- Timeout handling
- Result caching

**Implementation**:
```typescript
interface ToolOrchestrator {
  /**
   * Execute tool plan
   */
  execute(plan: ToolPlan): Promise<ToolExecutionResult[]>;

  /**
   * Execute single step with retry
   */
  executeStep(
    step: ToolStep,
    context: ExecutionContext
  ): Promise<ToolResult>;
}

interface ExecutionContext {
  previousResults: Map<string, ToolResult>;
  conversationHistory: Message[];
  metadata: Record<string, unknown>;
}

interface ToolResult {
  tool: string;
  success: boolean;
  data: unknown;
  confidence: number;
  duration: number;
  sources?: Source[];
  error?: string;
}
```

---

## 3. Self-RAG Validation Layer

**Purpose**: Validate every answer before returning to user

### 3.1 Validation Pipeline

**Flow**:
```
Generated Answer + Source Documents
    ↓
[Validation Step 1: Relevance Check]
Question: Are retrieved documents relevant to the query?
Output: ISREL token (relevant | irrelevant)
    ↓ (if irrelevant, retrieve more)
[Validation Step 2: Support Check]
Question: Is the answer supported by the documents?
Output: ISSUP token (fully_supported | partially_supported | no_support)
    ↓ (if no_support, regenerate or reject)
[Validation Step 3: Usefulness Check]
Question: Does the answer address the user's question?
Output: ISUSE token (useful | not_useful)
    ↓ (if not_useful, regenerate with better prompt)
[Validation Step 4: Confidence Scoring]
Compute final confidence: 0.0 - 1.0
    ↓
[Decision Gate]
If confidence >= threshold (0.7):
    Return answer
Else:
    - Try alternative retrieval strategy
    - Or return "I don't have enough information"
```

**Implementation**:
```typescript
interface SelfRAGValidator {
  /**
   * Validate generated answer
   */
  validate(
    query: string,
    answer: string,
    sources: Source[]
  ): Promise<ValidationResult>;
}

interface ValidationResult {
  isRelevant: boolean;
  isSupported: boolean;
  isUseful: boolean;
  confidence: number;
  reasoning: string;
  citations: Citation[];
  issues: ValidationIssue[];
}

enum ValidationType {
  RELEVANCE = 'relevance',
  SUPPORT = 'support',
  USEFULNESS = 'usefulness',
  HALLUCINATION = 'hallucination',
  COMPLETENESS = 'completeness'
}

interface ValidationIssue {
  type: ValidationType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}
```

---

### 3.2 Hallucination Detection

**Techniques**:

1. **Claim Extraction**
   - Extract factual claims from answer
   - Each claim becomes a verification target

2. **Source Verification**
   - For each claim, find supporting source
   - If no source found → hallucination

3. **Semantic Similarity**
   - Compute similarity between claim and source
   - Low similarity → potential hallucination

4. **Consistency Check**
   - Check for internal contradictions
   - Cross-reference multiple sources

**Implementation**:
```typescript
interface HallucinationDetector {
  /**
   * Extract claims from answer
   */
  extractClaims(answer: string): Promise<Claim[]>;

  /**
   * Verify each claim against sources
   */
  verifyClaim(
    claim: Claim,
    sources: Source[]
  ): Promise<VerificationResult>;

  /**
   * Detect hallucinations
   */
  detect(
    answer: string,
    sources: Source[]
  ): Promise<HallucinationReport>;
}

interface Claim {
  text: string;
  type: 'fact' | 'opinion' | 'inference';
  confidence: number;
}

interface VerificationResult {
  claim: Claim;
  isSupported: boolean;
  supportingSources: Source[];
  similarityScore: number;
}

interface HallucinationReport {
  hasHallucinations: boolean;
  hallucinations: Claim[];
  confidence: number;
  recommendation: 'accept' | 'regenerate' | 'reject';
}
```

---

### 3.3 Provenance Tracking

**What it does**: Tracks exactly where each piece of information came from

**Features**:
- Citation for every claim
- Source document metadata
- Chunk-level references
- Vector search scores

**Implementation**:
```typescript
interface Citation {
  claim: string;
  sources: Source[];
  confidence: number;
}

interface Source {
  id: string;
  document: string;
  chunkId: string;
  content: string;
  metadata: {
    title?: string;
    page?: number;
    section?: string;
    url?: string;
  };
  score: number;  // Vector search score
}
```

---

## 4. MCP Server Architecture

**Purpose**: Expose Arbiter as a pluggable MCP server

### 4.1 Server Structure

```
arbiter-mcp-server/
├── src/
│   ├── server.ts                    # MCP server entry point
│   ├── resources/
│   │   ├── DocumentResource.ts      # Expose documents as MCP resources
│   │   ├── EntityResource.ts        # Expose entities (units, concepts)
│   │   └── ContextResource.ts       # Expose conversation context
│   ├── tools/
│   │   ├── VectorSearchTool.ts      # MCP tool: vector search
│   │   ├── ValidationTool.ts        # MCP tool: validate answer
│   │   ├── IngestionTool.ts         # MCP tool: ingest documents
│   │   └── QueryTool.ts             # MCP tool: full query pipeline
│   ├── prompts/
│   │   └── DomainPrompts.ts         # MCP prompts for domain
│   └── engine/
│       ├── ContextEngine.ts         # HyDE, decomposition, etc.
│       ├── ToolPlanner.ts           # Tool planning
│       ├── Validator.ts             # Self-RAG validation
│       └── Orchestrator.ts          # Execution orchestration
└── domains/
    ├── warhammer-40k/
    │   ├── config.json              # Domain configuration
    │   ├── sources.json             # PDF/repo URLs
    │   ├── tools/                   # Domain-specific tools
    │   └── prompts/                 # Domain-specific prompts
    └── generic/
        └── config.json              # Generic domain template
```

---

### 4.2 MCP Protocol Integration

**Resources** (read-only data):
```typescript
// Client can list all documents
mcp.resources.list("documents")

// Client can read specific document
mcp.resources.read("document://warhammer-40k/units/space-marines/terminator")

// Client can search entities
mcp.resources.list("entities", { query: "terminator" })
```

**Tools** (executable functions):
```typescript
// Client calls vector search tool
mcp.tools.call("vector-search", {
  query: "terminator weapons",
  collection: "warhammer-40k_units",
  limit: 5
})

// Client calls full query pipeline
mcp.tools.call("query", {
  query: "Build me a 2000 point Space Marine list",
  validate: true,
  includeProvenance: true
})
```

**Prompts** (reusable prompt templates):
```typescript
// Client gets domain-specific prompt
mcp.prompts.get("warhammer-40k/unit-comparison")

// Returns template with variables
{
  name: "unit-comparison",
  arguments: ["unit1", "unit2"],
  template: "Compare {unit1} and {unit2} in terms of..."
}
```

---

### 4.3 Domain Configuration

**config.json**:
```json
{
  "domain": "warhammer-40k",
  "version": "10.0",
  "description": "Warhammer 40,000 10th Edition rules and units",

  "vectorDatabase": {
    "collections": [
      "warhammer-40k_units",
      "warhammer-40k_rules",
      "warhammer-40k_lore"
    ],
    "embeddingModel": "nomic-embed-text",
    "dimensions": 768
  },

  "entities": {
    "types": ["unit", "weapon", "ability", "stratagem", "faction"],
    "schema": "./schemas/entity.json"
  },

  "tools": {
    "custom": [
      "FactionValidationTool",
      "PointsCalculatorTool",
      "ListBuilderTool"
    ]
  },

  "ingestion": {
    "sources": "./sources.json",
    "parsers": {
      "battlescribe": true,
      "pdf": true,
      "web": false
    }
  }
}
```

**sources.json**:
```json
{
  "battlescribe": {
    "repos": [
      {
        "url": "https://github.com/BSData/wh40k-10e",
        "branch": "main",
        "catalogPath": "Warhammer 40,000.gst"
      }
    ]
  },

  "pdfs": [
    {
      "name": "Core Rules 10th Edition",
      "url": "https://example.com/core-rules.pdf",
      "type": "rules"
    },
    {
      "name": "Munitorum Field Manual Q4 2024",
      "url": "https://example.com/munitorum.pdf",
      "type": "points"
    }
  ]
}
```

---

## 5. Query Processing Flow

### End-to-End Example

**User Query**: "Build me a competitive 2000 point Space Marine list with lots of firepower"

**Step 1: Context Engine**
```
[HyDE Generator]
Hypothetical list:
"A competitive Space Marine list focused on firepower at 2000 points
includes units like Eradicators, Hellblasters, Ballistus Dreadnoughts..."

[Query Decomposition]
Type: list-building
Sub-queries:
1. "What detachments are competitive for Space Marines?"
2. "What units have high firepower output?"
3. "What is the points cost for Eradicators, Hellblasters, etc.?"
4. "What are the detachment constraints?"

Execution plan: Sequential (constraints → selection → validation)
```

**Step 2: Tool Planning**
```
[Tool Planner]
Tools needed:
1. vector-search for competitive detachments
2. vector-search for high-firepower units
3. points-lookup for selected units
4. faction-validation to check constraints

Plan:
- Step 1: vector-search (detachments) → get top 3
- Step 2: vector-search (units, filtered by firepower)
- Step 3-5: PARALLEL points-lookup for each unit
- Step 6: faction-validation on final list
```

**Step 3: Tool Execution**
```
[Orchestrator]
Execute step 1: vector-search
→ Results: "Gladius Task Force", "Ironstorm Spearhead", "Vanguard Spearhead"

Execute step 2: vector-search
→ Results: Eradicators (high anti-tank), Hellblasters (high anti-infantry), etc.

Execute step 3-5: PARALLEL points-lookup
→ Eradicators: 95pts, Hellblasters: 140pts, etc.

Build list with constraints...

Execute step 6: faction-validation
→ Valid: true, warnings: ["Consider more anti-air"]
```

**Step 4: Answer Synthesis**
```
[LLM Synthesis]
Generated answer:
"Here's a competitive 2000-point Space Marine list focused on firepower using
the Ironstorm Spearhead detachment:

**HQ**
- Captain in Terminator Armour (95pts)

**Battleline**
- 10x Hellblasters (140pts)
- 10x Hellblasters (140pts)

**Infantry**
- 6x Eradicators (95pts)
- 6x Eradicators (95pts)
..."
```

**Step 5: Self-RAG Validation**
```
[Validator]
Relevance check: ✅ Retrieved units match "firepower" requirement
Support check: ✅ All units exist in database with correct points
Usefulness check: ✅ List meets 2000pts, legal, competitive

Claims extracted:
1. "Ironstorm Spearhead is competitive" → Supported (detachment rules)
2. "Eradicators cost 95pts" → Supported (points data)
3. "List is 2000 points" → Supported (calculation verified)

Hallucination check: ✅ No hallucinations detected
Confidence: 0.92

Citations:
- Units: warhammer-40k_units (source: BattleScribe 10e)
- Points: Munitorum Field Manual Q4 2024
- Detachment: Core Rules 10th Edition
```

**Final Response**:
```
Here's a competitive 2000-point Space Marine list focused on firepower...

[Full list details]

**Sources**:
- Unit data: BattleScribe Catalogue (Warhammer 40k 10th Edition)
- Points costs: Munitorum Field Manual Q4 2024, pg. 12-15
- Detachment rules: Core Rules 10th Edition, pg. 87

Confidence: 92%
```

---

## 6. Data Layer

### 6.1 Vector Database (Qdrant)

**Collections**:
- `{domain}_units` - Unit profiles, stats, weapons
- `{domain}_rules` - Game rules, mechanics
- `{domain}_lore` - Background, narrative content

**Schema**:
```typescript
interface VectorDocument {
  id: string;
  vector: number[];  // 768-dim embedding
  content: string;   // Original text
  metadata: {
    type: string;
    domain: string;
    source: string;
    title?: string;
    // Domain-specific fields
    [key: string]: unknown;
  };
}
```

---

### 6.2 Context Store (JSONL)

**Storage**: Conversation history in JSONL format
**Retention**: Configurable (default: 30 days for sessions, indefinite for insights)

---

### 6.3 Embeddings (Ollama)

**Model**: nomic-embed-text
**Dimensions**: 768
**Performance**: ~100ms per embedding

---

## 7. Deployment Architecture

### Docker Compose

```yaml
services:
  arbiter-mcp-server:
    build: ./mcp-server
    ports:
      - "3100:3100"
    environment:
      - QDRANT_HOST=qdrant
      - OLLAMA_HOST=ollama
    depends_on:
      - qdrant
      - ollama

  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"
    volumes:
      - qdrant-data:/qdrant/storage

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

  # Optional: Discord bot as example client
  discord-bot:
    build: ./clients/discord
    environment:
      - MCP_SERVER_URL=http://arbiter-mcp-server:3100
    depends_on:
      - arbiter-mcp-server
```

---

## 8. Technology Stack

**Core**:
- TypeScript 5.7
- Node.js 22+
- MCP SDK ^1.17.5

**LLMs**:
- Anthropic Claude (Sonnet) for reasoning
- Ollama (local) for embeddings

**Vector DB**:
- Qdrant v1.7.4

**Infrastructure**:
- Docker & Docker Compose
- JSONL for context storage

---

## 9. Performance Targets

**Response Times** (95th percentile):
- Simple query: <3 seconds
- Complex query: <10 seconds
- List building: <15 seconds

**Accuracy**:
- Validation accuracy: >95%
- Hallucination rate: <5%
- Query success rate: >90%

**Scalability**:
- 100 concurrent users (with proper infrastructure)
- 1M+ vectors per collection
- 10K+ documents per domain

---

## 10. Security & Privacy

**Data**:
- No user data sent to external services (except Anthropic API)
- All embeddings generated locally (Ollama)
- Context stored locally

**Validation**:
- Input sanitization
- Output validation
- Rate limiting
- Error handling

---

## 11. Extensibility

### Adding a New Domain

1. Create domain config: `domains/my-domain/config.json`
2. Add sources: `domains/my-domain/sources.json`
3. Run ingestion: `arbiter ingest --domain my-domain`
4. (Optional) Add custom tools: `domains/my-domain/tools/`
5. (Optional) Add custom prompts: `domains/my-domain/prompts/`

### Adding a New Tool

1. Extend `BaseMcpTool`
2. Implement `execute()` method
3. Register in `ToolRegistry`
4. Add to domain config (if domain-specific)

### Adding a New Client

1. Install MCP SDK in your client
2. Connect to Arbiter MCP server (stdio or HTTP)
3. Use `mcp.tools.call()` and `mcp.resources.list()`

---

## Next Steps

1. Review architecture with stakeholder
2. Begin implementation with ARB-002 (Context System)
3. Validate with end-to-end test query
4. Iterate based on feedback

---

**Last Updated**: 2025-10-20
**Status**: Ready for Implementation
