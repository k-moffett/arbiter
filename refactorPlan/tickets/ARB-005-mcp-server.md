# ARB-005: MCP Server Foundation

**Status**: 🔶 READY
**Priority**: P0 - Blocker
**Epic**: ARB-EPIC-001
**Effort**: 10-12 hours
**Assignee**: @kmoffett

---

## Description

Build a standalone MCP (Model Context Protocol) server that exposes Arbiter's capabilities as tools, resources, and prompts. This transforms Arbiter from a monolithic application into a pluggable service that any MCP client can use.

---

## Goals

1. Create standalone MCP server (separate process/container)
2. Expose query pipeline as MCP tools
3. Expose documents and entities as MCP resources
4. Support pluggable domain configuration
5. Enable multiple concurrent clients

---

## Acceptance Criteria

### Must Have

- [ ] **MCP Server** running standalone
  - [ ] Implements MCP protocol (stdio transport)
  - [ ] Can be started independently
  - [ ] Handles multiple client connections
  - [ ] Proper shutdown and cleanup

- [ ] **MCP Tools** exposed
  - [ ] `query` - Full query pipeline (HyDE → Tools → Validation)
  - [ ] `vector-search` - Semantic search only
  - [ ] `validate-answer` - Validation only
  - [ ] `ingest-document` - Document ingestion

- [ ] **MCP Resources** exposed
  - [ ] `documents://` - List and read documents
  - [ ] `entities://` - List and read entities (units, concepts, etc.)
  - [ ] `domains://` - List available domains

- [ ] **MCP Prompts** exposed
  - [ ] Domain-specific prompt templates
  - [ ] Query decomposition prompts
  - [ ] Validation prompts

- [ ] **Domain Configuration**
  - [ ] Load domain from config file
  - [ ] Support multiple domains
  - [ ] Domain switching at runtime

- [ ] **Docker Container**
  - [ ] Dockerfile for MCP server
  - [ ] Docker Compose integration
  - [ ] Health checks

### Should Have

- [ ] HTTP transport (in addition to stdio)
- [ ] Authentication/authorization
- [ ] Rate limiting per client

### Nice to Have

- [ ] WebSocket transport for streaming
- [ ] Metrics endpoint
- [ ] Admin API

---

## Implementation Plan

### Phase 1: MCP Server Setup (3-4 hours)

**Files to Create**:
```
src/
├── server.ts                      # MCP server entry point
├── mcp/
│   ├── MCPServer.ts               # Main server class
│   ├── transports/
│   │   ├── StdioTransport.ts      # stdio communication
│   │   └── HttpTransport.ts       # HTTP (future)
│   └── handlers/
│       ├── ToolHandler.ts         # Handle tool calls
│       ├── ResourceHandler.ts     # Handle resource requests
│       └── PromptHandler.ts       # Handle prompt requests
```

**Implementation Steps**:

1. **Create MCP Server Class**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

class ArbiterMCPServer {
  private server: Server;
  private transport: StdioServerTransport;

  constructor() {
    this.server = new Server(
      {
        name: 'arbiter',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.transport = new StdioServerTransport();
  }

  async start() {
    // Register handlers
    this.registerToolHandlers();
    this.registerResourceHandlers();
    this.registerPromptHandlers();

    // Connect server to transport
    await this.server.connect(this.transport);

    console.log('Arbiter MCP Server running on stdio');
  }

  async stop() {
    await this.server.close();
  }
}
```

2. **Implement StdioTransport**
   - Read from stdin
   - Write to stdout
   - Handle JSON-RPC messages
   - Use MCP SDK's built-in stdio transport

3. **Add Server Lifecycle Management**
   - Graceful shutdown on SIGTERM/SIGINT
   - Cleanup resources on exit
   - Log server events

**Testing**:
- Start server
- Connect with MCP client (simple test client)
- Verify server responds to ping
- Stop server gracefully

---

### Phase 2: MCP Tools (4-5 hours)

**Files to Create**:
```
src/mcp/tools/
├── QueryTool.ts                   # Full query pipeline
├── VectorSearchTool.ts            # Vector search only
├── ValidationTool.ts              # Validation only
├── IngestionTool.ts               # Document ingestion
└── interfaces/
    └── IMCPTool.ts
```

**Files to Copy from Cogitator**:
```
src/mcp/tools/core/BaseMcpTool.ts → src/mcp/tools/BaseTool.ts
```

**Implementation Steps**:

1. **Register Tools with MCP Server**
```typescript
private registerToolHandlers() {
  this.server.setRequestHandler(
    ListToolsRequestSchema,
    async () => ({
      tools: [
        {
          name: 'query',
          description: 'Execute full query pipeline with validation',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              domain: { type: 'string', default: 'generic' },
              validate: { type: 'boolean', default: true },
              includeProvenance: { type: 'boolean', default: true }
            },
            required: ['query']
          }
        },
        {
          name: 'vector-search',
          description: 'Semantic search in vector database',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
              collection: { type: 'string' },
              limit: { type: 'number', default: 5 }
            },
            required: ['query', 'collection']
          }
        }
      ]
    })
  );

  this.server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'query':
          return await this.handleQueryTool(args);
        case 'vector-search':
          return await this.handleVectorSearchTool(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    }
  );
}
```

2. **Implement QueryTool**
   - Accepts query + options
   - Runs full pipeline:
     - Context system (HyDE, decomposition)
     - Tool planning
     - Tool execution
     - Validation
   - Returns validated answer with citations

```typescript
async handleQueryTool(args: any): Promise<CallToolResult> {
  const { query, domain = 'generic', validate = true, includeProvenance = true } = args;

  try {
    // 1. Context processing
    const decomposition = await this.contextEngine.processQuery(query, domain);

    // 2. Tool planning
    const plan = await this.toolPlanner.plan(query, decomposition, this.availableTools);

    // 3. Tool execution
    const results = await this.toolOrchestrator.execute(plan);

    // 4. Synthesis
    const answer = await this.synthesizer.synthesize(query, results);

    // 5. Validation (if enabled)
    let validationResult;
    if (validate) {
      validationResult = await this.validator.validate(query, answer, results.sources);
    }

    // 6. Format response
    return {
      content: [
        {
          type: 'text',
          text: answer
        },
        ...(includeProvenance ? [{
          type: 'text',
          text: `\n\n**Sources**:\n${this.formatCitations(validationResult.citations)}`
        }] : [])
      ],
      isError: false,
      metadata: {
        confidence: validationResult?.confidence,
        queryType: decomposition.queryType,
        toolsUsed: plan.steps.map(s => s.tool)
      }
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true
    };
  }
}
```

3. **Implement VectorSearchTool**
   - Simpler: Just vector search
   - No decomposition, no validation
   - Returns raw search results

4. **Implement ValidationTool**
   - Standalone validation
   - Client provides query + answer + sources
   - Returns validation result

5. **Implement IngestionTool**
   - Will be implemented in ARB-006
   - Placeholder for now

**Testing**:
- Call `query` tool with simple query
- Call `vector-search` tool directly
- Call `validate-answer` tool with answer + sources
- Verify responses are MCP-compliant

---

### Phase 3: MCP Resources (2-3 hours)

**Files to Create**:
```
src/mcp/resources/
├── DocumentResource.ts
├── EntityResource.ts
├── DomainResource.ts
└── interfaces/
    └── IMCPResource.ts
```

**Implementation Steps**:

1. **Register Resource Handlers**
```typescript
private registerResourceHandlers() {
  this.server.setRequestHandler(
    ListResourcesRequestSchema,
    async () => ({
      resources: [
        {
          uri: 'documents://',
          name: 'Documents',
          description: 'All indexed documents',
          mimeType: 'application/json'
        },
        {
          uri: 'entities://',
          name: 'Entities',
          description: 'Extracted entities (units, concepts, etc.)',
          mimeType: 'application/json'
        },
        {
          uri: 'domains://',
          name: 'Domains',
          description: 'Available knowledge domains',
          mimeType: 'application/json'
        }
      ]
    })
  );

  this.server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request) => {
      const { uri } = request.params;

      if (uri.startsWith('documents://')) {
        return await this.handleDocumentResource(uri);
      } else if (uri.startsWith('entities://')) {
        return await this.handleEntityResource(uri);
      } else if (uri.startsWith('domains://')) {
        return await this.handleDomainResource(uri);
      }

      throw new Error(`Unknown resource: ${uri}`);
    }
  );
}
```

2. **Implement DocumentResource**
   - `documents://` - List all documents (paginated)
   - `documents://{domain}/{id}` - Read specific document

```typescript
async handleDocumentResource(uri: string): Promise<ReadResourceResult> {
  if (uri === 'documents://') {
    // List all documents
    const docs = await this.vectorDB.listDocuments();
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(docs, null, 2)
      }]
    };
  } else {
    // Read specific document
    const match = uri.match(/documents:\/\/([^\/]+)\/(.+)/);
    if (!match) throw new Error('Invalid document URI');

    const [, domain, id] = match;
    const doc = await this.vectorDB.getDocument(domain, id);

    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(doc, null, 2)
      }]
    };
  }
}
```

3. **Implement EntityResource**
   - Similar to DocumentResource but for entities

4. **Implement DomainResource**
   - `domains://` - List all domains
   - `domains://{domain}` - Get domain config

**Testing**:
- List resources
- Read specific document
- Read specific entity
- List domains

---

### Phase 4: Domain Configuration (2-3 hours)

**Files to Create**:
```
domains/
├── generic/
│   ├── config.json
│   └── sources.json
└── warhammer-40k/
    ├── config.json
    └── sources.json

src/mcp/
└── DomainLoader.ts
```

**Implementation Steps**:

1. **Create Domain Config Schema**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "domain": { "type": "string" },
    "version": { "type": "string" },
    "description": { "type": "string" },
    "vectorDatabase": {
      "type": "object",
      "properties": {
        "collections": { "type": "array", "items": { "type": "string" } },
        "embeddingModel": { "type": "string" },
        "dimensions": { "type": "number" }
      }
    },
    "entities": {
      "type": "object",
      "properties": {
        "types": { "type": "array", "items": { "type": "string" } },
        "schema": { "type": "string" }
      }
    },
    "tools": {
      "type": "object",
      "properties": {
        "custom": { "type": "array", "items": { "type": "string" } }
      }
    }
  },
  "required": ["domain", "vectorDatabase"]
}
```

2. **Implement DomainLoader**
```typescript
class DomainLoader {
  async loadDomain(domainName: string): Promise<DomainConfig> {
    const configPath = `./domains/${domainName}/config.json`;
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));

    // Validate config
    this.validateConfig(config);

    // Load sources if present
    const sourcesPath = `./domains/${domainName}/sources.json`;
    if (await fs.exists(sourcesPath)) {
      config.sources = JSON.parse(await fs.readFile(sourcesPath, 'utf-8'));
    }

    return config;
  }

  async listDomains(): Promise<string[]> {
    const domainDirs = await fs.readdir('./domains');
    const domains = [];

    for (const dir of domainDirs) {
      const configPath = `./domains/${dir}/config.json`;
      if (await fs.exists(configPath)) {
        domains.push(dir);
      }
    }

    return domains;
  }
}
```

3. **Create Example Domain Configs**

**domains/generic/config.json**:
```json
{
  "domain": "generic",
  "version": "1.0.0",
  "description": "Generic knowledge base template",
  "vectorDatabase": {
    "collections": ["generic_documents"],
    "embeddingModel": "nomic-embed-text",
    "dimensions": 768
  },
  "entities": {
    "types": ["document", "concept", "fact"],
    "schema": "./schemas/entity.json"
  }
}
```

**domains/warhammer-40k/config.json**:
```json
{
  "domain": "warhammer-40k",
  "version": "10.0",
  "description": "Warhammer 40,000 10th Edition",
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
    "custom": ["FactionValidationTool", "PointsCalculatorTool"]
  }
}
```

**Testing**:
- Load generic domain
- Load warhammer-40k domain
- Switch between domains
- Verify collections are correct

---

### Phase 5: Docker Integration (1-2 hours)

**Files to Create**:
```
Dockerfile.mcp-server
docker-compose.mcp.yml
```

**Implementation Steps**:

1. **Create Dockerfile**
```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY domains ./domains

EXPOSE 3100

CMD ["node", "dist/server.js"]
```

2. **Add to Docker Compose**
```yaml
services:
  arbiter-mcp-server:
    build:
      context: .
      dockerfile: Dockerfile.mcp-server
    ports:
      - "3100:3100"
    environment:
      - QDRANT_HOST=qdrant
      - QDRANT_PORT=6333
      - OLLAMA_HOST=ollama
      - OLLAMA_PORT=11434
      - NODE_ENV=production
    depends_on:
      - qdrant
      - ollama
    volumes:
      - ./domains:/app/domains
      - ./data:/app/data
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3100/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
```

3. **Add Health Check Endpoint**
```typescript
// Simple HTTP health check (for Docker)
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
  }
}).listen(3100);
```

**Testing**:
- Build Docker image
- Start with Docker Compose
- Verify health check passes
- Connect client to Docker container

---

## Technical Details

### Reusable Components from Cogitator

**Direct Copy**:
- `src/mcp/tools/core/BaseMcpTool.ts`
- `src/mcp/transport/jsonrpc/` (if using custom transport)

**Reference Patterns**:
- `src/mcp/ServiceBootstrap.ts` - Server initialization
- `src/mcp/tools/core/McpToolRegistry.ts` - Tool registration

### New Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.5"
  }
}
```

---

## Configuration

**Environment Variables**:
```bash
# MCP Server
MCP_SERVER_PORT=3100
MCP_SERVER_TRANSPORT=stdio  # or 'http'
MCP_DEFAULT_DOMAIN=generic

# Domains
DOMAINS_PATH=./domains
```

---

## Success Metrics

- [ ] MCP server starts and accepts connections
- [ ] All tools callable via MCP protocol
- [ ] Resources browsable via MCP protocol
- [ ] Domain switching works correctly
- [ ] Docker container runs successfully
- [ ] Response time <100ms for simple tool calls

---

## Dependencies

- **Blockers**:
  - ARB-001 (Base Repo) - ✅ Complete
  - ARB-002 (Context System) - Provides context engine
  - ARB-003 (Tool Planning) - Provides tool orchestrator
  - ARB-004 (Validation) - Provides validator

---

## Follow-up Tasks

After completion:
- ARB-006: Ingestion Migration (provides ingestion tools to MCP)
- ARB-007: Integration Testing (test MCP server end-to-end)

---

## Notes

- MCP server can be developed alongside other tickets (loosely coupled)
- Start with stdio transport (simpler)
- HTTP transport can be added later
- Focus on getting tools working first, then resources

---

**Created**: 2025-10-20
**Last Updated**: 2025-10-20
**Status**: Ready for Development
