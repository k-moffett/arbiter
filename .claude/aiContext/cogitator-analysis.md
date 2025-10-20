# Cogitator Project Analysis - Initial Findings

**Date**: 2025-10-10
**Analyzer**: Claude Code
**Purpose**: Deep analysis of the cogitator project to inform arbiter refactoring and optimization

---

## Executive Summary

Cogitator is a sophisticated four-layer TypeScript application serving as a domain-specific knowledge hub with Discord bot functionality, AI agent services, context management, and MCP (Model Context Protocol) server capabilities. The arbiter project aims to extract and generalize this architecture to be **game-agnostic** and **domain-agnostic**, accepting configuration through environment variables and user input rather than hardcoded domain logic.

**Key Metrics**:
- **Source Files**: 288 TypeScript files
- **Source Size**: 36MB
- **TypeScript Version**: 5.7.2
- **Node Version**: 22.12.0 (specified in .nvmrc)
- **Architecture**: Four-layer (Discord → Context → Agent → MCP)

---

## 1. Critical Insight: Domain Coupling

### Current State (Cogitator)
The project is **tightly coupled** to a specific domain:
- Domain-specific directories in `src/mcp/40k/`
- Hardcoded tool implementations for specific rules
- Domain knowledge baked into parsers and schemas
- Fixed data sources and ingestion pipelines

### Target State (Arbiter)
The arbiter project must be **domain-agnostic**:
- Generic document ingestion (PDF, XML, HTML, etc.)
- Configurable data sources via environment variables
- Dynamic tool registration based on ingested content
- User-provided context for domain understanding
- No hardcoded references to specific domains

### Abstraction Strategy

**Instead of**:
```typescript
// Cogitator approach
src/mcp/40k/tools/UnitLookupTool.ts
src/mcp/40k/parsers/BattleScribeParser.ts
```

**Arbiter will use**:
```typescript
// Domain-agnostic approach
src/mcp/tools/DocumentLookupTool.ts        // Generic lookup
src/parsers/XMLParser.ts                   // Generic XML parsing
src/config/DataSourceConfig.ts             // User-provided sources
```

---

## 2. Project Architecture (Generalized)

### Four-Layer Architecture (To Be Simplified)

```
┌─────────────────────────────────────────┐
│         Interface Layer                  │
│  - Discord bot (optional)               │
│  - Web API (future)                     │
│  - CLI (future)                         │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Context Layer                    │
│  - Session & conversation management    │
│  - State persistence (JSONL)            │
│  - Thread tracking                      │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Orchestration Layer              │
│  - Query classification                 │
│  - Tool routing & selection             │
│  - Response synthesis                   │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Execution Layer (MCP)            │
│  - Generic document search              │
│  - Configurable parsers                 │
│  - Vector database operations           │
│  - User-defined tools                   │
└─────────────────────────────────────────┘
```

### Proposed Arbiter Structure (Simplified)

```
src/
├── interface/           # Communication layer (Discord, API, CLI)
│   ├── discord/        # Discord bot adapter
│   ├── api/           # REST/GraphQL API (future)
│   └── cli/           # CLI interface (future)
│
├── context/            # Session and state management
│   ├── session/       # Session lifecycle
│   ├── storage/       # Persistence layer
│   └── memory/        # In-memory context
│
├── orchestrator/       # Query routing and orchestration
│   ├── classifier/    # Query classification
│   ├── planner/       # Multi-step planning
│   └── synthesizer/   # Response synthesis
│
├── tools/             # Generic tool implementations
│   ├── search/        # Document search tools
│   ├── retrieval/     # Content retrieval
│   ├── analysis/      # Document analysis
│   └── registry/      # Dynamic tool registration
│
├── parsers/           # Generic document parsers
│   ├── pdf/          # PDF parsing
│   ├── xml/          # Generic XML parsing
│   ├── html/         # HTML/web scraping
│   └── markdown/     # Markdown parsing
│
├── vector/            # Vector database abstraction
│   ├── client/       # DB client wrapper
│   ├── embeddings/   # Embedding generation
│   └── search/       # Semantic search
│
├── config/            # Configuration management
│   ├── sources/      # Data source configs
│   ├── models/       # LLM/embedding configs
│   └── environment/  # Environment parsing
│
└── shared/            # Shared utilities
    ├── types/        # TypeScript types
    ├── utils/        # Utility functions
    └── logger/       # Logging infrastructure
```

**Key Differences**:
- Remove domain-specific directories (`40k/`, etc.)
- Single `tools/` directory with generic implementations
- `config/` for external configuration
- Clearer separation of concerns
- ~100-150 files vs 288

---

## 3. Configuration Analysis

### Keep from Cogitator ✅

1. **tsconfig.json** - Excellent strict TypeScript config
2. **eslint.config.mjs** - Strong linting (relax file size limits)
3. **prettier.config.js** - Consistent formatting
4. **jest.config.mjs** - Good test setup with ESM
5. **.nvmrc** - Node version pinning (22.x)
6. **.gitignore** - Comprehensive exclusions
7. **Dockerfile** - Multi-stage builds
8. **docker-compose.yml** - Service orchestration

### Adapt for Arbiter 🔄

1. **package.json**:
   - Remove domain-specific dependencies
   - Add configuration management libraries
   - Keep core infrastructure (Discord.js, Anthropic, etc.)

2. **tsconfig.json**:
   - Simplify path aliases (fewer layers)
   - Remove domain-specific paths

3. **eslint.config.mjs**:
   - Relax file size from 300 → 400 lines
   - Relax function size from 50 → 75 lines
   - Remove "I" prefix requirement for interfaces
   - Keep complexity/depth limits

4. **docker-compose.yml**:
   - Make services more modular
   - Add environment variable configuration
   - Remove domain-specific service names

---

## 4. Environment-Driven Configuration Strategy

### Configuration Hierarchy

```
1. Environment Variables (.env)
   ↓
2. User-Provided Configuration Files (JSON/YAML)
   ↓
3. Runtime User Prompts (Discord commands)
   ↓
4. Sensible Defaults (fallback)
```

### Example: Data Source Configuration

**Environment Variables**:
```bash
# Generic data source configuration
DATA_SOURCE_URLS="https://example.com/rules.pdf,https://example.com/errata.pdf"
DATA_SOURCE_TYPES="pdf,pdf"
DATA_SOURCE_LABELS="Core Rules,Errata Q1 2025"

# XML/HTML sources
XML_SOURCE_URL="https://github.com/user/repo"
XML_SOURCE_BRANCH="main"
XML_SOURCE_PATH="data/*.xml"

# Web scraping sources
WEB_SCRAPE_URLS="https://wiki.example.com/units"
WEB_SCRAPE_SELECTORS=".unit-card"
```

**User Configuration File** (`data-sources.json`):
```json
{
  "sources": [
    {
      "id": "core-rules",
      "type": "pdf",
      "url": "https://example.com/rules.pdf",
      "label": "Core Rules",
      "priority": 1
    },
    {
      "id": "github-data",
      "type": "git-xml",
      "url": "https://github.com/user/repo",
      "branch": "main",
      "path": "data/*.xml",
      "label": "Game Data",
      "priority": 2
    }
  ]
}
```

**Runtime Commands**:
```
!ingest https://example.com/new-rules.pdf "Q2 2025 Rules Update"
!configure source add pdf https://example.com/faq.pdf "FAQ"
!configure parser xml set-schema game-data.xsd
```

---

## 5. Generic Tool Architecture

### Domain-Agnostic Tool System

**Base Tool Interface**:
```typescript
interface ITool {
  name: string;
  description: string;
  schema: ZodSchema;
  execute(params: unknown): Promise<ToolResult>;

  // Optional: User-provided metadata
  metadata?: {
    domain?: string;      // User-specified domain
    tags?: string[];      // Searchable tags
    aliases?: string[];   // Alternative names
  };
}
```

**Generic Tools (Arbiter)**:
- `DocumentSearchTool` - Search ingested documents by semantic similarity
- `DocumentRetrievalTool` - Retrieve specific document sections
- `EntityLookupTool` - Look up entities from parsed data
- `RelationshipQueryTool` - Query relationships between entities
- `ComparisonTool` - Compare multiple entities/documents
- `AnalysisTool` - Analyze document content with LLM
- `SummarizationTool` - Summarize long documents

**Tool Configuration** (User-Provided):
```json
{
  "tools": [
    {
      "tool": "EntityLookupTool",
      "config": {
        "entityTypes": ["unit", "weapon", "ability"],
        "searchFields": ["name", "keywords", "faction"],
        "collectionName": "game-data"
      }
    }
  ]
}
```

---

## 6. Parser Abstraction Strategy

### Current State (Cogitator)
- Hardcoded parsers for specific XML schemas
- Domain knowledge in parser logic
- Fixed output format

### Target State (Arbiter)
- Generic parsers with user-provided schemas
- Configurable extraction rules
- Flexible output format

**Generic XML Parser**:
```typescript
interface IXMLParserConfig {
  schema?: string;                    // XSD/JSON schema URL
  extractionRules: {
    entityType: string;               // e.g., "unit", "item"
    xpath: string;                    // XPath selector
    fields: {
      name: string;
      path: string;
      type: 'string' | 'number' | 'boolean' | 'array';
    }[];
  }[];
  relationships?: {
    type: string;
    fromXPath: string;
    toXPath: string;
  }[];
}
```

**Example User Configuration**:
```json
{
  "parser": "xml",
  "config": {
    "extractionRules": [
      {
        "entityType": "unit",
        "xpath": "//unit",
        "fields": [
          { "name": "name", "path": "@name", "type": "string" },
          { "name": "cost", "path": "cost/@points", "type": "number" }
        ]
      }
    ]
  }
}
```

---

## 7. Vector Database Strategy

### Keep Generic
- Qdrant is domain-agnostic (good choice)
- Collection names configurable
- Schema defined by user configuration
- Metadata filtering based on user tags

### Collection Strategy

**Instead of**:
```typescript
const COLLECTION_NAME = "warhammer40k"; // Hardcoded
```

**Use**:
```typescript
const config = {
  collections: [
    {
      name: process.env.VECTOR_COLLECTION_NAME || "default",
      vectorSize: 768,
      distance: "Cosine",
      metadata: {
        domain: process.env.DOMAIN_NAME || "general",
        version: process.env.DATA_VERSION || "1.0"
      }
    }
  ]
};
```

**User Control**:
```bash
# Environment variables
VECTOR_COLLECTION_NAME="my-game-data"
DOMAIN_NAME="My Tabletop Game"
DATA_VERSION="2025-Q1"
```

---

## 8. Dependencies for Arbiter

### Essential (Keep)
```json
{
  "@anthropic-ai/sdk": "^0.62.0",
  "@modelcontextprotocol/sdk": "^1.17.5",
  "@qdrant/js-client-rest": "^1.15.1",
  "discord.js": "^14.16.3",
  "dotenv": "^16.4.5",
  "zod": "^3.25.76",
  "fast-xml-parser": "^4.5.3",
  "pdf-parse": "^1.1.1"
}
```

### Add for Configuration
```json
{
  "dotenv-expand": "^11.0.0",      // Environment variable expansion
  "ajv": "^8.12.0",                 // JSON schema validation
  "yaml": "^2.3.4",                 // YAML config support
  "joi": "^17.11.0"                 // Config validation
}
```

### Remove (Domain-Specific or Too Heavy)
```json
{
  "puppeteer": "^24.22.3",         // Only if web scraping needed
  "cheerio": "^1.1.2",             // Only if HTML parsing needed
  "ollama": "^0.6.0"               // Make optional, use OpenAI alternative
}
```

### Consider (Better Alternatives)
```json
{
  "pino": "^8.16.0",               // Instead of custom logger
  "ioredis": "^5.3.2",             // For caching layer
  "vitest": "^1.0.0"               // Instead of Jest (faster)
}
```

---

## 9. Configuration Files Setup Plan

### Immediate Actions (This Session)

1. **Copy and adapt core configs**:
   - ✅ `tsconfig.json` (simplify paths)
   - ✅ `tsconfig.test.json` (keep as-is)
   - ✅ `eslint.config.mjs` (relax rules)
   - ✅ `prettier.config.js` (keep as-is)
   - ✅ `jest.config.mjs` (adapt paths)
   - ✅ `.gitignore` (keep as-is)
   - ✅ `.nvmrc` (keep as-is)
   - ✅ `.prettierignore` (keep as-is)

2. **Create new package.json**:
   - Start with minimal dependencies
   - Add configuration management
   - Remove domain-specific packages

3. **Create new .env.example**:
   - Generic configuration variables
   - Data source configuration
   - Vector database settings
   - No domain-specific variables

4. **Skip for now**:
   - Dockerfile (will adapt later)
   - docker-compose.yml (will adapt later)
   - jest.integration.config.js (not needed initially)

---

## 10. Success Criteria for Arbiter

### Functional Requirements

1. **Domain Agnostic** ✅
   - No hardcoded domain references
   - All domain knowledge from configuration
   - User-provided data sources

2. **Flexible Configuration** ✅
   - Environment variables for core settings
   - JSON/YAML for complex configuration
   - Runtime commands for dynamic setup

3. **Generic Tools** ✅
   - Reusable across domains
   - Configurable behavior
   - Dynamic registration

4. **Parser Flexibility** ✅
   - User-provided schemas
   - Configurable extraction rules
   - Multiple format support

### Technical Requirements

1. **Performance**:
   - < 2s startup time
   - < 256MB memory usage (idle)
   - < 500ms query response time

2. **Code Quality**:
   - 80%+ test coverage
   - 100% type coverage
   - < 150 source files

3. **Maintainability**:
   - Clear architecture
   - Comprehensive documentation
   - Easy to extend

---

## 11. Next Steps (This Session)

### Configuration Setup

1. Copy `tsconfig.json` → adapt paths for simpler structure
2. Copy `tsconfig.test.json` → keep mostly as-is
3. Copy `eslint.config.mjs` → relax file/function size, remove "I" prefix
4. Copy `prettier.config.js` → keep exactly as-is
5. Copy `jest.config.mjs` → adapt paths, simplify
6. Copy `.gitignore` → keep as-is
7. Copy `.nvmrc` → keep as-is
8. Copy `.prettierignore` → keep as-is
9. Create `package.json` → minimal, domain-agnostic dependencies
10. Create `.env.example` → generic configuration template

### Validation

1. Verify TypeScript compiles with new config
2. Verify ESLint runs without errors
3. Verify Jest can find and run tests
4. Verify all paths resolve correctly

---

## Conclusion

The cogitator project provides an excellent foundation, but requires significant refactoring to become domain-agnostic. The arbiter project will:

1. **Extract** the strong architectural patterns
2. **Remove** all domain-specific hardcoding
3. **Replace** with flexible configuration system
4. **Simplify** from 4 layers to 3, reducing complexity
5. **Optimize** dependencies and bundle size
6. **Maintain** strong type safety and testing culture

**Key Principle**: Any reference to specific games, domains, or products must be configurable through environment variables, configuration files, or user input—never hardcoded.

---

**Document Status**: Initial Draft (Domain-Agnostic Focus)
**Last Updated**: 2025-10-10
**Next Review**: After configuration setup complete
