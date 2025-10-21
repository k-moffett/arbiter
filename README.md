# Arbiter

> Domain-Agnostic Knowledge Hub with Discord Bot, AI Agent, and Vector Search

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.0%2B-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Overview

Arbiter is a **domain-agnostic** knowledge management system that can ingest, index, and query documents from any domain. Unlike domain-specific systems, Arbiter accepts all configuration through environment variables and user-provided settings—no hardcoded domain knowledge.

**Key Features**:
- 🌐 **Domain Agnostic**: Works with any subject matter
- 🔧 **Fully Configurable**: All settings via environment or config files
- 🤖 **Discord Integration**: Optional bot interface for queries
- 🧠 **AI-Powered**: Claude AI for intelligent query processing
- 🔍 **Vector Search**: Semantic search via Qdrant
- 📄 **Multi-Format**: PDF, XML, HTML, Markdown support
- 🎯 **Type-Safe**: Full TypeScript with strict mode
- ✅ **Well-Tested**: 80% coverage target

---

## Quick Start

### Prerequisites

- Node.js 22.0+
- npm 10.0+
- Qdrant (vector database)
- Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arbiter.git
cd arbiter

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Test
npm test

# Full validation
npm run validate
```

---

## Configuration

Arbiter is designed to be **completely domain-agnostic**. All domain-specific information must be provided through configuration:

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Required
ANTHROPIC_API_KEY="your-key-here"
QDRANT_HOST="localhost"
QDRANT_PORT="6333"

# Domain Configuration (user-defined)
DOMAIN_NAME="My Knowledge Domain"
VECTOR_COLLECTION_NAME="my-data"
DATA_VERSION="1.0.0"

# Data Sources (user-provided URLs)
PDF_SOURCE_URLS="https://example.com/doc1.pdf,https://example.com/doc2.pdf"
XML_SOURCE_URL="https://github.com/user/repo"
```

### Configuration Files

Create `config/data-sources.json`:

```json
{
  "sources": [
    {
      "id": "core-docs",
      "type": "pdf",
      "url": "https://example.com/documentation.pdf",
      "label": "Core Documentation",
      "priority": 1
    }
  ]
}
```

### Runtime Configuration

Use Discord commands to configure at runtime:

```
!ingest https://example.com/rules.pdf "My Rules Document"
!configure collection set my-collection-name
```

---

## Project Structure

```
arbiter/
├── src/
│   ├── interface/      # Discord bot, API, CLI interfaces
│   ├── context/        # Session and state management
│   ├── orchestrator/   # Query routing and orchestration
│   ├── tools/          # Generic tool implementations
│   ├── parsers/        # Document parsers (PDF, XML, HTML)
│   ├── vector/         # Vector database operations
│   ├── config/         # Configuration management
│   └── shared/         # Shared utilities and types
├── test/               # Test files
├── .claude/            # AI assistant configuration
└── dist/               # Build output
```

---

## Architecture

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│         Interface Layer                  │
│  - Discord bot (optional)               │
│  - Web API (future)                     │
│  - CLI (future)                         │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Orchestration + Context Layer        │
│  - Query classification                 │
│  - Session management                   │
│  - Tool routing & selection             │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Execution Layer                  │
│  - Generic document search              │
│  - Configurable parsers                 │
│  - Vector database operations           │
│  - User-defined tools                   │
└─────────────────────────────────────────┘
```

---

## Design Principles

### 1. Domain Agnosticism

**Never hardcode domain-specific logic**. Always use configuration:

❌ **Bad**:
```typescript
const GAME_NAME = "Fantasy Battle System X";
const COLLECTION = "game-system-x";
```

✅ **Good**:
```typescript
const domainName = process.env.DOMAIN_NAME || "general";
const collection = process.env.VECTOR_COLLECTION_NAME || "knowledge-base";
```

### 2. Configuration Over Code

All domain knowledge comes from:
1. Environment variables
2. Configuration files
3. User input at runtime

### 3. Generic Tools

Tools are reusable across domains:
- `DocumentSearchTool` - Semantic search
- `EntityLookupTool` - Entity queries
- `ComparisonTool` - Compare entities
- `AnalysisTool` - LLM analysis

### 4. User-Provided Schemas

Parsers accept user-defined extraction rules:

```json
{
  "parser": "xml",
  "extractionRules": [
    {
      "entityType": "item",
      "xpath": "//item",
      "fields": [
        { "name": "name", "path": "@name", "type": "string" },
        { "name": "value", "path": "cost", "type": "number" }
      ]
    }
  ]
}
```

---

## Development

### Code Quality Standards

- **TypeScript**: Strict mode enabled
- **Line Length**: 100 characters
- **File Size**: 400 lines max (relaxed from 300)
- **Function Size**: 75 lines max (relaxed from 50)
- **Complexity**: Max 10
- **Test Coverage**: 80% minimum

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Linting & Formatting

```bash
# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check everything
npm run validate
```

### Log Viewing and Debugging

Arbiter provides comprehensive logging with built-in filtering to separate application logs from Ollama model logs.

#### Quick Start

```bash
# View Arbiter application logs only
npm run logs:arbiter

# View Arbiter CLI logs
npm run logs:arbiter:cli

# View Ollama model logs
npm run logs:ollama

# View all logs from all containers
npm run logs:all

# View JSON structured logs (pipe to jq for filtering)
npm run logs:json
```

#### Log Formats

**Text Format (default):**
```
[ARBITER] INFO: Server started on port 3100
[ARBITER] DEBUG: Processing request for entity: weapon-123
[ARBITER] ERROR: Failed to connect to Qdrant
```

**JSON Format (for machine parsing):**
```json
{"timestamp":"2025-01-15T10:30:45.123Z","level":"INFO","service":"ARBITER","message":"Server started on port 3100"}
{"timestamp":"2025-01-15T10:30:46.456Z","level":"DEBUG","service":"ARBITER","message":"Processing request","context":{"entityId":"weapon-123"}}
```

#### Environment Variables

Configure logging behavior in `.env` or Docker environment:

```bash
# Log prefix (default: [ARBITER])
LOG_PREFIX="[ARBITER]"

# Log format: text or json (default: text)
LOG_FORMAT="text"

# Log level: DEBUG, INFO, WARN, ERROR (default: INFO)
LOG_LEVEL="INFO"

# Enable colored output (default: true)
LOG_USE_COLORS="true"

# Enable Ollama debug logs (default: false)
OLLAMA_DEBUG="false"
```

#### Advanced Filtering

**Filter JSON logs with jq:**
```bash
# Show only ERROR level logs
npm run logs:json | jq 'select(.level == "ERROR")'

# Show logs with specific context
npm run logs:json | jq 'select(.context.entityId != null)'

# Pretty print JSON logs
npm run logs:json | jq '.'
```

**Direct Docker commands:**
```bash
# View logs from specific container
docker logs -f arbiter-mcp-server

# Filter Arbiter logs with grep
docker logs -f arbiter-mcp-server 2>&1 | grep "\[ARBITER\]"

# View last 100 lines
docker logs --tail 100 arbiter-mcp-server
```

#### Switching Log Formats

To enable JSON structured logging, update your `.env` file:

```bash
LOG_FORMAT="json"
```

Then restart the services:

```bash
npm run docker:services:down
npm run docker:services:up
```

---

## Project Status

**Current Phase**: Foundation Setup ✅

- ✅ TypeScript configuration
- ✅ ESLint with relaxed rules
- ✅ Jest testing framework
- ✅ Prettier formatting
- ✅ Domain-agnostic environment config
- ✅ Project documentation
- 🚧 Core architecture implementation (next)
- 📅 Tool system
- 📅 Parser implementations
- 📅 Discord interface
- 📅 Vector search integration

---

## Comparison to Cogitator

Arbiter is a refactored and optimized version of the cogitator project:

| Aspect | Cogitator | Arbiter |
|--------|-----------|---------|
| **Domain** | Hardcoded | Fully configurable |
| **Files** | 288 TypeScript files | Target: 100-150 |
| **Layers** | 4 layers | 3 layers (simplified) |
| **Memory** | ~1GB+ idle | Target: <256MB |
| **Startup** | ~5-10s | Target: <2s |
| **Bundle** | ~200MB+ | Target: <50MB |
| **Dependencies** | Heavy (Puppeteer, etc.) | Lighter alternatives |
| **Interface Prefix** | Required "I" | Optional (modern style) |

---

## Contributing

Contributions welcome! Please:

1. Follow the domain-agnostic principle
2. Maintain type safety (no `any` types)
3. Write tests for new features
4. Run `npm run validate` before committing
5. Update documentation

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Based on the cogitator project architecture
- Built with TypeScript, Discord.js, and Anthropic Claude
- Vector search powered by Qdrant

---

**Built with ❤️ using Clean Architecture and TypeScript**
