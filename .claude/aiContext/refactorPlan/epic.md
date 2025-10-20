# EPIC: Arbiter - Intelligent RAG Assistant Refactor

**Epic ID**: ARB-EPIC-001
**Status**: Planning
**Priority**: P0 - Foundation
**Owner**: @kmoffett

---

## Problem Statement

Cogitator, while functional for basic queries, has fundamental architectural issues that prevent it from being a truly intelligent assistant:

### Critical Issues

1. **Broken Query Processing Flow**
   - Initial query interaction is fundamentally flawed
   - No proper query decomposition for complex multi-hop questions
   - Tool selection is hardcoded and brittle
   - Missing modern RAG patterns (HyDE, step-back prompting, query expansion)

2. **No Answer Validation**
   - Responses generated without verification against source documents
   - No hallucination detection
   - No confidence thresholds enforced
   - Can't trace answers back to authoritative sources
   - Users receive potentially incorrect information

3. **Weak Context System**
   - Limited conversation awareness
   - No long-term learning or adaptation
   - Context selection strategies are basic
   - Missing self-reflection capabilities

4. **Monolithic Architecture**
   - Discord bot, tools, and knowledge base tightly coupled
   - Hard to extend or reuse components
   - IP-specific (Warhammer) logic embedded throughout
   - Can't easily add new domains or use cases

### What's Working (Don't Break)

- ✅ Ingestion pipelines (BattleScribe XML, PDF parsing) - well-designed
- ✅ Vector database setup (Qdrant) - performant
- ✅ MCP tool framework - good foundation
- ✅ Docker orchestration - solid

---

## Goals & Objectives

### Primary Goals

**1. Build Modern Query Processing Pipeline**
- Implement HyDE (Hypothetical Document Embeddings) for better retrieval
- Add query decomposition for multi-hop reasoning
- Create intelligent tool planning engine
- Support complex queries requiring multiple sources

**2. Implement Self-RAG Validation**
- Verify all answers against source documents
- Add hallucination detection
- Enforce confidence thresholds
- Provide source citations and provenance tracking
- Enable self-reflection and self-correction

**3. Create Pluggable MCP Server**
- Separate knowledge base into standalone MCP server
- Support multiple domains via configuration
- Expose tools and resources via MCP protocol
- Enable any client to use the knowledge base
- Docker-containerized for easy deployment

**4. Enhance Context System**
- Long-term memory and learning
- Better conversation understanding
- Temporal awareness and relevance scoring
- Support for extended conversations

### Secondary Goals

- Remove IP-specific references (make domain-agnostic)
- Improve error handling and observability
- Add comprehensive testing
- Document patterns for future maintainability

---

## Technical Approach

### Architecture Shift

**From**: Monolithic Discord bot with embedded knowledge
**To**: Modular architecture with MCP server

```
┌─────────────────────────────────┐
│      Client Layer (Bot)         │
│   (Discord, Slack, CLI, etc.)   │
└──────────────┬──────────────────┘
               │ MCP Protocol
┌──────────────▼──────────────────┐
│       Arbiter MCP Server        │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Context Engine          │  │
│  │  - HyDE                  │  │
│  │  - Query Decomposition   │  │
│  │  - Memory Management     │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Tool Planning Engine    │  │
│  │  - Smart tool selection  │  │
│  │  - Chain orchestration   │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Self-RAG Validator      │  │
│  │  - Answer verification   │  │
│  │  - Hallucination check   │  │
│  │  - Confidence scoring    │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Domain Resources        │  │
│  │  - Vector DB (Qdrant)    │  │
│  │  - Ingestion pipelines   │  │
│  │  - Document storage      │  │
│  └──────────────────────────┘  │
└─────────────────────────────────┘
```

### Modern RAG Patterns to Implement

**1. HyDE (Hypothetical Document Embeddings)**
- Generate hypothetical answer to query
- Embed hypothetical answer
- Search for real documents matching the hypothetical embedding
- Bridges semantic gap between questions and answers

**2. Query Decomposition & Multi-Hop Reasoning**
- Break complex queries into atomic sub-queries
- Execute sub-queries in optimal order (parallel or sequential)
- Aggregate and synthesize results
- Handle comparative queries, procedural queries, list-building

**3. Step-Back Prompting**
- Ask high-level conceptual questions first
- Derive principles before specifics
- Better context for complex reasoning

**4. Self-RAG (Self-Reflective RAG)**
- Retrieve token: Should I retrieve documents?
- ISREL token: Are documents relevant?
- ISSUP token: Is answer supported by documents?
- ISUSE token: Is answer useful to the user?

**5. Chain-of-Thought Tool Planning**
- Reason about which tools to use
- Plan execution order and dependencies
- Consider tool capabilities and limitations
- Adaptive routing based on query complexity

### Implementation Philosophy

**Foundation First**
- Build core systems correctly from the start
- Don't rush to features
- One working end-to-end flow to validate architecture
- Iterative refinement

**Pluggable Domains**
- No hardcoded game logic in MCP server
- Configuration-driven domain support
- Generic abstractions (documents, entities, rules)
- Easy to add new knowledge domains

**IP-Agnostic Design**
- Domain concepts configurable via files
- No Warhammer-specific code in core systems
- Ingestion pipelines accept generic inputs
- Tools work with any knowledge domain

---

## Success Criteria

### Must Have (MVP)

1. ✅ **Context System Foundation**
   - HyDE query transformation working
   - Query decomposition for complex queries
   - At least 2 sub-query execution strategies (sequential, parallel)

2. ✅ **Tool Planning Engine**
   - LLM-powered tool selection
   - Confidence-based routing
   - Tool chain execution with context passing

3. ✅ **Self-RAG Validation**
   - Document relevance checking
   - Answer support verification
   - Hallucination detection
   - Confidence scoring

4. ✅ **MCP Server**
   - Standalone Docker container
   - Exposes resources (documents, entities)
   - Exposes tools (search, ingest, validate)
   - Pluggable domain configuration

5. ✅ **One Complete Flow**
   - End-to-end query processing
   - From user question → validated answer
   - Demonstrates all patterns working together

### Should Have (V1.0)

- Multiple domain configurations tested
- Extended conversation context
- Long-term memory persistence
- Comprehensive error handling
- Basic observability (logging, metrics)

### Nice to Have (Future)

- Self-learning from corrections
- Advanced multi-agent collaboration
- Cross-domain reasoning
- Performance optimizations

---

## Implementation Phases

### Phase 1: Foundation (Current Epic)
**Goal**: Working context system with modern RAG patterns

- ARB-002: Context System Foundation
- ARB-003: Tool Planning Engine
- ARB-004: Self-RAG Validation Layer
- ARB-005: MCP Server Foundation
- ARB-006: Ingestion Pipeline Migration
- ARB-007: Integration & Testing

### Phase 2: Features (Future Epic)
- Multiple domain support
- Advanced context features
- Performance optimization
- Production hardening

### Phase 3: Scale (Future Epic)
- Multi-client support
- Distributed deployment
- Advanced analytics
- Self-improvement capabilities

---

## Technical Risks & Mitigations

### Risks

1. **Complexity Explosion**
   - Risk: Too many patterns make system fragile
   - Mitigation: Start with one pattern at a time, validate, iterate

2. **Performance Degradation**
   - Risk: Multiple LLM calls slow down responses
   - Mitigation: Caching, parallel execution, confidence thresholds for skipping steps

3. **Over-Engineering**
   - Risk: Building generic system is harder than specific one
   - Mitigation: Start with one domain (existing game data), generalize after validation

4. **Validation False Positives**
   - Risk: Self-RAG rejects correct answers
   - Mitigation: Tunable thresholds, human-in-the-loop for edge cases

### Assumptions

- BattleScribe ingestion code is portable
- Vector DB performance remains acceptable with new patterns
- MCP protocol is stable enough for production use
- LLM costs are acceptable for personal project

---

## Dependencies

### Technical Dependencies

- **MCP SDK**: @modelcontextprotocol/sdk ^1.17.5
- **Anthropic SDK**: @anthropic-ai/sdk ^0.62.0
- **Qdrant**: Vector database ^1.7.4
- **Ollama**: Local embeddings service
- **Docker**: Container orchestration

### Knowledge Dependencies

- Research on HyDE implementation patterns
- Self-RAG paper and reference implementations
- MCP server best practices
- Query decomposition strategies

### External Dependencies

- None (self-contained personal project)

---

## Migration Strategy

### Reuse from Cogitator

**Direct Copy (Minimal Changes)**
- Ingestion pipelines (BattleScribe, PDF)
- Vector DB schemas and configs
- Docker compose setups
- Ollama embedding integration

**Modify & Migrate**
- Tool implementations (remove IP refs)
- MCP tool framework (move to server)
- Prompt templates (make domain-agnostic)

**Rebuild from Scratch**
- Query processing pipeline
- Context management system
- Validation layer
- Tool planning logic
- Agent orchestration

### Migration Steps

1. Copy working infrastructure (ingestion, DB, Docker)
2. Remove IP-specific references (hardcoded URLs → config files)
3. Build new context system alongside old code
4. Validate with subset of test queries
5. Deprecate old query processing
6. Full integration testing

---

## Measuring Success

### Quantitative Metrics

- **Query Success Rate**: >90% of test queries return valid answers
- **Validation Accuracy**: >95% of answers marked "supported" are actually supported
- **Response Time**: <5 seconds for simple queries, <15 seconds for complex
- **Hallucination Rate**: <5% of responses contain unsupported claims

### Qualitative Metrics

- Code is maintainable and well-documented
- Easy to add new domains (can configure new domain in <1 hour)
- Clear separation of concerns
- Patterns are reusable for future projects

---

## References

### Research Papers
- HyDE: Hypothetical Document Embeddings (Gao et al.)
- Self-RAG: Self-Reflective RAG (Asai et al., 2023)
- MultiHop-RAG: Multi-Hop Query Benchmarks (2024)
- Chain-of-Thought Prompting (Wei et al.)

### Implementation Resources
- LangChain Self-RAG examples
- Haystack HyDE implementation
- MCP server specifications
- Qdrant best practices

### Cogitator Documentation
- `/docs/ARCHITECTURE.md` - Current architecture
- `/docs/VECTOR_DB_IMPLEMENTATION_40K.md` - Vector DB setup
- `/docs/MCP_TOOLS_GUIDE.md` - Tool development
- Analysis documents in `.claude/aiContext/refactorPlan/`

---

## Next Steps

1. Review and approve epic with stakeholder (@kmoffett)
2. Create detailed tickets (ARB-002 through ARB-007)
3. Set up Arbiter repository structure
4. Begin ARB-002: Context System Foundation

---

**Last Updated**: 2025-10-20
**Epic Owner**: @kmoffett
**Status**: Planning → Ready for Development
