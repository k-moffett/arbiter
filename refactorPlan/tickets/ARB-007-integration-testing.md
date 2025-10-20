# ARB-007: Integration & End-to-End Testing

**Status**: 🔶 READY
**Priority**: P0 - Blocker
**Epic**: ARB-EPIC-001
**Effort**: 10-12 hours
**Assignee**: @kmoffett

---

## Description

Validate that all Arbiter components work together through comprehensive integration testing and at least one complete end-to-end flow. This ensures the foundation is solid before adding features.

---

## Goals

1. Validate complete query pipeline works end-to-end
2. Test all major patterns (HyDE, decomposition, validation)
3. Verify MCP server integration
4. Benchmark performance
5. Document known issues and limitations

---

## Acceptance Criteria

### Must Have

- [ ] **End-to-End Test Suite**
  - [ ] Simple query: Question → Answer → Validation
  - [ ] Complex query: Multi-hop reasoning
  - [ ] Comparison query: 2 entities compared
  - [ ] List-building query: Constructive query
  - [ ] Conversational query: Follow-up question

- [ ] **Component Integration Tests**
  - [ ] Context Engine (HyDE, decomposition, step-back)
  - [ ] Tool Planning & Execution
  - [ ] Validation Pipeline
  - [ ] MCP Server (tools, resources, prompts)
  - [ ] Ingestion (BattleScribe, PDF)

- [ ] **Performance Benchmarks**
  - [ ] Simple queries: <3s (95th percentile)
  - [ ] Complex queries: <10s (95th percentile)
  - [ ] Validation overhead: <1s
  - [ ] MCP latency: <100ms

- [ ] **Error Handling Tests**
  - [ ] Invalid queries
  - [ ] Tool failures
  - [ ] LLM failures
  - [ ] Vector DB failures
  - [ ] Low confidence scenarios

- [ ] **Documentation**
  - [ ] Test results summary
  - [ ] Known issues and limitations
  - [ ] Performance analysis
  - [ ] Recommendations for next phase

### Should Have

- [ ] Load testing (multiple concurrent queries)
- [ ] Regression test suite
- [ ] Automated CI/CD tests

### Nice to Have

- [ ] Chaos engineering (random failures)
- [ ] A/B testing different strategies
- [ ] User acceptance testing

---

## Implementation Plan

### Phase 1: End-to-End Test Suite (4-5 hours)

**Files to Create**:
```
test/e2e/
├── simple-query.test.ts
├── complex-query.test.ts
├── comparison-query.test.ts
├── list-building.test.ts
├── conversational.test.ts
└── helpers/
    ├── TestClient.ts
    └── TestDatasets.ts
```

**Implementation Steps**:

1. **Create Test Client**
```typescript
class TestClient {
  constructor(private mcpServer: ArbiterMCPServer) {}

  async query(
    query: string,
    domain = 'warhammer-40k',
    validate = true
  ): Promise<QueryResult> {
    const startTime = Date.now();

    const result = await this.mcpServer.callTool('query', {
      query,
      domain,
      validate,
      includeProvenance: true
    });

    return {
      answer: result.content[0].text,
      confidence: result.metadata.confidence,
      citations: result.metadata.citations,
      duration: Date.now() - startTime,
      toolsUsed: result.metadata.toolsUsed
    };
  }
}
```

2. **Create Test Datasets**
```typescript
const TEST_QUERIES = {
  simple: [
    {
      query: "What is a Space Marine Terminator's toughness?",
      expectedAnswer: /toughness\s*:?\s*5/i,
      expectedConfidence: 0.9,
      expectedDuration: 3000
    }
  ],
  complex: [
    {
      query: "Can my Space Wolves Terminators with storm shields deep strike on turn 1?",
      expectedAnswer: /deep strike.*turn (1|one)/i,
      expectedTools: ['vector-search', 'vector-search', 'vector-search'], // 3 queries
      expectedConfidence: 0.8,
      expectedDuration: 10000
    }
  ],
  comparison: [
    {
      query: "Which is better, a Terminator or a Dreadnought?",
      expectedAnswer: /terminator.*dreadnought|dreadnought.*terminator/i,
      expectedTools: ['vector-search', 'vector-search'],
      expectedConfidence: 0.7,
      expectedDuration: 5000
    }
  ]
};
```

3. **Implement Test Cases**

**Simple Query Test**:
```typescript
describe('E2E: Simple Query', () => {
  it('should answer simple stat lookup', async () => {
    const result = await testClient.query(
      "What is a Terminator's toughness?"
    );

    expect(result.answer).toMatch(/toughness\s*:?\s*5/i);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.duration).toBeLessThan(3000);
    expect(result.citations).toHaveLength(1);
  });

  it('should use HyDE for vague query', async () => {
    const result = await testClient.query(
      "Tell me about Terminators"
    );

    expect(result.toolsUsed).toContain('hyde');
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

**Complex Multi-Hop Test**:
```typescript
describe('E2E: Complex Multi-Hop Query', () => {
  it('should handle multi-hop reasoning', async () => {
    const result = await testClient.query(
      "Can my Space Wolves Terminators with storm shields deep strike on turn 1?"
    );

    // Should decompose into sub-queries
    expect(result.toolsUsed.length).toBeGreaterThanOrEqual(3);

    // Should cite multiple sources
    expect(result.citations.length).toBeGreaterThanOrEqual(2);

    // Should answer correctly
    expect(result.answer).toMatch(/deep strike/i);
    expect(result.confidence).toBeGreaterThan(0.7);
  });
});
```

**Comparison Test**:
```typescript
describe('E2E: Comparison Query', () => {
  it('should compare two units', async () => {
    const result = await testClient.query(
      "Compare Terminator vs Dreadnought"
    );

    // Should mention both units
    expect(result.answer).toMatch(/terminator/i);
    expect(result.answer).toMatch(/dreadnought/i);

    // Should have citations for both
    expect(result.citations.some(c => /terminator/i.test(c.claim))).toBe(true);
    expect(result.citations.some(c => /dreadnought/i.test(c.claim))).toBe(true);

    // Should synthesize comparison
    expect(result.toolsUsed).toContain('synthesis');
  });
});
```

**List-Building Test**:
```typescript
describe('E2E: List-Building Query', () => {
  it('should build a 2000pt list', async () => {
    const result = await testClient.query(
      "Build me a competitive 2000 point Space Marine list"
    );

    // Should decompose into list-building steps
    expect(result.toolsUsed).toContain('query-decomposition');

    // Should mention points total
    expect(result.answer).toMatch(/2000\s*points?/i);

    // Should include units
    expect(result.answer).toMatch(/HQ|Battleline|Infantry/i);

    // May have lower confidence (complex task)
    expect(result.confidence).toBeGreaterThan(0.6);
  });
});
```

**Conversational Test**:
```typescript
describe('E2E: Conversational Query', () => {
  it('should handle follow-up questions', async () => {
    // First query
    const result1 = await testClient.query(
      "What weapons can a Terminator take?"
    );

    // Follow-up query
    const result2 = await testClient.query(
      "What about the assault version?"
    );

    // Should resolve reference to "Terminator"
    expect(result2.answer).toMatch(/terminator/i);
    expect(result2.toolsUsed).toContain('reference-resolution');
  });
});
```

**Testing**:
Run entire suite and verify:
- [ ] All tests pass
- [ ] Performance within targets
- [ ] Confidence scores reasonable
- [ ] Citations present and accurate

---

### Phase 2: Component Integration Tests (3-4 hours)

**Files to Create**:
```
test/integration/
├── context-engine.test.ts
├── tool-planning.test.ts
├── validation.test.ts
├── mcp-server.test.ts
└── ingestion.test.ts
```

**Implementation Steps**:

1. **Context Engine Integration**
```typescript
describe('Integration: Context Engine', () => {
  it('HyDE should improve vague query retrieval', async () => {
    const query = "Tell me about heavy infantry";

    // Without HyDE
    const standardResults = await vectorDB.search(query, 'warhammer-40k_units');

    // With HyDE
    const hydeResults = await hydeEngine.searchWithHyDE(query, 'warhammer-40k_units');

    // HyDE should have better relevance
    expect(hydeResults[0].score).toBeGreaterThan(standardResults[0].score);
  });

  it('Query decomposition should handle complex queries', async () => {
    const query = "Can my terminators deep strike turn 1 if I go second?";

    const decomposition = await queryDecomposer.decompose(query);

    expect(decomposition.queryType).toBe(QueryType.MULTI_HOP);
    expect(decomposition.subQueries.length).toBeGreaterThanOrEqual(3);
    expect(decomposition.executionPlan.stages.length).toBeGreaterThan(1);
  });

  it('Step-back prompting should provide context', async () => {
    const query = "Can terminators deep strike turn 1?";

    const result = await stepBackEngine.executeWithStepBack(
      query,
      'warhammer-40k_rules'
    );

    expect(result.stepBackQuery).toMatch(/deep strike rules/i);
    expect(result.stepBackResults.length).toBeGreaterThan(0);
  });
});
```

2. **Tool Planning Integration**
```typescript
describe('Integration: Tool Planning', () => {
  it('should select correct tools for simple query', async () => {
    const plan = await toolPlanner.plan(
      "What is a Terminator's toughness?",
      { queryType: QueryType.SIMPLE_LOOKUP, subQueries: [...] },
      availableTools
    );

    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0].tool).toBe('vector-search');
  });

  it('should plan parallel execution for comparison', async () => {
    const plan = await toolPlanner.plan(
      "Compare Terminator vs Dreadnought",
      { queryType: QueryType.COMPARATIVE, subQueries: [...] },
      availableTools
    );

    // Should have parallel stage for lookups
    const parallelStage = plan.steps.filter(s => s.executionMode === 'parallel');
    expect(parallelStage.length).toBe(2);
  });

  it('should orchestrate tool execution correctly', async () => {
    const plan = { steps: [...] };

    const results = await toolOrchestrator.execute(plan);

    expect(results).toHaveLength(plan.steps.length);
    expect(results.every(r => r.success)).toBe(true);
  });
});
```

3. **Validation Integration**
```typescript
describe('Integration: Validation', () => {
  it('should validate supported answer', async () => {
    const query = "What is a Terminator's toughness?";
    const answer = "A Terminator has toughness 5.";
    const sources = [
      { content: "Terminators: Toughness 5, Wounds 3, Save 2+" }
    ];

    const result = await validator.validate(query, answer, sources);

    expect(result.isRelevant).toBe(true);
    expect(result.isSupported).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.recommendation).toBe('accept');
  });

  it('should detect hallucinations', async () => {
    const query = "What is a Terminator's toughness?";
    const answer = "A Terminator has toughness 10."; // WRONG
    const sources = [
      { content: "Terminators: Toughness 5, Wounds 3, Save 2+" }
    ];

    const result = await validator.validate(query, answer, sources);

    expect(result.isSupported).toBe(false);
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.recommendation).toMatch(/reject|regenerate/);
  });
});
```

4. **MCP Server Integration**
```typescript
describe('Integration: MCP Server', () => {
  it('should expose tools via MCP', async () => {
    const tools = await mcpClient.listTools();

    expect(tools).toContainEqual(
      expect.objectContaining({ name: 'query' })
    );
    expect(tools).toContainEqual(
      expect.objectContaining({ name: 'vector-search' })
    );
  });

  it('should execute tools via MCP', async () => {
    const result = await mcpClient.callTool('vector-search', {
      query: 'Terminator',
      collection: 'warhammer-40k_units',
      limit: 5
    });

    expect(result.success).toBe(true);
    expect(result.data.results).toHaveLength(5);
  });

  it('should expose resources via MCP', async () => {
    const resources = await mcpClient.listResources();

    expect(resources).toContainEqual(
      expect.objectContaining({ uri: 'documents://' })
    );
  });
});
```

5. **Ingestion Integration**
```typescript
describe('Integration: Ingestion', () => {
  it('should ingest BattleScribe data', async () => {
    const result = await battlescribeIngestion.ingest(
      'test-domain',
      TEST_BATTLESCRIBE_REPO,
      'main',
      'test.gst'
    );

    expect(result.success).toBe(true);
    expect(result.itemsProcessed).toBeGreaterThan(0);
    expect(result.vectorsCreated).toBeGreaterThan(0);
  });

  it('should ingest PDF data', async () => {
    const result = await pdfIngestion.ingest(
      'test-domain',
      TEST_PDF_URL,
      'rules',
      'Test Rules'
    );

    expect(result.success).toBe(true);
    expect(result.itemsProcessed).toBeGreaterThan(0);
  });
});
```

**Testing**:
Run all integration tests and verify:
- [ ] All components integrate correctly
- [ ] No unexpected interactions
- [ ] Error handling works

---

### Phase 3: Performance Benchmarking (2-3 hours)

**Files to Create**:
```
test/performance/
├── query-benchmarks.test.ts
├── validation-benchmarks.test.ts
└── mcp-benchmarks.test.ts
```

**Implementation Steps**:

1. **Query Performance**
```typescript
describe('Performance: Query Pipeline', () => {
  it('simple queries under 3s (95th percentile)', async () => {
    const times: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await testClient.query("What is a Terminator's toughness?");
      times.push(Date.now() - start);
    }

    const p95 = percentile(times, 0.95);
    expect(p95).toBeLessThan(3000);
  });

  it('complex queries under 10s (95th percentile)', async () => {
    const times: number[] = [];

    for (let i = 0; i < 50; i++) {
      const start = Date.now();
      await testClient.query(
        "Can my Space Wolves Terminators with storm shields deep strike on turn 1?"
      );
      times.push(Date.now() - start);
    }

    const p95 = percentile(times, 0.95);
    expect(p95).toBeLessThan(10000);
  });
});
```

2. **Validation Overhead**
```typescript
describe('Performance: Validation', () => {
  it('validation adds <1s overhead', async () => {
    const query = "What is a Terminator's toughness?";

    // Without validation
    const start1 = Date.now();
    await testClient.query(query, 'warhammer-40k', false);
    const durationWithout = Date.now() - start1;

    // With validation
    const start2 = Date.now();
    await testClient.query(query, 'warhammer-40k', true);
    const durationWith = Date.now() - start2;

    const overhead = durationWith - durationWithout;
    expect(overhead).toBeLessThan(1000);
  });
});
```

3. **MCP Latency**
```typescript
describe('Performance: MCP Server', () => {
  it('MCP call overhead <100ms', async () => {
    const times: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await mcpClient.listTools();
      times.push(Date.now() - start);
    }

    const p95 = percentile(times, 0.95);
    expect(p95).toBeLessThan(100);
  });
});
```

**Testing**:
- [ ] Run benchmarks
- [ ] Document results
- [ ] Identify bottlenecks
- [ ] Recommend optimizations

---

### Phase 4: Error Handling Tests (1-2 hours)

**Files to Create**:
```
test/error-handling/
├── invalid-queries.test.ts
├── tool-failures.test.ts
└── fallback-scenarios.test.ts
```

**Implementation Steps**:

1. **Invalid Queries**
```typescript
describe('Error Handling: Invalid Queries', () => {
  it('should handle empty query', async () => {
    const result = await testClient.query("");

    expect(result.answer).toMatch(/invalid|error/i);
  });

  it('should handle non-existent domain', async () => {
    await expect(
      testClient.query("test query", "non-existent-domain")
    ).rejects.toThrow(/domain not found/i);
  });
});
```

2. **Tool Failures**
```typescript
describe('Error Handling: Tool Failures', () => {
  it('should fall back if tool fails', async () => {
    // Simulate tool failure
    mockToolExecutor.mockRejectedValueOnce(new Error('Tool failed'));

    const result = await testClient.query("What is a Terminator's toughness?");

    // Should use fallback tool
    expect(result.toolsUsed).toContain('fallback-tool');
    expect(result.answer).toBeDefined();
  });
});
```

3. **Low Confidence Scenarios**
```typescript
describe('Error Handling: Low Confidence', () => {
  it('should retry with low confidence', async () => {
    // Query that returns low confidence
    const result = await testClient.query("What is a Grubznark's fleem?");

    // Should either retry or reject
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.answer).toMatch(/don't have|insufficient|uncertain/i);
  });
});
```

**Testing**:
- [ ] Verify graceful degradation
- [ ] Verify error messages are helpful
- [ ] Verify no crashes

---

## Technical Details

### Test Infrastructure

**Dependencies**:
```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "supertest": "^6.0.0"
  }
}
```

**Jest Configuration**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  testTimeout: 30000, // 30s for E2E tests
  setupFilesAfterEnv: ['./test/setup.ts']
};
```

---

## Success Metrics

- [ ] All E2E tests pass
- [ ] All integration tests pass
- [ ] Performance benchmarks meet targets:
  - Simple queries: <3s (95th percentile)
  - Complex queries: <10s (95th percentile)
  - Validation overhead: <1s
  - MCP latency: <100ms
- [ ] Error handling tests pass
- [ ] No critical bugs found
- [ ] Documentation complete

---

## Dependencies

- **Blockers**:
  - ARB-001 through ARB-006 must be complete

---

## Deliverables

1. **Test Suite** (all tests passing)
2. **Performance Report** (benchmarks + analysis)
3. **Known Issues Document** (bugs, limitations)
4. **Recommendations Document** (next steps)

---

## Notes

- This is the **validation gate** for the epic
- Don't proceed to Phase 2 (features) until all tests pass
- Document any issues found - create follow-up tickets
- Performance problems should be addressed before adding features

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for Development
