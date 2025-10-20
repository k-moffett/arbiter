# ARB-003: Tool Planning Engine

**Status**: 🔶 READY
**Priority**: P0 - Blocker
**Epic**: ARB-EPIC-001
**Effort**: 12-15 hours
**Assignee**: @kmoffett

---

## Description

Build an intelligent tool planning engine that uses LLM-powered reasoning to select the right tools for each query, determine execution order, and orchestrate parallel/sequential execution. This replaces the hardcoded tool selection logic from Cogitator with an adaptive, chain-of-thought approach.

---

## Goals

1. Intelligent tool selection based on query analysis
2. Automatic execution plan generation (parallel vs sequential)
3. Tool chain orchestration with context passing
4. Fallback strategies for tool failures
5. Performance optimization (caching, parallel execution)

---

## Acceptance Criteria

### Must Have

- [ ] **Tool Planner** implemented
  - [ ] LLM-powered tool selection with reasoning
  - [ ] Generates execution plans from decomposed queries
  - [ ] Considers tool capabilities and limitations
  - [ ] Confidence-based routing

- [ ] **Tool Orchestrator** implemented
  - [ ] Execute parallel tool calls concurrently
  - [ ] Execute sequential calls with context passing
  - [ ] Handle dependencies between tools
  - [ ] Retry logic with exponential backoff
  - [ ] Timeout handling

- [ ] **Tool Registry** (from Cogitator)
  - [ ] Register available tools
  - [ ] Query tools by capability
  - [ ] Tool metadata (parameters, description, examples)

- [ ] **Integration with Context System**
  - [ ] Use decomposed queries from ARB-002
  - [ ] Pass context between tool calls
  - [ ] Accumulate results for synthesis

- [ ] **Testing**
  - [ ] Test with simple queries (1 tool)
  - [ ] Test with parallel queries (2+ independent tools)
  - [ ] Test with sequential queries (dependent tools)
  - [ ] Test with mixed queries (parallel stages → sequential)

### Should Have

- [ ] Tool result caching (avoid redundant calls)
- [ ] Adaptive timeout based on tool history
- [ ] Cost estimation for tool chains

### Nice to Have

- [ ] Self-learning (track which tool combinations work best)
- [ ] A/B testing for tool selection strategies

---

## Implementation Plan

### Phase 1: Tool Planner (6-8 hours)

**Files to Create**:
```
src/engine/tools/
├── ToolPlanner.ts
├── ToolSelector.ts
├── ExecutionPlanBuilder.ts
└── interfaces/
    ├── IToolPlanner.ts
    ├── IToolPlan.ts
    └── IToolStep.ts
```

**Implementation Steps**:

1. **Create ToolPlanner Interface**
```typescript
interface IToolPlanner {
  plan(
    query: string,
    decomposition: IDecomposedQuery,
    availableTools: ToolInfo[]
  ): Promise<IToolPlan>;
}

interface IToolPlan {
  steps: IToolStep[];
  reasoning: string;
  estimatedDuration: number;
  estimatedCost: number;
}

interface IToolStep {
  id: string;
  tool: string;
  parameters: Record<string, unknown>;
  dependencies: string[];  // Step IDs this depends on
  executionMode: 'parallel' | 'sequential';
  timeout: number;
  fallback?: {
    tool: string;
    condition: 'on_error' | 'on_low_confidence';
    threshold?: number;
  };
}
```

2. **Implement ToolSelector (LLM-Powered)**
   - Use Anthropic Claude for tool selection reasoning
   - Provide tool descriptions and capabilities
   - Ask LLM: "Which tools should be used for this query?"
   - Get reasoning + tool list

   **Prompt Template**:
   ```
   You are an expert tool planner for a RAG system.

   **Query**: {query}
   **Query Type**: {queryType}
   **Sub-Queries**: {subQueries}

   **Available Tools**:
   {toolDescriptions}

   For each sub-query, select the best tool(s) to use.

   **Guidelines**:
   1. Use vector-search for semantic lookups
   2. Use keyword-search for exact matches
   3. Use hybrid-search for best of both
   4. Use validation tools after synthesis
   5. Prefer fewer tools over more

   **Output Format**:
   {
     "reasoning": "...",
     "toolChain": [
       {
         "subQuery": "...",
         "tool": "vector-search",
         "parameters": {...},
         "confidence": 0.9
       }
     ]
   }
   ```

3. **Implement ExecutionPlanBuilder**
   - Take tool selections from LLM
   - Analyze dependencies between tools
   - Group into stages:
     - Stage 1: All tools with no dependencies (parallel)
     - Stage 2: Tools depending only on Stage 1 (parallel within stage)
     - Stage N: Tools depending on previous stages
   - Set timeouts based on tool type
   - Add fallbacks for critical tools

4. **Add Confidence-Based Routing**
   - If query decomposition confidence is low → use simpler tool plan
   - If HyDE confidence is low → fall back to standard search
   - If tool has high failure rate → add fallback

**Testing**:
- Simple query: "What is a terminator's toughness?" → Single vector-search
- Comparison: "Terminator vs Dreadnought" → Two parallel vector-searches
- Multi-hop: "Can my terminators deep strike turn 1?" → Sequential tool chain
- List-building: "Build 2000pt list" → Multi-stage plan

---

### Phase 2: Tool Orchestrator (4-5 hours)

**Files to Copy from Cogitator**:
```
src/mcp/tools/core/McpToolExecutor.ts → src/engine/tools/ToolExecutor.ts (with modifications)
src/mcp/tools/core/McpToolRegistry.ts → src/engine/tools/ToolRegistry.ts (with modifications)
```

**Files to Create**:
```
src/engine/tools/
├── ToolOrchestrator.ts
├── ParallelExecutor.ts
├── SequentialExecutor.ts
└── interfaces/
    ├── IToolOrchestrator.ts
    └── IExecutionContext.ts
```

**Implementation Steps**:

1. **Create ToolOrchestrator Interface**
```typescript
interface IToolOrchestrator {
  execute(plan: IToolPlan): Promise<IToolExecutionResult[]>;
  executeStep(
    step: IToolStep,
    context: IExecutionContext
  ): Promise<IToolResult>;
  cancel(planId: string): Promise<void>;
}

interface IExecutionContext {
  planId: string;
  previousResults: Map<string, IToolResult>;
  conversationHistory: IMessage[];
  metadata: Record<string, unknown>;
  startTime: Date;
}

interface IToolResult {
  stepId: string;
  tool: string;
  success: boolean;
  data: unknown;
  confidence: number;
  duration: number;
  sources?: ISource[];
  error?: string;
  retries: number;
}

interface IToolExecutionResult {
  planId: string;
  results: IToolResult[];
  totalDuration: number;
  success: boolean;
  failedSteps?: string[];
}
```

2. **Implement ParallelExecutor**
   - Execute multiple tools concurrently using `Promise.all()`
   - Collect results
   - Handle partial failures (some tools succeed, some fail)

3. **Implement SequentialExecutor**
   - Execute tools one at a time
   - Pass previous results as context to next tool
   - Stop on first critical failure (optional, configurable)

4. **Implement ToolOrchestrator**
   - Iterate through plan stages
   - For each stage:
     - If parallel: Use ParallelExecutor
     - If sequential: Use SequentialExecutor
   - Build execution context with accumulated results
   - Handle tool failures:
     - If fallback defined: Execute fallback tool
     - If no fallback and critical: Stop execution
     - If no fallback and non-critical: Continue

5. **Add Retry Logic**
   - Retry failed tools up to 3 times
   - Exponential backoff: 1s, 2s, 4s
   - Don't retry if error is non-retryable (validation error, etc.)

6. **Add Timeout Handling**
   - Each tool gets a timeout (default: 30s)
   - If tool exceeds timeout → cancel and mark as failed
   - Log timeout events for analysis

**Testing**:
- Parallel execution: 3 independent tools execute concurrently
- Sequential execution: Tool B receives Tool A's result as context
- Mixed execution: Stage 1 (parallel) → Stage 2 (sequential)
- Retry logic: Tool fails 2 times, succeeds on 3rd attempt
- Timeout: Tool times out after 30s

---

### Phase 3: Tool Registry & Metadata (2-3 hours)

**Files to Copy from Cogitator**:
```
src/mcp/tools/core/McpToolRegistry.ts → src/engine/tools/ToolRegistry.ts
src/mcp/tools/core/BaseMcpTool.ts → src/engine/tools/BaseTool.ts
```

**Files to Modify**:
```
src/engine/tools/
└── ToolRegistry.ts (enhance with metadata)
```

**Implementation Steps**:

1. **Enhance Tool Metadata**
```typescript
interface ToolInfo {
  name: string;
  description: string;
  category: 'search' | 'validation' | 'synthesis' | 'external';
  parameters: ParameterSchema[];
  examples: ToolExample[];
  capabilities: string[];
  limitations: string[];
  averageDuration: number;  // Track performance
  failureRate: number;      // Track reliability
  cost?: number;            // If tool calls external API
}

interface ToolExample {
  query: string;
  parameters: Record<string, unknown>;
  expectedResult: string;
}
```

2. **Implement ToolRegistry Methods**
   - `register(tool: BaseTool)` - Register a tool
   - `get(name: string): BaseTool` - Get tool by name
   - `list()`: ToolInfo[]` - List all tools
   - `findByCapability(capability: string): ToolInfo[]` - Find tools by capability
   - `updateStats(name: string, stats: ToolStats)` - Update performance stats

3. **Track Tool Performance**
   - After each execution, update tool stats
   - Track: average duration, failure rate, confidence scores
   - Use stats for planning (avoid slow/unreliable tools)

**Testing**:
- Register 5+ tools
- Query by capability: "Which tools can do semantic search?"
- Get tool by name
- Update stats after executions

---

### Phase 4: Integration with Context System (1-2 hours)

**Files to Modify**:
```
src/engine/tools/ToolPlanner.ts
src/engine/tools/ToolOrchestrator.ts
```

**Implementation Steps**:

1. **Accept Decomposed Queries**
   - ToolPlanner accepts `IDecomposedQuery` from ARB-002
   - For each sub-query, select appropriate tool
   - Build execution plan respecting dependencies

2. **Pass Context Between Tools**
   - ExecutionContext includes previous tool results
   - Tools can access results from dependencies
   - Example: Comparison tool receives data from two lookup tools

3. **Accumulate Results for Synthesis**
   - Collect all tool results
   - Pass to synthesis step (ARB-004)
   - Include confidence scores and sources

**Testing**:
- End-to-end: Decomposed query → Tool plan → Execution → Results
- Verify context passing works between tools
- Verify results ready for synthesis

---

## Technical Details

### Reusable Components from Cogitator

**Direct Copy (Minimal Changes)**:
- `src/mcp/tools/core/BaseMcpTool.ts` → `src/engine/tools/BaseTool.ts`
- `src/mcp/tools/core/McpToolRegistry.ts` → `src/engine/tools/ToolRegistry.ts`
- `src/mcp/tools/core/McpToolExecutor.ts` → `src/engine/tools/ToolExecutor.ts`

**Reference Concepts (Don't Copy)**:
- `src/agent/services/AnthropicQueryRouter.ts` - LLM-powered routing concept
- `src/mcp/agent/services/IntelligentAgentService.ts:executeToolChain()` - Execution patterns

### Tool Examples to Register

**From Cogitator** (will migrate in ARB-006):
- `VectorSearchTool` - Semantic search in vector DB
- `KeywordSearchTool` - Keyword/exact match search
- `HybridSearchTool` - Combined semantic + keyword

**New Tools** (will create in ARB-004):
- `ValidationTool` - Validate answer against sources
- `HallucinationDetectorTool` - Detect hallucinations
- `SynthesisTool` - Synthesize results from multiple tools

---

## Configuration

**Environment Variables**:
```bash
# Tool Planning
TOOL_PLANNER_LLM=anthropic  # or 'ollama'
TOOL_PLANNER_MODEL=claude-sonnet-4
TOOL_PLANNER_TEMPERATURE=0.3

# Tool Execution
TOOL_DEFAULT_TIMEOUT=30000  # 30 seconds
TOOL_MAX_RETRIES=3
TOOL_RETRY_BACKOFF=exponential
TOOL_PARALLEL_LIMIT=5  # Max parallel tools

# Performance
TOOL_RESULT_CACHE_ENABLED=true
TOOL_RESULT_CACHE_TTL=300  # 5 minutes
```

---

## Risks & Mitigations

### Risk: LLM-Based Planning is Slow
**Mitigation**: Cache tool plans for similar queries. Set timeout for planning (2s).

### Risk: Tool Selection is Wrong
**Mitigation**: Log all tool selections with reasoning. Analyze failures. Refine prompts.

### Risk: Parallel Execution Overwhelms System
**Mitigation**: Limit parallel tools (default: 5). Queue excess tools.

### Risk: Tool Failures Cascade
**Mitigation**: Add fallbacks for critical tools. Isolate failures (don't stop entire chain).

---

## Success Metrics

- [ ] Tool planner selects correct tools for 90%+ of queries
- [ ] Parallel execution provides 2-3x speedup over sequential
- [ ] Tool chain execution completes within timeout 95%+ of time
- [ ] Retry logic reduces failure rate by 50%+
- [ ] Cache hit rate >30% for common queries

---

## Dependencies

- **Blockers**:
  - ARB-001 (Base Repo) - ✅ Complete
  - ARB-002 (Context System) - Provides decomposed queries
- **Nice to Have**: ARB-004 (Validation) - Provides validation tools to plan

---

## Follow-up Tasks

After completion:
- ARB-004: Self-RAG Validation (uses tool planning)
- ARB-006: Ingestion Migration (provides tools to register)

---

## Notes

- Tool planning is critical for handling complex queries
- Start simple: Get basic tool selection working first
- Add sophistication incrementally: fallbacks, retries, caching
- Monitor tool selection decisions closely in early testing

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for Development
