# Arbiter Architecture Overview

**Version**: 2.0 (Containerized Multi-Service Design)
**Last Updated**: 2025-10-20
**Status**: Design → Implementation

---

## Executive Summary

Arbiter is a next-generation **multi-agent RAG system** built on modern research patterns including HyDE, Self-RAG, and intelligent tool planning. Unlike traditional RAG systems, Arbiter uses **dynamic agent spawning**, validates every answer, supports complex multi-hop reasoning, and provides source provenance for all claims.

**Key Differentiators:**
- ✅ **Containerized microservices architecture** - Independently scalable services
- ✅ **Dynamic multi-agent orchestration** - Spawn agents as Docker containers on-demand
- ✅ **Pluggable LLM models** - Swap models per agent type (Claude, GPT-4, Llama, etc.)
- ✅ **Multi-transport support** - stdio (CLI) and Streamable HTTP (Discord, web)
- ✅ **Self-validating answers** with hallucination detection
- ✅ **Multi-hop query decomposition** for complex questions
- ✅ **Pluggable domain architecture** (not IP-locked)
- ✅ **Multi-database abstraction** - Repository pattern for future database swaps

---

## System Architecture

### High-Level Containerized View

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT SERVICES                             │
│                  (Separate Deployments)                         │
│                                                                 │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │  Discord Bot    │              │    CLI Tool     │          │
│  │   Container     │              │   (Local)       │          │
│  │  Port: 8080     │              │                 │          │
│  └────────┬────────┘              └────────┬────────┘          │
│           │                                │                   │
│     HTTP (JSON-RPC)                   HTTP/stdio              │
└───────────┼────────────────────────────────┼───────────────────┘
            │                                │
            └────────────────┬───────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                   MCP SERVER SERVICE                             │
│                  (Dedicated Container)                           │
│                    Port: 3100                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Transport Layer                                           │ │
│  │  ├─ Stdio Transport (for CLI)                              │ │
│  │  └─ Streamable HTTP Transport (for Discord/web)            │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Session Manager (multi-session, multi-user)               │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tool Registry                                             │ │
│  │  - vector-search  - validation  - ingestion               │ │
│  │  - context-write  - calculation                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Resource Manager                                          │ │
│  │  - documents  - entities  - context  - metadata            │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                        HTTP/gRPC calls
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│              AGENT ORCHESTRATOR SERVICE                          │
│                  (Dedicated Container)                           │
│                    Port: 3200                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agent Spawning Engine                                     │ │
│  │  - Docker API integration                                  │ │
│  │  - Kubernetes orchestration (optional)                     │ │
│  │  - Container lifecycle management                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Agent Pool Manager                                        │ │
│  │  - Active agents: Map<sessionId, Agent[]>                 │ │
│  │  - Max concurrent: 30 agents                               │ │
│  │  - Cleanup on session end                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  LLM Provider Registry                                     │ │
│  │  - Anthropic (Claude Sonnet/Opus)                          │ │
│  │  - OpenAI (GPT-4/GPT-4o)                                   │ │
│  │  - Ollama (Llama 3, Mistral, local models)                │ │
│  │  - Strategy Pattern for swapping models per agent         │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬─────────────────────────────────────┘
                             │
              Spawns containers dynamically
                             │
            ┌────────────────┼────────────────┐
            │                │                │
┌───────────▼──────┐ ┌───────▼──────┐ ┌──────▼──────────┐
│ Agent Container  │ │ Agent Container│ │ Agent Container │
│   (QueryAgent)   │ │(ResearchAgent) │ │(ValidationAgent)│
│                  │ │                │ │                 │
│ LLM: Claude      │ │ LLM: GPT-4     │ │ LLM: Llama3     │
│ Port: Dynamic    │ │ Port: Dynamic  │ │ Port: Dynamic   │
└───────────┬──────┘ └───────┬────────┘ └──────┬──────────┘
            │                │                  │
            └────────────────┼──────────────────┘
                             │
                    HTTP calls to data service
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                   DATA SERVICE LAYER                             │
│              (Independent Container Services)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Qdrant     │  │   Ollama     │  │  Context DB  │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  │ Port: 6333   │  │ Port: 11434  │  │ Port: 5432   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  Future databases (pluggable via Repository Pattern):           │
│  - Pinecone, Weaviate, Milvus (vector DBs)                     │
│  - MongoDB, PostgreSQL (context/metadata stores)                │
└──────────────────────────────────────────────────────────────────┘
```

---

## Service-Level Architecture

### 1. Client Services

**Purpose**: User-facing applications that send queries to Arbiter

**Deployments**:
- **Discord Bot**: Containerized Node.js service
- **CLI Tool**: Local binary (optionally containerized)
- **Slack Bot**: Future
- **Web UI**: Future

**Communication**:
- Uses JSON-RPC 2.0 protocol
- Discord/Slack/Web → HTTP (Streamable HTTP transport)
- CLI → stdio or HTTP

**Example Discord Bot Request**:
```json
{
  "jsonrpc": "2.0",
  "method": "agent/query",
  "params": {
    "sessionId": "discord-ch-123456",
    "query": "Build me a competitive 2000pt Space Marine list",
    "context": {
      "channelId": "123456",
      "userId": "789012",
      "guildId": "345678"
    }
  },
  "id": "req-001"
}
```

---

### 2. MCP Server Service

**Purpose**: Protocol layer for tools, resources, and prompts. Acts as API gateway between clients and agents.

**Container Spec**:
- Image: `arbiter-mcp-server:latest`
- Port: 3100 (HTTP), stdio (CLI)
- Environment:
  - `AGENT_ORCHESTRATOR_URL=http://agent-orchestrator:3200`
  - `MCP_TRANSPORT=http,stdio`
  - `MAX_SESSIONS=1000`

**Responsibilities**:
- ✅ Accept JSON-RPC requests from clients
- ✅ Manage sessions (multi-user, multi-channel)
- ✅ Route requests to Agent Orchestrator
- ✅ Expose MCP tools (vector-search, validation, ingestion, etc.)
- ✅ Expose MCP resources (documents, entities, context)
- ✅ Expose MCP prompts (domain-specific templates)
- ❌ NO agent logic, NO query planning, NO LLM calls

**API Endpoints**:
```
POST /jsonrpc       - JSON-RPC requests (Streamable HTTP)
GET /health         - Health check
GET /sessions       - Active sessions
DELETE /sessions/:id - Cleanup session
```

**Session Management**:
```typescript
interface Session {
  id: string;                    // "discord-ch-123456"
  clientType: 'cli' | 'discord' | 'slack';
  createdAt: Date;
  lastAccessedAt: Date;
  metadata: {
    channelId?: string;
    userId?: string;
    guildId?: string;
  };
  activeRequests: Map<string, RequestState>;
}
```

---

### 3. Agent Orchestrator Service

**Purpose**: Spawn, manage, and coordinate agent containers dynamically

**Container Spec**:
- Image: `arbiter-agent-orchestrator:latest`
- Port: 3200
- Volumes:
  - `/var/run/docker.sock` (for Docker API access)
- Environment:
  - `MAX_AGENTS_PER_SESSION=10`
  - `MAX_TOTAL_AGENTS=30`
  - `DOCKER_NETWORK=arbiter-network`
  - `DATA_SERVICE_URL=http://data-service:3300`
  - `DEFAULT_LLM_PROVIDER=anthropic`
  - `ANTHROPIC_API_KEY=xxx`
  - `OPENAI_API_KEY=xxx`
  - `OLLAMA_URL=http://ollama:11434`

**Responsibilities**:
- ✅ Receive query requests from MCP Server
- ✅ Analyze query complexity (simple vs complex vs list-building)
- ✅ Spawn appropriate number of agent containers
- ✅ Assign LLM models to agents based on task type
- ✅ Coordinate agent execution (parallel vs sequential)
- ✅ Consolidate agent results
- ✅ Cleanup containers on completion or timeout
- ✅ Return final response to MCP Server

**Agent Spawning Logic**:
```typescript
interface AgentSpawningStrategy {
  /**
   * Determine how many agents to spawn and their types
   */
  plan(query: string, decomposition: DecomposedQuery): AgentSpawnPlan;
}

interface AgentSpawnPlan {
  agents: AgentSpec[];
  executionMode: 'sequential' | 'parallel' | 'hybrid';
  estimatedDuration: number;
}

interface AgentSpec {
  type: 'query' | 'research' | 'validation' | 'synthesis' | 'specialist';
  llmProvider: 'anthropic' | 'openai' | 'ollama';
  llmModel: string; // "claude-sonnet-4", "gpt-4o", "llama3:70b"
  containerImage: string; // "arbiter-query-agent:latest"
  resources: {
    cpu: string;    // "0.5"
    memory: string; // "512Mi"
  };
  dependencies: string[]; // IDs of agents this depends on
}
```

**Example Spawn Plan** (Complex Query):
```typescript
// Query: "Compare Dreadnought vs Land Raider in competitive play"
const plan = {
  agents: [
    {
      type: 'query',
      llmProvider: 'anthropic',
      llmModel: 'claude-sonnet-4',
      containerImage: 'arbiter-query-agent:latest',
      resources: { cpu: '1', memory: '1Gi' },
      dependencies: []
    },
    {
      type: 'research',
      llmProvider: 'openai',
      llmModel: 'gpt-4o',
      containerImage: 'arbiter-research-agent:latest',
      resources: { cpu: '0.5', memory: '512Mi' },
      dependencies: ['query-1'] // Waits for query agent
    },
    {
      type: 'research',
      llmProvider: 'openai',
      llmModel: 'gpt-4o',
      containerImage: 'arbiter-research-agent:latest',
      resources: { cpu: '0.5', memory: '512Mi' },
      dependencies: ['query-1']
    },
    {
      type: 'synthesis',
      llmProvider: 'anthropic',
      llmModel: 'claude-sonnet-4',
      containerImage: 'arbiter-synthesis-agent:latest',
      resources: { cpu: '1', memory: '1Gi' },
      dependencies: ['research-1', 'research-2']
    },
    {
      type: 'validation',
      llmProvider: 'ollama',
      llmModel: 'llama3:70b',
      containerImage: 'arbiter-validation-agent:latest',
      resources: { cpu: '0.5', memory: '512Mi' },
      dependencies: ['synthesis-1']
    }
  ],
  executionMode: 'hybrid', // parallel research, then sequential synthesis/validation
  estimatedDuration: 8000 // 8 seconds
};
```

**Docker Container Spawning**:
```typescript
class DockerAgentSpawner {
  async spawnAgent(spec: AgentSpec): Promise<Container> {
    return await this.dockerClient.createContainer({
      Image: spec.containerImage,
      Env: [
        `AGENT_TYPE=${spec.type}`,
        `LLM_PROVIDER=${spec.llmProvider}`,
        `LLM_MODEL=${spec.llmModel}`,
        `DATA_SERVICE_URL=${process.env.DATA_SERVICE_URL}`,
        `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}`,
        `OPENAI_API_KEY=${process.env.OPENAI_API_KEY}`,
        `OLLAMA_URL=${process.env.OLLAMA_URL}`
      ],
      HostConfig: {
        NetworkMode: 'arbiter-network',
        Memory: this.parseMemory(spec.resources.memory),
        NanoCpus: this.parseCpu(spec.resources.cpu),
        AutoRemove: true // Cleanup after exit
      }
    });
  }
}
```

---

### 4. Agent Containers (Dynamically Spawned)

**Purpose**: Execute specific parts of query processing pipeline

**Base Container Spec**:
- Base Image: `arbiter-agent-base:latest`
- Specialized Images: `arbiter-query-agent`, `arbiter-research-agent`, etc.
- Port: Dynamically assigned
- Lifecycle: Ephemeral (created, executed, destroyed)

**Agent Types**:

#### 4.1 QueryAgent (Main Orchestrator)
**LLM**: Claude Sonnet 4 (default) or configurable
**Role**: Main query processing, HyDE generation, query decomposition
**Spawned**: Always (1 per query)

#### 4.2 ResearchAgent (Parallel Research)
**LLM**: GPT-4o (default) or configurable
**Role**: Deep research, multi-hop reasoning, document retrieval
**Spawned**: 2-5 for complex queries, 0 for simple lookups

#### 4.3 ValidationAgent (Self-RAG)
**LLM**: Llama 3 70B (local, cost-effective) or configurable
**Role**: Relevance check, support check, hallucination detection
**Spawned**: 1 per query (final validation)

#### 4.4 SynthesisAgent (Answer Generation)
**LLM**: Claude Sonnet 4 (default) or configurable
**Role**: Combine research results, generate coherent answer
**Spawned**: 1 for complex queries requiring synthesis

#### 4.5 SpecialistAgent (Domain-Specific)
**LLM**: Configurable per domain
**Role**: List building, points calculation, faction validation
**Spawned**: 1-10 for specialized tasks (e.g., army list building)

**Agent Container Lifecycle**:
```
1. Orchestrator receives query
2. Decompose query, create spawn plan
3. Create Docker containers with appropriate LLM configs
4. Start containers
5. Agents execute tasks (call Data Service APIs)
6. Agents return results to Orchestrator
7. Orchestrator consolidates results
8. Containers automatically removed (AutoRemove: true)
```

---

### 5. LLM Provider Abstraction

**Purpose**: Allow swapping LLM models per agent without code changes

**Strategy Pattern Implementation**:

```typescript
// Abstract LLM provider interface
interface LLMProvider {
  name: 'anthropic' | 'openai' | 'ollama';

  /**
   * Generate completion
   */
  complete(params: {
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse>;

  /**
   * Generate embedding
   */
  embed(params: {
    model: string;
    text: string;
  }): Promise<number[]>;
}

// Concrete implementations
class AnthropicProvider implements LLMProvider {
  name = 'anthropic' as const;

  async complete(params) {
    const response = await this.client.messages.create({
      model: params.model, // "claude-sonnet-4"
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      system: params.systemPrompt,
      messages: [{ role: 'user', content: params.prompt }]
    });
    return { text: response.content[0].text };
  }
}

class OpenAIProvider implements LLMProvider {
  name = 'openai' as const;

  async complete(params) {
    const response = await this.client.chat.completions.create({
      model: params.model, // "gpt-4o"
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.prompt }
      ]
    });
    return { text: response.choices[0].message.content };
  }
}

class OllamaProvider implements LLMProvider {
  name = 'ollama' as const;

  async complete(params) {
    const response = await fetch(`${this.baseURL}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: params.model, // "llama3:70b"
        prompt: params.prompt,
        system: params.systemPrompt,
        options: {
          temperature: params.temperature ?? 0.7,
          num_predict: params.maxTokens ?? 4096
        }
      })
    });
    return { text: response.response };
  }
}

// Provider Registry (DI Container)
class LLMProviderRegistry {
  private providers = new Map<string, LLMProvider>();

  register(provider: LLMProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`LLM provider '${name}' not registered`);
    }
    return provider;
  }
}

// Agent uses provider via DI
class BaseAgent {
  constructor(
    private llmProvider: LLMProvider,
    private llmModel: string
  ) {}

  protected async generateCompletion(prompt: string): Promise<string> {
    const response = await this.llmProvider.complete({
      model: this.llmModel,
      prompt
    });
    return response.text;
  }
}
```

**Configuration (Per Agent Type)**:

```typescript
// Config file: config/agent-llm-models.json
{
  "agentTypes": {
    "query": {
      "provider": "anthropic",
      "model": "claude-sonnet-4",
      "fallback": {
        "provider": "openai",
        "model": "gpt-4o"
      }
    },
    "research": {
      "provider": "openai",
      "model": "gpt-4o",
      "fallback": {
        "provider": "ollama",
        "model": "llama3:70b"
      }
    },
    "validation": {
      "provider": "ollama",
      "model": "llama3:70b",
      "fallback": {
        "provider": "anthropic",
        "model": "claude-haiku-4"
      }
    },
    "synthesis": {
      "provider": "anthropic",
      "model": "claude-sonnet-4",
      "fallback": {
        "provider": "openai",
        "model": "gpt-4o"
      }
    },
    "specialist": {
      "provider": "anthropic",
      "model": "claude-opus-4",
      "fallback": {
        "provider": "openai",
        "model": "gpt-4o"
      }
    }
  },
  "costOptimization": {
    "enabled": true,
    "useLocalFirst": true,
    "rules": [
      {
        "condition": "queryComplexity < 0.3",
        "provider": "ollama",
        "model": "llama3:70b"
      },
      {
        "condition": "queryComplexity >= 0.7",
        "provider": "anthropic",
        "model": "claude-opus-4"
      }
    ]
  }
}
```

**Benefits**:
- ✅ Swap models without code changes (config-driven)
- ✅ Cost optimization (use local Ollama for simple tasks)
- ✅ Fallback support (if primary provider fails)
- ✅ A/B testing different models
- ✅ Future-proof (add new providers easily)

---

### 6. Data Service Layer

**Purpose**: Unified data access layer for all database operations

**Container Spec**:
- Image: `arbiter-data-service:latest`
- Port: 3300
- Environment:
  - `QDRANT_URL=http://qdrant:6333`
  - `OLLAMA_URL=http://ollama:11434`
  - `POSTGRES_URL=postgres://context-db:5432/arbiter`

**Responsibilities**:
- ✅ Expose REST/gRPC API for data operations
- ✅ Implement Repository Pattern (database abstraction)
- ✅ Handle vector search (Qdrant)
- ✅ Handle embeddings (Ollama)
- ✅ Handle context storage (PostgreSQL/JSONL)
- ✅ Connection pooling and caching

**API Endpoints**:
```
POST /vector/search      - Semantic search
POST /vector/upsert      - Insert/update vectors
POST /vector/delete      - Delete vectors
POST /embedding/generate - Generate embeddings
POST /context/save       - Save conversation context
GET  /context/query      - Retrieve context
```

**Databases** (Separate Containers):
- **Qdrant** (Port 6333): Vector database
- **Ollama** (Port 11434): Local embeddings
- **PostgreSQL** (Port 5432): Context/metadata store

---

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  # ============================================
  # CLIENT SERVICES
  # ============================================

  discord-bot:
    build: ./clients/discord
    container_name: arbiter-discord-bot
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - MCP_SERVER_URL=http://mcp-server:3100
    depends_on:
      - mcp-server
    networks:
      - arbiter-network
    restart: unless-stopped

  # ============================================
  # MCP SERVER SERVICE
  # ============================================

  mcp-server:
    build: ./services/mcp-server
    container_name: arbiter-mcp-server
    ports:
      - "3100:3100"
    environment:
      - AGENT_ORCHESTRATOR_URL=http://agent-orchestrator:3200
      - MCP_TRANSPORT=http
      - MAX_SESSIONS=1000
      - NODE_ENV=production
    depends_on:
      - agent-orchestrator
    networks:
      - arbiter-network
    restart: unless-stopped

  # ============================================
  # AGENT ORCHESTRATOR SERVICE
  # ============================================

  agent-orchestrator:
    build: ./services/agent-orchestrator
    container_name: arbiter-agent-orchestrator
    ports:
      - "3200:3200"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - MAX_AGENTS_PER_SESSION=10
      - MAX_TOTAL_AGENTS=30
      - DOCKER_NETWORK=arbiter-network
      - DATA_SERVICE_URL=http://data-service:3300
      - DEFAULT_LLM_PROVIDER=anthropic
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OLLAMA_URL=http://ollama:11434
      - NODE_ENV=production
    depends_on:
      - data-service
    networks:
      - arbiter-network
    restart: unless-stopped

  # ============================================
  # DATA SERVICE LAYER
  # ============================================

  data-service:
    build: ./services/data-service
    container_name: arbiter-data-service
    ports:
      - "3300:3300"
    environment:
      - QDRANT_URL=http://qdrant:6333
      - OLLAMA_URL=http://ollama:11434
      - POSTGRES_URL=postgresql://arbiter:${POSTGRES_PASSWORD}@context-db:5432/arbiter
      - NODE_ENV=production
    depends_on:
      - qdrant
      - ollama
      - context-db
    networks:
      - arbiter-network
    restart: unless-stopped

  # ============================================
  # DATABASE SERVICES
  # ============================================

  qdrant:
    image: qdrant/qdrant:v1.7.4
    container_name: arbiter-qdrant
    ports:
      - "6333:6333"
    volumes:
      - qdrant-data:/qdrant/storage
    networks:
      - arbiter-network
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    container_name: arbiter-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama
    networks:
      - arbiter-network
    restart: unless-stopped
    # Pull models on startup
    command: >
      sh -c "ollama pull nomic-embed-text &&
             ollama pull llama3:70b &&
             ollama serve"

  context-db:
    image: postgres:16-alpine
    container_name: arbiter-context-db
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=arbiter
      - POSTGRES_USER=arbiter
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - context-db-data:/var/lib/postgresql/data
    networks:
      - arbiter-network
    restart: unless-stopped

networks:
  arbiter-network:
    driver: bridge

volumes:
  qdrant-data:
  ollama-data:
  context-db-data:
```

---

## Agent Container Images

### Base Agent Image

**Dockerfile** (`docker/agents/Dockerfile.base`):
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy shared agent code
COPY src/_shared ./src/_shared
COPY src/_agents/_shared ./src/_agents/_shared

# Copy agent base class
COPY src/_agents/_types/BaseAgent ./src/_agents/_types/BaseAgent

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node healthcheck.js || exit 1

CMD ["node", "dist/agent.js"]
```

### Specialized Agent Images

**QueryAgent Dockerfile**:
```dockerfile
FROM arbiter-agent-base:latest

# Copy QueryAgent specific code
COPY src/_agents/_types/QueryAgent ./src/_agents/_types/QueryAgent
COPY src/_agents/_context ./src/_agents/_context

ENV AGENT_TYPE=query
CMD ["node", "dist/agents/query-agent.js"]
```

---

## Cost Optimization Strategy

**LLM Model Selection by Task**:

| Agent Type | Default Model | Cost/1M Tokens | Use Case |
|------------|---------------|----------------|----------|
| QueryAgent | Claude Sonnet 4 | $3.00 | Main orchestration, HyDE, decomposition |
| ResearchAgent | GPT-4o | $2.50 | Deep research, multi-hop reasoning |
| ValidationAgent | Llama 3 70B (local) | $0.00 | Self-RAG validation (runs locally) |
| SynthesisAgent | Claude Sonnet 4 | $3.00 | Answer synthesis, comparison |
| SpecialistAgent | Claude Opus 4 | $15.00 | Complex domain tasks (list building) |

**Cost Savings**:
- Simple queries: 1 agent (Llama 3 local) = **$0.00**
- Medium queries: 3 agents (Sonnet + 2x GPT-4o) = **~$0.05**
- Complex queries: 10 agents (Opus + 5x Sonnet + 4x local) = **~$0.30**

**Expected savings vs single-model**: **40-60%** (per research)

---

## Deployment Scenarios

### Development
```bash
docker-compose up
```
- All services on single machine
- Ollama for local embeddings
- PostgreSQL for context

### Production (Single Server)
```bash
docker-compose -f docker-compose.prod.yml up -d
```
- Load balancer in front of MCP server
- Multiple agent orchestrator replicas
- Managed Qdrant Cloud
- Managed PostgreSQL (RDS/Cloud SQL)

### Production (Kubernetes)
```bash
kubectl apply -f k8s/
```
- Auto-scaling agent orchestrators
- Horizontal pod autoscaling for MCP server
- StatefulSet for databases
- Ingress for external traffic

---

## Performance Targets

**Response Times** (95th percentile):
- Simple query (1 agent): <2 seconds
- Complex query (5 agents): <8 seconds
- List building (10+ agents): <12 seconds

**Scalability**:
- Concurrent users: 1000+ (with proper infrastructure)
- Concurrent agents: 30 per orchestrator, N orchestrators
- Vectors: 10M+ per collection (Qdrant)

**Reliability**:
- Service uptime: 99.9%
- Agent spawn time: <500ms
- LLM fallback: Automatic on provider failure

---

## Security Considerations

**API Keys**:
- Never in code or images
- Passed via environment variables
- Stored in secret management (Vault, AWS Secrets Manager)

**Network Isolation**:
- Services communicate on private `arbiter-network`
- Only MCP server exposed publicly (port 3100)
- Agent containers ephemeral (no persistent data)

**Rate Limiting**:
- Per-session request limits
- Max concurrent agents per session
- LLM API rate limiting with backoff

---

## Next Steps

1. ✅ Architecture documented with containerized multi-service design
2. ✅ LLM provider abstraction pattern defined
3. ✅ Dynamic agent spawning strategy outlined
4. ⏭️ Create ADR-001: Multi-transport design
5. ⏭️ Create ADR-002: Dynamic agent container spawning
6. ⏭️ Create ADR-003: LLM provider abstraction
7. ⏭️ Create ADR-004: Microservices separation
8. ⏭️ Implement base service skeletons
9. ⏭️ Create Docker images
10. ⏭️ Set up Docker Compose for development

---

**Last Updated**: 2025-10-20
**Status**: Ready for ADR Creation & Implementation
