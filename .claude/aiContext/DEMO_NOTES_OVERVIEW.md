---
title: Arbiter Demo - Talking Points
type: demo-notes
tags:
  - arbiter
  - demo
  - architecture
  - rag
  - presentation
  - microservices
date: 2025-10-24
version: 1.0
duration: 10-15 minutes
audience: technical-leads, architects
status: ready
---

# Arbiter Demo - Talking Points

> [!info] Demo Info
> **Duration**: 10-15 minutes
> **Audience**: Technical Leads, Architects, Contributors
> **Format**: Live demo with code examples

---

## Opening (1-2 min)

**What is Arbiter?**

- Domain-agnostic AI agent framework built on RAG principles
- Zero hardcoded domain logic - works for legal docs, medical records, game rules, anything
- Containerized microservices with production-ready vector search
- Open-source foundation for building custom agents

> [!tip] Key Differentiator
> **Configuration over code** - same system works across any knowledge domain

---

## Architecture Overview (2-3 min)

**Four Layers** (Request Flow):

1. **Client Layer**
   - CLI client (oclif + beautiful terminal UI)
   - Discord bot (planned)
   - Direct user interfaces

2. **Agent Orchestrator** (Its own server/container/layer)
   - Port 3200
   - RAG pipeline, query routing, intelligence
   - 18 RAG components: decomposition, search, validation, quality grading

3. **MCP Server** (Tools and resource definitions)
   - Port 3100
   - JSON-RPC protocol with streamable HTTP
   - Tool registry, resource access

4. **Data Layer**
   - Qdrant (Port 6333) - Vector database
   - Ollama (Port 11434) - Local LLM serving
   - PostgreSQL (planned) - Context persistence

**Architecture Pattern**: Containerized microservices with dynamic agent spawning

> [!note] Request Flow
> Client → Agent Orchestrator → MCP Server → Data (Qdrant)

---

## Key Technologies (1 min)

- **Language**: TypeScript 5.7 (strict mode), Node.js 22+
- **AI/ML**: Anthropic Claude, OpenAI, Ollama (local), nomic-embed-text (768d)
- **Vector DB**: Qdrant with HNSW indexing
- **Infrastructure**: Docker Compose, Express, MCP SDK
- **Design Patterns**: Strategy (LLM providers), Repository (data access), Factory (RAG components), DI (Inversify)

---

## Domain-Agnostic Design (1 min)

**Core Principle**: Zero hardcoded domain logic

**Configuration Sources**:

1. Environment variables (`.env`) - Service URLs, API keys, models
2. Config files (`config/`) - LLM mappings, extraction rules
3. Runtime user input - Collection names, document URLs

**Example**: Same codebase runs Warhammer 40K rules bot AND legal document analyzer

---

## Client Layer - CLI (1 min)

**Terminal Interface**:

- Built with oclif framework (industry-standard CLI tool)
- Beautiful UI via Clack prompts (spinners, selections, input)
- Rich markdown rendering with syntax highlighting
- Non-blocking async operations

**Features**:

- Conversation history and context management
- Session persistence across restarts
- Commands: chat, history, config
- Graceful error handling and user feedback

**Entry**: User types query → CLI captures → Sends to Agent Orchestrator

---

## Agent Orchestrator - RAG Pipeline (2-3 min)

**Core Intelligence Layer** (Port 3200)

**11-Step RAG Process**:

1. Query decomposition (break complex queries into subqueries)
2. Query routing (complexity analysis, simple vs complex path)
3. Query enhancement (add conversation context)
4. Collection selection (multi-tenant, which collections to search)
5. Hybrid search (semantic 80% + keyword 20%)
6. Multi-collection retrieval (parallel searches)
7. RAG validation (relevance check, hallucination detection)
8. Quality grading (Self-RAG pattern, scores relevance/completeness/accuracy)
9. Context window management (12K token limit, 512 token response buffer)
10. Prompt building (construct LLM prompt with retrieved docs)
11. Personality application (4 tones: none, analytical, casual, expert)

**Key Components**:

- `QueryDecomposer`, `QueryRouter`, `QueryEnhancer`
- `HybridSearchRetriever`, `MultiCollectionRetriever`, `CollectionSelector`
- `RAGValidator`, `QualityGrader`
- `ContextWindowManager`, `AdvancedPromptBuilder`, `PersonalityProvider`

**Output**: Constructed prompt with validated context → Sends to MCP Server for tool execution

---

## MCP Server (1 min)

**Tools and Resource Layer** (Port 3100)

**Protocol**: JSON-RPC with streamable HTTP transport

**Tool Registry** (Exposes to Agent Orchestrator):

- `vector-search` - Semantic search in Qdrant collections
- `ingest-document` - Add documents to vector database
- `validate-answer` - Check answer quality and relevance
- Resource access methods

**Features**:

- Request routing and timeout management
- Concurrent request handling (max 50)
- Health checks with memory tracking
- Transports: Stdio (CLI) and StreamableHTTP (Discord/web)

**Output**: Executes tools against Data Layer → Returns results to Agent Orchestrator

---

## Data Layer (1 min)

**Storage and Models** (Ports 6333, 11434)

**Qdrant** (Port 6333):

- Vector database with HNSW indexing
- Stores 768-dimensional embeddings
- Semantic similarity search
- Collection-based multi-tenancy

**Ollama** (Port 11434):

- Local LLM serving (Llama 3.1, Qwen, Phi)
- Embedding generation (nomic-embed-text)
- Model warming on startup (reduces first-request latency)
- GPU acceleration support

**PostgreSQL** (Planned):

- Context persistence
- Session management
- Query history

**Output**: Search results with relevance scores → Returns to MCP Server

---

## Performance Metrics (Quote These!)

> [!quote] Key Performance Numbers

**PDF Ingestion**: #performance

- **392 chunks** from 403-page PDF in **12 seconds**
- Embedding throughput: **54 chunks/second**
- LRU cache reduces redundant calls by ~80%

**Semantic Search**:

- Similarity scores: **0.61 - 0.73** (high relevance)
- Hybrid search: 80% semantic + 20% keyword
- Multi-collection parallel retrieval

**Code Quality**:

- **0 TypeScript errors** (strict mode)
- **0 ESLint errors** (custom rules)
- **768-dimensional** real embeddings (not placeholders)

---

## Demo Flow (Show These)

> [!tip] Demo Steps
> Follow this order for smooth presentation

### 1. Architecture (1 min)

```bash
docker compose ps  # Show running services
npm run status     # Service health check
```

### 2. Configuration (1 min)

- Open `.env.example` → Show ENV-based config
- Highlight: `OLLAMA_BASE_URL`, `LLM_MODEL`, `AGENT_PERSONALITY`

### 3. PDF Ingestion (2 min)

```bash
npm run ingest:pdf -- /path/to/document.pdf --collection-name demo
# Watch logs: npm run logs:arbiter
```

- Point out: Chunking, embedding generation, Qdrant storage

### 4. Vector Search (1 min)

```bash
curl http://localhost:6333/collections/demo | python3 -m json.tool
# Show: points_count, vector_size (768), distance metric
```

### 5. CLI Interaction (3-5 min) - Show Full Request Flow

```bash
npm run cli
# Demo queries:
# - "What are the main topics in this document?"
# - "Summarize section 3"
# - Show markdown rendering, conversation history
# - Point out: CLI → Agent Orchestrator → MCP Server → Qdrant → Response
# - Exit with /exit
```

### 6. Logs & Monitoring (1 min)

```bash
npm run logs:arbiter      # Application logs
npm run logs:ollama       # Model logs (filtered)
docker logs arbiter-agent-orchestrator  # Agent orchestrator
```

---

## Scalability (1 min)

**Current**:

- Docker Compose (local dev, single-node)
- 4 core services: Agent Orchestrator, MCP Server, Qdrant, Ollama
- Separate CLI client container

**Future**:

- Kubernetes orchestration (Helm charts)
- Dynamic agent spawning (containers per query)
- Multi-LLM cost optimization (local → cloud)
- Collection-based multi-tenancy

**Scale Targets** (per layer):

- Client Layer: Unlimited concurrent CLI sessions
- Agent Orchestrator: 100 concurrent RAG pipelines per instance
- MCP Server: 1K tool requests/sec per instance
- Data Layer (Qdrant): 10M+ vectors per shard, 1K queries/sec

---

## Use Cases (Quote 1-2)

- **Legal**: Contract analysis, case law search, compliance checking
- **Medical**: Clinical guidelines, drug interactions, research papers
- **Technical**: API docs, runbooks, architecture guides
- **Gaming**: Rule lookups, strategy optimization, lore databases

---

## Open-Source Opportunities (If Asked)

**Easy**:

- Add LLM providers (Gemini, Cohere)
- New CLI commands (batch ingestion, export)
- Documentation improvements

**Medium**:

- Discord bot client
- New chunking strategies
- Python SDK

**Advanced**:

- Kubernetes Helm charts
- Multi-modal support (images, tables)
- Query routing ML model

---

## Closing Points (1 min)

> [!success] What Makes Arbiter Special

**Key Features**:

- ✅ Production-ready RAG with real embeddings (not placeholders)
- ✅ Domain-agnostic - works for ANY knowledge domain
- ✅ Four-layer architecture - clear separation: CLI → Agent → MCP → Data
- ✅ Pluggable components - swap LLMs, vector DBs, chunking strategies
- ✅ Open-source foundation - build custom agents without domain-specific code

**Architecture Flow**: CLI → Agent Orchestrator (RAG) → MCP Server (Tools) → Data Layer (Qdrant)

**Status**: Production-ready, 0 errors, semantic search validated

**Next Steps**: Sub-layer deep dives per architecture layer

---

## Quick Reference Commands

> [!example] Command Cheat Sheet

### Build & Start

```bash
npm run rebuild:orchestrator-cli   # Rebuild services
npm run dev                        # Start all services
```

### Ingestion

```bash
npm run ingest:pdf -- <pdf-path>   # Ingest PDF
```

### CLI

```bash
npm run cli                        # Interactive chat
```

### Logs

```bash
npm run logs:arbiter               # App logs
npm run logs:ollama                # Model logs
```

### Health

```bash
npm run status                     # Service status
curl http://localhost:3200/health  # Orchestrator health
curl http://localhost:6333         # Qdrant health
```

### Validation

```bash
npm run typecheck                  # TypeScript check
npm run lint                       # Linting
npm run validate                   # Full validation
```

---

**End of Talking Points** | Estimated Time: 10-15 minutes

#demo-complete #ready-to-present
