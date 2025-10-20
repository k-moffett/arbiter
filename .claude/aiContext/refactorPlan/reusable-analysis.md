# Reusable Components Analysis: Cogitator → Arbiter

**Document Version**: 1.0
**Last Updated**: 2025-10-20
**Purpose**: Identify what can be reused, what needs modification, and what must be rebuilt

---

## Overview

Cogitator has significant well-architected components that can be migrated to Arbiter with minimal changes. This document provides a comprehensive analysis of each major component and migration strategy.

---

## Component Categories

### ✅ Direct Reuse (Copy with Minimal Changes)

These components are well-designed, tested, and can be used as-is or with minor configuration changes.

### 🔄 Modify & Migrate

These components have good architecture but contain IP-specific references or need adaptation for the new architecture.

### ❌ Rebuild from Scratch

These components have fundamental design issues or don't align with the new architecture patterns.

---

## Detailed Component Analysis

## 1. VECTOR DATABASE LAYER ✅

### Status: **DIRECT REUSE**

**Files to Copy:**
```
src/vector/
├── config/
│   └── OllamaConfig.ts                    ✅ Copy as-is
├── domain/
│   ├── entities/VectorDocument.ts         ✅ Copy as-is
│   └── valueObjects/                      ✅ Copy as-is
├── repositories/
│   ├── interfaces/
│   │   ├── IVectorRepository.ts           ✅ Copy as-is
│   │   └── IDocumentRepository.ts         ✅ Copy as-is
│   └── implementations/
│       ├── QdrantVectorRepository.ts      ✅ Copy as-is
│       └── QdrantDocumentRepository.ts    ✅ Copy as-is
└── services/
    ├── implementations/
    │   ├── OllamaEmbeddingService.ts      ✅ Copy as-is
    │   └── OllamaNLPService.ts            ✅ Copy as-is
    └── interfaces/
        ├── IEmbeddingService.ts           ✅ Copy as-is
        └── IIngestionService.ts           ✅ Copy as-is
```

**Why Direct Reuse:**
- Clean repository pattern implementation
- Well-abstracted interfaces
- No IP-specific logic
- Already domain-agnostic
- Performance tested and validated

**Migration Notes:**
- Keep the same directory structure
- Update import paths
- No logic changes needed

**Testing Priority:** LOW (already validated)

---

## 2. INGESTION PIPELINES 🔄

### Status: **MODIFY & MIGRATE**

### A. BattleScribe Ingestion ✅ (95% Reusable)

**Files to Migrate:**
```
src/scripts/ingestGitHubRepo.ts            🔄 Minor changes
src/mcp/40k/parsers/
├── BattleScribeCatParser.ts               ✅ Copy as-is (excellent work)
├── BattleScribeAdapter.ts                 ✅ Copy as-is
└── ParserConfig.ts                        🔄 Make domain-agnostic
```

**Changes Required:**
1. **Configuration-driven**
   - Move GitHub repo URLs to config file
   - Currently: Hardcoded to Warhammer repos
   - After: Read from `domains/{domain-name}/sources.json`

2. **Generic naming**
   - Rename: `40k` → `domain` or keep as example
   - Parser logic is already generic (works with any BattleScribe XML)

**Example Config:**
```json
{
  "domain": "warhammer-40k",
  "sources": {
    "battlescribe": {
      "repos": [
        {
          "url": "https://github.com/BSData/wh40k-10e",
          "branch": "main",
          "catalogPath": "Warhammer 40,000.gst"
        }
      ]
    }
  }
}
```

**Migration Effort:** LOW (2-3 hours)
**Testing Priority:** MEDIUM (validate with new config structure)

---

### B. PDF Ingestion 🔄 (90% Reusable)

**Files to Migrate:**
```
src/scripts/
├── ingestCoreRules.ts                     🔄 Moderate changes
├── updateCoreRules.ts                     🔄 Moderate changes
└── ingestWarhammerCommunity.ts            🔄 Moderate changes

src/core/services/PDFParser.ts             ✅ Copy as-is

src/mcp/40k/services/
├── WarhammerCommunityPdfIngestionService.ts  🔄 Remove web scraping
├── CoreRulesProcessor.ts                  ✅ Copy as-is (rename generic)
└── GitHubRepoProcessor.ts                 ✅ Copy as-is
```

**Changes Required:**

1. **Remove Web Scraping**
   - Currently: Scrapes Warhammer Community for PDF links
   - After: Read PDF URLs from config file
   - Delete: Puppeteer scraping logic for PDF discovery

2. **User-Provided PDF Sources**
   ```json
   {
     "domain": "warhammer-40k",
     "sources": {
       "pdfs": [
         {
           "name": "Core Rules 10th Edition",
           "url": "https://example.com/core-rules.pdf",
           "type": "rules"
         },
         {
           "name": "Munitorum Field Manual Q2 2024",
           "url": "https://example.com/munitorum.pdf",
           "type": "points"
         }
       ]
     }
   }
   ```

3. **Generic PDF Processing**
   - Keep: Chunking logic (semantic via Ollama)
   - Keep: Embedding generation
   - Keep: Vector storage
   - Change: Domain-specific metadata extraction → configurable

**Files to Delete:**
- Web scraping for PDF discovery (not needed)

**Migration Effort:** MEDIUM (4-6 hours)
**Testing Priority:** HIGH (ensure PDF processing still works)

---

### C. Wahapedia Integration 🔄 (70% Reusable, Low Priority)

**Files:**
```
src/mcp/40k/services/puppeteer/
├── WahpediaPuppeteerScraper.ts            🔄 Keep for reference
├── BrowserService.ts                      ✅ Generic, reusable
└── wahapedia/extractors/                  🔄 IP-specific
```

**Decision:**
- Keep BrowserService (generic Puppeteer wrapper)
- Move Wahapedia-specific code to examples or extensions
- NOT part of core Arbiter (domain-specific extension)

**Migration Effort:** LOW (just refactor structure)
**Testing Priority:** LOW (not in MVP)

---

## 3. CONTEXT MANAGEMENT SYSTEM ❌

### Status: **REBUILD FROM SCRATCH**

**Files to Review (Don't Copy):**
```
src/context/
├── ContextManager.ts                      ❌ Rebuild
├── models/ChannelContext.ts               ❌ Rebuild
├── strategies/
│   ├── SmartContextStrategy.ts            ❌ Rebuild
│   ├── ThreadAwareContextStrategy.ts      ❌ Rebuild
│   ├── HybridContextStrategy.ts           ❌ Rebuild
│   └── SemanticContextFilter.ts           ❌ Rebuild
├── services/
│   ├── SessionManager.ts                  ❌ Rebuild
│   └── SessionPersistence.ts              🔄 Keep storage logic
└── storage/JsonlStorage.ts                ✅ Keep (storage impl is good)
```

**Why Rebuild:**
1. **Missing Modern Patterns**
   - No HyDE support
   - No query decomposition
   - No multi-hop reasoning
   - Limited conversation understanding

2. **Architecture Mismatch**
   - Designed for Discord-specific context
   - Not MCP-compatible
   - Tight coupling to channel model

3. **Fundamental Design Issues**
   - Context selection is too simple
   - No long-term memory
   - No self-reflection capabilities
   - Missing validation integration

**What to Keep:**
- ✅ `JsonlStorage.ts` - Storage implementation is solid
- ✅ Storage format (JSONL) - Works well
- ✅ Session persistence concepts - Good foundation

**New Context System Design:**
See `architecture-overview.md` for new design incorporating HyDE, query decomposition, and Self-RAG.

**Migration Effort:** HIGH (20-30 hours)
**Testing Priority:** CRITICAL (core of refactor)

---

## 4. QUERY PROCESSING & AGENT LAYER ❌

### Status: **REBUILD FROM SCRATCH**

**Files to Review (Don't Copy):**
```
src/agent/
├── Agent.ts                               ❌ Rebuild
├── OrchestratorAgent.ts                   ❌ Rebuild (some patterns useful)
├── processors/RequestProcessor.ts         ❌ Rebuild
├── services/
│   ├── AnthropicService.ts                ✅ Keep (API wrapper is good)
│   ├── AnthropicQueryRouter.ts            ❌ Rebuild (but keep concept)
│   ├── OrchestratorService.ts             ❌ Rebuild
│   ├── PlanExecuteOrchestrator.ts         ❌ Rebuild
│   ├── PromptBuilder.ts                   🔄 Keep strategy pattern
│   └── context/
│       ├── ContextAnalyzer.ts             ❌ Rebuild (basic analysis)
│       ├── ReferenceResolver.ts           🔄 Keep patterns, rebuild impl
│       └── ConversationStateService.ts    ❌ Rebuild
└── utils/
    └── McpToAnthropicToolConverter.ts     ✅ Keep (utility is solid)
```

**Why Rebuild:**
1. **Fundamental Query Processing Flaws** (per original problem statement)
2. **No Tool Planning** - Hardcoded tool selection
3. **No Validation** - No Self-RAG patterns
4. **Dual Orchestration** - Two competing systems (Anthropic vs Ollama)

**What to Keep:**
- ✅ `AnthropicService.ts` - API wrapper works well
- ✅ `McpToAnthropicToolConverter.ts` - Utility is useful
- 🔄 Strategy pattern from `PromptBuilder.ts` - Good design
- 🔄 Reference resolution patterns from `ReferenceResolver.ts` - Good ideas

**Concepts to Preserve:**
- Multi-strategy search (semantic + keyword + hybrid)
- Query expansion
- Confidence scoring
- Self-correction loops (iterate if low confidence)

**New Implementation:**
Will incorporate HyDE, query decomposition, step-back prompting, and Self-RAG validation.

**Migration Effort:** CRITICAL (30-40 hours)
**Testing Priority:** CRITICAL (core of refactor)

---

## 5. MCP TOOLS & SERVER FOUNDATION 🔄

### Status: **MODIFY & MIGRATE**

**Files to Migrate:**
```
src/mcp/
├── ServiceBootstrap.ts                    🔄 Adapt for server mode
├── tools/
│   ├── core/
│   │   ├── BaseMcpTool.ts                 ✅ Copy as-is (excellent design)
│   │   ├── McpToolRegistry.ts             ✅ Copy as-is
│   │   └── McpToolExecutor.ts             ✅ Copy as-is
│   ├── adapter/McpToolAdapter.ts          ✅ Copy as-is
│   └── implementations/
│       ├── generic/
│       │   └── HealthCheckTool.ts         ✅ Copy as-is
│       └── warhammer40k/                  🔄 Move to domain plugin
├── transport/jsonrpc/                     ✅ Copy entire directory
├── prompts/                               🔄 Make domain-agnostic
└── schemas/                               🔄 Make domain-agnostic
```

**Changes Required:**

1. **MCP Server Mode**
   - Currently: In-process MCP (tools in same process as bot)
   - After: Standalone MCP server (separate Docker container)
   - Keep: All tool infrastructure (BaseMcpTool, registry, executor)
   - Add: MCP server transport layer (stdio or HTTP)

2. **Domain Plugins**
   - Move `warhammer40k/` tools to `domains/warhammer-40k/tools/`
   - Keep generic tools in core server
   - Load domain tools dynamically based on config

3. **Tool Examples (Keep These):**
   ```
   Generic Tools (Core):
   - HealthCheckTool
   - VectorSearchTool (generic)
   - VectorIngestionTool (generic)

   Domain-Specific (Plugin):
   - VectorUnitLookupTool (Warhammer-specific)
   - FactionValidationTool (Warhammer-specific)
   - RulesLookupTool (rename to DocumentLookupTool, make generic)
   ```

**Migration Effort:** MEDIUM-HIGH (10-15 hours)
**Testing Priority:** HIGH (foundation for new architecture)

---

## 6. DOCKER & INFRASTRUCTURE ✅

### Status: **DIRECT REUSE**

**Files to Copy:**
```
docker-compose.yml                         ✅ Copy, extend for MCP server
docker-compose.dev.yml                     ✅ Copy as-is
docker-compose.vector.yml                  ✅ Copy as-is
Dockerfile                                 ✅ Copy as-is
scripts/
├── start-dev.sh                           ✅ Copy as-is
├── stop-dev.sh                            ✅ Copy as-is
├── start-vector-db.sh                     ✅ Copy as-is
└── setup-ollama-chunking.sh               ✅ Copy as-is
```

**Changes Required:**
1. Add new service to docker-compose:
   ```yaml
   arbiter-mcp-server:
     build: ./mcp-server
     ports:
       - "3100:3100"  # MCP server port
     depends_on:
       - qdrant
       - ollama
   ```

**Migration Effort:** LOW (2-3 hours)
**Testing Priority:** MEDIUM

---

## 7. SHARED UTILITIES & TYPES ✅

### Status: **DIRECT REUSE**

**Files to Copy:**
```
src/shared/
├── logger/                                ✅ Copy entire directory
├── types/                                 🔄 Review and update
├── interfaces/                            🔄 Keep generic ones
├── enums/                                 🔄 Move domain-specific to plugins
├── constants/                             🔄 Move domain-specific to plugins
└── utils/                                 ✅ Copy as-is
```

**Changes Required:**
- Move game-specific enums/constants to domain plugins
- Keep generic utilities
- Update type definitions for new architecture

**Migration Effort:** LOW (2-4 hours)
**Testing Priority:** LOW

---

## 8. TESTING INFRASTRUCTURE 🔄

### Status: **MODIFY & MIGRATE**

**Files to Review:**
```
test/
├── setup/integration-setup.ts             ✅ Keep and extend
├── integration/                           🔄 Update for new arch
└── unit/                                  ❌ Rebuild (tied to old code)

jest.config.mjs                            ✅ Copy as-is
```

**Strategy:**
- Keep test infrastructure (Jest, setup)
- Rebuild test suites for new components
- Add validation-specific tests (Self-RAG)
- Add MCP server tests

**Migration Effort:** MEDIUM (ongoing with development)
**Testing Priority:** HIGH

---

## Migration Summary

### By Priority

**P0 - Copy First (Foundation)**
1. Vector Database Layer (src/vector/) - 2 hours
2. Docker & Infrastructure - 3 hours
3. Shared Utilities - 2 hours
4. MCP Tool Framework (BaseMcpTool, Registry, Executor) - 2 hours

**Estimated Time:** 9 hours

---

**P1 - Modify & Migrate (Domain Integration)**
1. BattleScribe Ingestion - 3 hours
2. PDF Ingestion - 6 hours
3. MCP Server Adaptation - 15 hours

**Estimated Time:** 24 hours

---

**P2 - Rebuild (Core Systems)**
1. Context System with HyDE - 30 hours
2. Query Processing Pipeline - 40 hours
3. Tool Planning Engine - 15 hours
4. Self-RAG Validation - 20 hours

**Estimated Time:** 105 hours

---

### Total Effort Estimate

- **Direct Reuse:** ~9 hours (copy + validate)
- **Modify & Migrate:** ~24 hours (adapt for new arch)
- **Rebuild:** ~105 hours (new implementation)

**Total:** ~138 hours (~3.5 weeks at 40 hrs/week)

---

## Migration Checklist

### Week 1: Foundation
- [ ] Copy vector database layer
- [ ] Copy Docker infrastructure
- [ ] Copy shared utilities
- [ ] Set up MCP tool framework
- [ ] Validate all infrastructure works in new repo

### Week 2: Context System
- [ ] Design new context system architecture
- [ ] Implement HyDE query transformation
- [ ] Implement query decomposition
- [ ] Implement step-back prompting
- [ ] Test context system in isolation

### Week 3: Query Processing & Tool Planning
- [ ] Rebuild query processing pipeline
- [ ] Implement tool planning engine
- [ ] Integrate with context system
- [ ] Test tool selection and execution

### Week 4: Validation & Integration
- [ ] Implement Self-RAG validation layer
- [ ] Integrate all components
- [ ] Migrate ingestion pipelines
- [ ] End-to-end testing
- [ ] Documentation

---

## Risk Mitigation

### High-Risk Migrations

**1. Context System Rebuild**
- Risk: Complexity could delay entire project
- Mitigation: Start with minimal viable implementation, iterate
- Fallback: Use simpler context system from Cogitator temporarily

**2. MCP Server Architecture**
- Risk: New architecture pattern, untested
- Mitigation: Build standalone server first, test thoroughly before integration
- Fallback: Keep in-process MCP tools initially

**3. Ingestion Pipeline Changes**
- Risk: Breaking data quality
- Mitigation: Test with small dataset first, validate output matches Cogitator
- Fallback: Keep Cogitator running for comparison

---

## Files Reference

### Complete File Listing by Category

**Direct Reuse (Copy As-Is):** 42 files
**Modify & Migrate:** 28 files
**Rebuild from Scratch:** 35 files
**Delete/Don't Copy:** 18 files

See appendix for complete file-by-file breakdown.

---

**Last Updated**: 2025-10-20
**Next Review**: After ARB-002 completion
