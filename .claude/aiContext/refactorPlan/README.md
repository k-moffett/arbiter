# Arbiter Refactor Plan

**Project**: Cogitator → Arbiter Refactor
**Created**: 2025-10-20
**Status**: Planning Complete, Ready for Implementation
**Owner**: @kmoffett

---

## Overview

This directory contains the complete refactor plan for transforming Cogitator into Arbiter - a next-generation RAG assistant with modern patterns including HyDE, Self-RAG validation, and intelligent tool planning.

---

## Quick Start

**If you're starting work on Arbiter, read in this order:**

1. **[epic.md](epic.md)** - Start here. Understand the problem, goals, and architecture vision.
2. **[reusable-analysis.md](reusable-analysis.md)** - See what can be copied from Cogitator vs rebuilt.
3. **[architecture-overview.md](architecture-overview.md)** - Deep dive into the new architecture.
4. **[tickets/](./tickets/)** - Implementation roadmap (ARB-001 through ARB-007).

---

## Document Index

### Core Documents

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [epic.md](epic.md) | Epic description: problem statement, goals, technical approach, success criteria | 15 min |
| [reusable-analysis.md](reusable-analysis.md) | Component-by-component analysis: what to copy, modify, or rebuild | 20 min |
| [architecture-overview.md](architecture-overview.md) | Detailed architecture: HyDE, Self-RAG, tool planning, MCP server | 30 min |

### Implementation Tickets

| Ticket | Description | Status | Effort |
|--------|-------------|--------|--------|
| [ARB-001](tickets/ARB-001-base-repo-setup.md) | Base repository setup | ✅ COMPLETE | 2-4h |
| [ARB-002](tickets/ARB-002-context-system.md) | Context system with HyDE, query decomposition, step-back | 🔶 READY | 25-30h |
| [ARB-003](tickets/ARB-003-tool-planning.md) | Tool planning engine with LLM-powered selection | 🔶 READY | 12-15h |
| [ARB-004](tickets/ARB-004-validation-system.md) | Self-RAG validation with hallucination detection | 🔶 READY | 18-20h |
| [ARB-005](tickets/ARB-005-mcp-server.md) | MCP server foundation with tools/resources | 🔶 READY | 10-12h |
| [ARB-006](tickets/ARB-006-ingestion-migration.md) | Migrate BattleScribe & PDF ingestion | 🔶 READY | 8-10h |
| [ARB-007](tickets/ARB-007-integration-testing.md) | End-to-end testing and validation | 🔶 READY | 10-12h |

**Total Effort**: ~85-103 hours (~2.5 weeks full-time)

---

## Key Decisions

### Architecture Decisions

1. **Foundation First**: Build context system correctly before features
2. **Pluggable Domain Server**: MCP server supports multiple domains via config
3. **Migrate Ingestion As-Is**: BattleScribe & PDF ingestion work well, just remove IP refs
4. **Self-Validation**: Every answer validated before returning to user

### Technology Stack

- **TypeScript 5.7** + **Node.js 22+**
- **MCP SDK** for server architecture
- **Anthropic Claude** for reasoning & validation
- **Ollama** for local embeddings
- **Qdrant** for vector database
- **Docker** for containerization

### Modern RAG Patterns

1. **HyDE (Hypothetical Document Embeddings)**: Generate hypothetical answer → embed → search for real documents
2. **Query Decomposition**: Break complex queries into atomic sub-queries
3. **Step-Back Prompting**: Ask high-level questions first for context
4. **Self-RAG**: Validate answers against sources (ISREL, ISSUP, ISUSE tokens)
5. **Tool Planning**: LLM-powered tool selection with chain-of-thought reasoning

---

## Implementation Roadmap

### Phase 1: Foundation (This Epic - ARB-EPIC-001)

**Goal**: Working context system with modern RAG patterns

```
Week 1: Foundation Infrastructure
├── Day 1-2: Validate ARB-001 (base repo)
├── Day 3-5: ARB-002 Phase 1-2 (HyDE + Query Decomposition)

Week 2: Context System & Tool Planning
├── Day 1-2: ARB-002 Phase 3-5 (Step-Back + Memory + Testing)
├── Day 3-5: ARB-003 (Tool Planning Engine)

Week 3: Validation & MCP Server
├── Day 1-3: ARB-004 (Self-RAG Validation)
├── Day 4-5: ARB-005 (MCP Server)

Week 4: Ingestion & Testing
├── Day 1-2: ARB-006 (Ingestion Migration)
├── Day 3-5: ARB-007 (Integration & Testing)
```

**Deliverables**:
- ✅ Working context system (HyDE, decomposition, step-back)
- ✅ Tool planning engine
- ✅ Self-RAG validation layer
- ✅ MCP server with tools/resources
- ✅ Migrated ingestion pipelines
- ✅ End-to-end validated flow

### Phase 2: Features (Future Epic)
- Multiple domain support tested
- Advanced context features (long-term memory)
- Performance optimizations
- Production hardening

### Phase 3: Scale (Future Epic)
- Multi-client support
- Distributed deployment
- Advanced analytics
- Self-improvement

---

## Success Criteria

### MVP (End of Phase 1)

- [ ] Query success rate: >90%
- [ ] Validation accuracy: >95%
- [ ] Response time: <5s simple, <15s complex
- [ ] Hallucination rate: <5%
- [ ] One complete end-to-end flow working
- [ ] MCP server accessible to clients
- [ ] Documentation complete

---

## What's Reusable from Cogitator

### ✅ Direct Copy (Excellent Work)

**Vector Database Layer** - 2h copy
- QdrantVectorRepository
- OllamaEmbeddingService
- Vector schemas and configs

**Ingestion Pipelines** - 3h copy
- BattleScribeCatParser (excellent work!)
- BattleScribeAdapter
- PDFParser
- Semantic chunking

**MCP Tool Framework** - 2h copy
- BaseMcpTool
- McpToolRegistry
- McpToolExecutor

**Infrastructure** - 2h copy
- Docker configs
- Shared utilities
- Logger

**Total**: ~9 hours of direct copy

### 🔄 Modify & Migrate

**Ingestion Configuration** - 24h
- Remove web scraping for PDF discovery
- Make BattleScribe ingestion config-driven
- Remove hardcoded Warhammer URLs

**MCP Server Adaptation** - 15h
- Convert in-process MCP to standalone server
- Domain plugin system
- Tool/resource exposure

**Total**: ~39 hours of modification

### ❌ Rebuild from Scratch

**Context System** - 30h
- HyDE implementation
- Query decomposition
- Step-back prompting
- Advanced memory management

**Query Processing** - 40h
- Tool planning engine
- Self-RAG validation
- Answer synthesis
- Confidence gating

**Total**: ~70 hours of new development

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complexity overload | High | Build incrementally, test each phase |
| Performance degradation | Medium | Parallel execution, caching, thresholds |
| Over-engineering | Medium | Start with one domain, generalize after validation |
| Validation false positives | Medium | Tunable thresholds, human-in-loop for edge cases |
| HyDE degrades simple queries | Low | Heuristics for when to use HyDE |

---

## Performance Targets

**Response Times** (95th percentile):
- Simple query: <3 seconds
- Complex query: <10 seconds
- List building: <15 seconds

**Accuracy**:
- Validation accuracy: >95%
- Hallucination rate: <5%
- Query success rate: >90%

**Validation Overhead**:
- <1 second per query
- Parallel validation checks where possible

---

## Known Issues (To Be Discovered)

This section will be updated during ARB-007 (Integration Testing) with:
- Bugs found during testing
- Performance bottlenecks
- Edge cases not handled
- Recommendations for fixes

---

## Research References

### Papers
- **HyDE**: "Precise Zero-Shot Dense Retrieval without Relevance Labels" (Gao et al.)
- **Self-RAG**: "Self-Reflective Retrieval-Augmented Generation" (Asai et al., 2023)
- **MultiHop-RAG**: "Benchmarking Retrieval-Augmented Generation for Multi-Hop Queries" (2024)
- **Chain-of-Thought**: "Chain-of-Thought Prompting Elicits Reasoning in LLMs" (Wei et al.)

### Implementation Resources
- LangChain Self-RAG: https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_self_rag/
- Haystack HyDE: https://docs.haystack.deepset.ai/docs/hypothetical-document-embeddings-hyde
- MCP Specification: https://modelcontextprotocol.io/

### Cogitator Documentation
- `/docs/ARCHITECTURE.md` - Current architecture
- `/docs/VECTOR_DB_IMPLEMENTATION_40K.md` - Vector DB patterns
- `/docs/MCP_TOOLS_GUIDE.md` - Tool development
- Agent analysis in this directory

---

## Next Steps

### Immediate (After Reading This)

1. **Validate ARB-001**: Ensure base repo is set up correctly
2. **Start ARB-002**: Begin context system implementation
3. **Set up tracking**: Create project board or issue tracker

### Weekly Reviews

1. **End of Week 1**: Review context system progress
2. **End of Week 2**: Review tool planning integration
3. **End of Week 3**: Review validation & MCP server
4. **End of Week 4**: Review integration tests, create issues for bugs

### After Phase 1

1. Review all known issues from ARB-007
2. Prioritize fixes vs features
3. Plan Phase 2 (Features) epic
4. Consider: What domain to add next?

---

## Questions & Support

**Have questions while implementing?**

1. Check the ticket's "Technical Details" section
2. Review the architecture-overview.md for patterns
3. Reference Cogitator code (file paths provided in tickets)
4. Document decisions in ticket or create follow-up ticket

**Found an issue with the plan?**

- Create a ticket: `ARB-XXX-plan-fix-[issue]`
- Update relevant documents
- Note: Plans are living documents, iterate as needed

---

## Document Change Log

| Date | Change | Docs Updated |
|------|--------|--------------|
| 2025-10-20 | Initial refactor plan created | All |

---

## File Structure

```
.claude/aiContext/refactorPlan/
├── README.md                           # This file
├── epic.md                             # Epic description
├── reusable-analysis.md                # Component reusability analysis
├── architecture-overview.md            # Detailed architecture design
└── tickets/
    ├── ARB-001-base-repo-setup.md
    ├── ARB-002-context-system.md
    ├── ARB-003-tool-planning.md
    ├── ARB-004-validation-system.md
    ├── ARB-005-mcp-server.md
    ├── ARB-006-ingestion-migration.md
    └── ARB-007-integration-testing.md
```

---

## Acknowledgments

**Excellent Work from Cogitator:**
- BattleScribe parsing (nearly perfect, keep as-is)
- Vector DB integration (clean, performant)
- MCP tool framework (good foundation)
- Docker setup (works well)

**Key Improvements in Arbiter:**
- Modern RAG patterns (HyDE, Self-RAG)
- Validation and hallucination detection
- IP-agnostic design
- MCP server architecture

---

**Last Updated**: 2025-10-20
**Status**: ✅ Planning Complete, Ready for Implementation
**Next Action**: Start ARB-002 (Context System Foundation)

---

Good luck! 🚀
