# Arbiter - Directory Structure

**Architecture Version**: 2.0 (Containerized Microservices)
**Last Updated**: 2025-10-20

## Directory Layout

```
arbiter/
├── .claude/                              # Claude Code configuration
│   └── aiContext/
│       ├── refactorPlan/                # Architecture documentation
│       │   ├── architecture-overview.md # Complete architecture spec
│       │   ├── ADR-001-multi-transport-design.md
│       │   ├── ADR-002-dynamic-agent-container-spawning.md
│       │   └── ADR-003-llm-provider-abstraction.md
│       └── codingStandards/
│           └── typescript/
│               └── project-standards.md  # Project standards
│
├── src/
│   ├── _clients/                        # Client implementations
│   │   ├── discord/                     # Discord bot (HTTP transport)
│   │   │   └── [TODO: Implementation]
│   │   └── cli/                         # CLI tool (stdio transport)
│   │       └── [TODO: Implementation]
│   │
│   ├── _services/                       # Backend microservices
│   │   ├── mcp-server/                  # MCP Server (Port 3100)
│   │   │   ├── types.ts                 # ✅ Type definitions
│   │   │   ├── interfaces.ts            # ✅ Interface definitions
│   │   │   ├── index.ts                 # ✅ Barrel exports
│   │   │   └── [TODO: Implementations]
│   │   │       ├── MCPServer/
│   │   │       ├── transports/
│   │   │       │   ├── StdioTransport/
│   │   │       │   └── StreamableHTTPTransport/
│   │   │       ├── SessionManager/
│   │   │       └── RequestRouter/
│   │   │
│   │   ├── agent-orchestrator/          # Agent Orchestrator (Port 3200)
│   │   │   ├── types.ts                 # ✅ Type definitions
│   │   │   ├── interfaces.ts            # ✅ Interface definitions
│   │   │   ├── index.ts                 # ✅ Barrel exports
│   │   │   └── [TODO: Implementations]
│   │   │       ├── AgentOrchestrator/
│   │   │       ├── DockerAgentSpawner/
│   │   │       ├── AgentPoolManager/
│   │   │       └── QueryDecomposer/
│   │   │
│   │   └── data-service/                # Data Service (Port 3300)
│   │       └── [TODO: Implementation]
│   │
│   ├── _agents/                         # Agent implementations (Docker containers)
│   │   ├── _orchestration/              # Orchestration agents
│   │   │   └── [TODO: Implementation]
│   │   ├── _types/                      # Specialized agent types
│   │   │   └── [TODO: Implementation]
│   │   │       ├── QueryAgent/
│   │   │       ├── ResearchAgent/
│   │   │       ├── ValidationAgent/
│   │   │       ├── SynthesisAgent/
│   │   │       └── SpecialistAgent/
│   │   ├── _context/                    # Context engine
│   │   │   └── [TODO: Implementation]
│   │   │       ├── HyDEEngine/
│   │   │       ├── QueryDecomposer/
│   │   │       └── ContextMemoryManager/
│   │   └── _shared/                     # Shared agent utilities
│   │       ├── types.ts                 # ✅ Type definitions
│   │       ├── interfaces.ts            # ✅ Interface definitions (LLMProvider, etc.)
│   │       ├── index.ts                 # ✅ Barrel exports
│   │       └── [TODO: Implementations]
│   │           ├── BaseAgent/
│   │           ├── LLMProvider/
│   │           │   ├── AnthropicProvider/
│   │           │   ├── OpenAIProvider/
│   │           │   ├── OllamaProvider/
│   │           │   └── LLMProviderRegistry/
│   │           └── DataServiceClient/
│   │
│   ├── _data/                           # Data layer (Repository Pattern)
│   │   ├── _repositories/               # Abstract repository interfaces
│   │   │   ├── types.ts                 # ✅ Type definitions
│   │   │   ├── interfaces.ts            # ✅ Interface definitions (DAO pattern)
│   │   │   └── index.ts                 # ✅ Barrel exports
│   │   ├── _implementations/            # Concrete implementations
│   │   │   └── [TODO: Implementation]
│   │   │       ├── _vector/
│   │   │       │   ├── QdrantAdapter/
│   │   │       │   ├── PineconeAdapter/  # Future
│   │   │       │   └── WeaviateAdapter/  # Future
│   │   │       └── _context/
│   │   │           ├── JSONLStore/
│   │   │           └── MongoDBStore/     # Future
│   │   └── _services/                   # Data service wrappers
│   │       └── [TODO: Implementation]
│   │
│   └── _shared/                         # Shared infrastructure (existing)
│       ├── _base/                       # ✅ Base classes (already implemented)
│       │   ├── BaseLogger/
│       │   ├── BaseCache/
│       │   ├── BaseValidator/
│       │   ├── BaseMetrics/
│       │   ├── BaseErrorHandler/
│       │   └── ServiceContainer/
│       └── _infrastructure/             # ✅ Infrastructure (already implemented)
│           ├── ConsoleLogger/
│           ├── MemoryCache/
│           ├── ZodValidator/
│           ├── SimpleMetrics/
│           ├── StandardErrorHandler/
│           └── InversifyServiceContainer/
│
├── docker/                              # Docker configurations
│   ├── clients/                         # Client Dockerfiles
│   │   ├── Dockerfile.discord           # [TODO: Create]
│   │   └── Dockerfile.cli               # [TODO: Create]
│   ├── services/                        # Service Dockerfiles
│   │   ├── Dockerfile.mcp-server        # [TODO: Create]
│   │   ├── Dockerfile.agent-orchestrator # [TODO: Create]
│   │   └── Dockerfile.data-service      # [TODO: Create]
│   ├── agents/                          # Agent Dockerfiles
│   │   ├── Dockerfile.base              # [TODO: Create]
│   │   ├── Dockerfile.query             # [TODO: Create]
│   │   ├── Dockerfile.research          # [TODO: Create]
│   │   ├── Dockerfile.validation        # [TODO: Create]
│   │   ├── Dockerfile.synthesis         # [TODO: Create]
│   │   └── Dockerfile.specialist        # [TODO: Create]
│   └── .dockerignore                    # ✅ Docker ignore file
│
├── config/                              # Configuration files
│   └── agent-llm-models.json            # ✅ LLM model configuration
│
├── test/                                # Tests
│   └── unit/
│       └── _shared/                     # ✅ Existing tests for shared infrastructure
│
├── docker-compose.yml                   # [TODO: Create] Development orchestration
├── docker-compose.prod.yml              # [TODO: Create] Production orchestration
└── ARCHITECTURE.md                      # ✅ This file
```

## Status Legend

- ✅ **Completed**: File exists with interface/type definitions
- 🚧 **In Progress**: Currently being worked on
- ⏭️ **TODO**: Not yet started, planned for implementation

## Implementation Status

### Phase 1: Architecture & Design ✅
- [x] Architecture overview document
- [x] ADR-001: Multi-transport design
- [x] ADR-002: Dynamic agent container spawning
- [x] ADR-003: LLM provider abstraction
- [x] Project standards updated
- [x] Directory structure created
- [x] Interface definitions created

### Phase 2: Core Infrastructure (TODO)
- [ ] MCP Server implementation
- [ ] Transport layers (stdio, HTTP)
- [ ] Session management
- [ ] Request routing

### Phase 3: Agent Orchestration (TODO)
- [ ] Agent Orchestrator service
- [ ] Docker agent spawner
- [ ] Agent pool manager
- [ ] Query decomposer

### Phase 4: Agent Implementations (TODO)
- [ ] Base Agent class
- [ ] LLM Provider implementations (Anthropic, OpenAI, Ollama)
- [ ] QueryAgent
- [ ] ResearchAgent
- [ ] ValidationAgent
- [ ] SynthesisAgent
- [ ] SpecialistAgent

### Phase 5: Data Layer (TODO)
- [ ] Data Service implementation
- [ ] QdrantAdapter
- [ ] JSONLStore
- [ ] EmbeddingService

### Phase 6: Clients (TODO)
- [ ] Discord bot client
- [ ] CLI tool client

### Phase 7: Dockerization (TODO)
- [ ] All Dockerfiles
- [ ] docker-compose.yml
- [ ] docker-compose.prod.yml

## Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| MCP Server | 3100 | JSON-RPC API gateway |
| Agent Orchestrator | 3200 | Agent management |
| Data Service | 3300 | Data access layer |
| Qdrant | 6333 | Vector database |
| Ollama | 11434 | Local embeddings |
| PostgreSQL | 5432 | Context storage |
| Discord Bot | 8080 | Health/metrics endpoint |

## Quick Start (Once Implemented)

### Development
```bash
docker-compose up
```

### Build Specific Service
```bash
docker-compose build mcp-server
docker-compose up -d mcp-server
```

### View Logs
```bash
docker-compose logs -f agent-orchestrator
```

### Run Tests
```bash
npm test
```

## References

- [Architecture Overview](.claude/aiContext/refactorPlan/architecture-overview.md)
- [Project Standards](.claude/aiContext/codingStandards/typescript/project-standards.md)
- [ADR-001: Multi-Transport Design](.claude/aiContext/refactorPlan/ADR-001-multi-transport-design.md)
- [ADR-002: Dynamic Agent Spawning](.claude/aiContext/refactorPlan/ADR-002-dynamic-agent-container-spawning.md)
- [ADR-003: LLM Provider Abstraction](.claude/aiContext/refactorPlan/ADR-003-llm-provider-abstraction.md)

---

**Next Steps**: Begin Phase 2 (Core Infrastructure) implementation starting with MCP Server.
