# TypeScript Project Standards - Arbiter

## File Organization

### Plan Files
- **Location:** `.claude/aiContext/plans/`
- **Naming:** `YYYYMMDD-HHMMSS-descriptive-name.md` (timestamp prefix)
- **Purpose:** Track major implementation phases (>2 hours work)
- **Structure:**
  - Overview (what and why)
  - Phases with tasks and acceptance criteria
  - Success metrics
  - Checkpoints
  - Risk mitigation
- **When to create:**
  - Starting new feature implementation
  - Major refactoring
  - Architecture changes
  - Multi-day work spanning multiple sessions
- **Update status:** Pending → In Progress → Completed
- **Reference in todos:** Connect planning with execution

### Summaries
- **Location:** `.claude/aiContext/summaries/`
- **Purpose:** Session insights, decisions, context preservation
- **Naming:** `FEATURE-NAME-SUMMARY.md`

### Temporary Files
- **Location:** `.claude/aiContext/temp/`
  - `.claude/aiContext/temp/test/` - Test scripts
  - `.claude/aiContext/temp/scripts/` - Utility scripts
- **Rule:** NEVER create temp files in project root
- **Cleanup:** Remove when research/investigation complete
- **Gitignored:** Yes, to prevent bloat

### Directory-Based Structure Pattern
**Status:** ✅ **MANDATORY** for all classes project-wide

All classes in the project must follow the directory-based structure pattern:

```
src/{module}/{ClassName}/
    ├── index.ts                      # Barrel exports (required)
    ├── {ClassName}Implementation.ts  # Main class (required)
    ├── consts.ts                     # Constants (optional)
    ├── enums.ts                      # Enums (optional)
    ├── types.ts                      # Type aliases (optional)
    ├── interfaces.ts                 # Interfaces (optional)
    ├── zodSchemas.ts                 # Zod schemas (optional)
    ├── mappers.ts                    # DTO mappers (optional)
    └── utils.ts                      # Pure functions (optional)
```

**Key Principles:**
- ✅ Each class gets its own directory
- ✅ Separate concerns: constants, enums, types, interfaces, schemas, mappers, implementation
- ✅ Small, focused files (<150 lines each)
- ✅ Only create optional files when needed
- ✅ Tests mirror src structure in `test/unit/`

**mappers.ts Usage:**
- Use when wrapping external SDKs/APIs with different naming conventions
- Maps external types (e.g., snake_case) to internal types (camelCase)
- Provides clean boundary between external dependencies and internal code
- Ensures type safety and maintainability

### DTO Mapper Pattern File Naming

When implementing DTO mappers to wrap external SDKs/APIs, follow this naming convention:

```
src/{module}/{ClassName}/
    ├── {domain}Types.ts     # External API types (e.g., vllmTypes.ts, ollamaTypes.ts)
    ├── interfaces.ts        # Internal interfaces (after mapping, camelCase)
    ├── mappers.ts          # DTO conversion functions
    └── utils.ts            # Pure utility functions (no types/interfaces)
```

**File Responsibilities:**

1. **`{domain}Types.ts`** - External API types
   - Contains types matching the external API exactly
   - Uses external naming conventions (e.g., snake_case)
   - File-level `/* eslint-disable @typescript-eslint/naming-convention */`
   - Examples: `vllmTypes.ts`, `ollamaTypes.ts`, `openaiTypes.ts`

2. **`interfaces.ts`** - Internal interfaces
   - Contains internal interfaces using project conventions (camelCase)
   - Used after DTO mapping throughout internal code
   - May include utility interfaces (e.g., `FetchWithTimeoutParams`)

3. **`mappers.ts`** - DTO mappers
   - Imports from both `{domain}Types.ts` AND `interfaces.ts`
   - Contains conversion functions: `toExternal*()`, `fromExternal*()`
   - May use targeted eslint-disable for snake_case object construction

4. **`utils.ts`** - Pure utility functions ONLY
   - Contains only pure functions
   - NO types, NO interfaces (extract to `interfaces.ts`)
   - Imports types/interfaces from `interfaces.ts` as needed

**Example: VLLMProvider**
```typescript
// vllmTypes.ts - External API types
/* eslint-disable @typescript-eslint/naming-convention */
export interface VLLMChatRequest {
  max_tokens?: number;
  messages: VLLMMessage[];
  model: string;
}

// interfaces.ts - Internal interfaces
export interface InternalVLLMChatRequest {
  maxTokens?: number;
  messages: InternalVLLMMessage[];
  model: string;
}
export interface FetchWithTimeoutParams {
  controller: AbortController;
  options: RequestInit;
  timeout: number;
  url: string;
}

// mappers.ts - DTO conversion
import type { InternalVLLMChatRequest } from './interfaces';
import type { VLLMChatRequest } from './vllmTypes';
export function toExternalChatRequest(
  internal: InternalVLLMChatRequest
): VLLMChatRequest {
  return { max_tokens: internal.maxTokens, ... };
}

// utils.ts - Pure functions only
import type { FetchWithTimeoutParams } from './interfaces';
export async function fetchWithTimeout<T>(
  params: FetchWithTimeoutParams
): Promise<T> { ... }
```

**See:** [DIRECTORY-BASED-STRUCTURE.md](./DIRECTORY-BASED-STRUCTURE.md) for complete documentation

**Applied To:**
- All infrastructure: ConsoleLogger, StandardErrorHandler, RuleValidator, ZodValidator, MemoryCache, SimpleMetrics
- All base classes: BaseLogger, BaseCache, BaseValidator, BaseMetrics, BaseErrorHandler, DomainError

### Folder Naming Convention: Organizing vs Implementation

**Problem:** Mixing organizational containers with implementation folders creates visual confusion and cognitive load.

**Solution:** Use underscore prefix `_` for organizing folders to create visual distinction and force sorted grouping.

#### Folder Types

**Organizing Folders (Containers):**
- **Purpose:** Group related modules, provide namespace, architectural boundaries
- **Convention:** `_lowercase` with underscore prefix
- **Examples:** `_shared`, `_base`, `_infrastructure`, `_domains`, `_usecases`
- **Rule:** May contain subfolders and implementation folders, never standalone classes

**Implementation Folders (Classes):**
- **Purpose:** House a single class implementation following directory-based structure
- **Convention:** `PascalCase` matching the class name
- **Examples:** `ConsoleLogger`, `UserService`, `BaseLogger`
- **Rule:** Must be nested within organizing folders, never at src/ root

#### Directory Structure

```
src/
├── _shared/                      ← organizing folder (sorts first)
│   ├── _base/                    ← organizing folder (nested)
│   │   ├── BaseCache/            ← implementation (PascalCase)
│   │   └── BaseLogger/           ← implementation (PascalCase)
│   ├── _infrastructure/          ← organizing folder (nested)
│   │   ├── ConsoleLogger/        ← implementation (PascalCase)
│   │   └── MemoryCache/          ← implementation (PascalCase)
│   └── lib/                      ← organizing folder (utilities)
│
├── _domains/                     ← organizing folder (future)
│   └── User/
│       └── UserEntity/           ← implementation (PascalCase)
│
└── _usecases/                    ← organizing folder (future)
    └── Auth/
        └── LoginUseCase/         ← implementation (PascalCase)
```

#### Naming Rules

1. ✅ **Organizing folders MUST use `_lowercase` prefix**
   - Examples: `_shared`, `_base`, `_domains`, `_core`
   - Sorts before alphanumeric characters on most systems

2. ✅ **Implementation folders MUST use `PascalCase`**
   - Match the exported class name exactly
   - Examples: `ConsoleLogger`, `UserService`, `BaseLogger`

3. ✅ **Implementation folders MUST be nested**
   - Never place PascalCase implementation folders at src/ root
   - Always nest within an organizing folder

4. ❌ **Never mix conventions**
   - Don't use `_PascalCase` or `lowercase` for implementations
   - Don't use `PascalCase` for organizing folders

#### Sort Order Behavior

The underscore prefix forces organizing folders to appear first in most file explorers:

**macOS/Windows:**
```
_base/           ← organizing (sorts first)
_infrastructure/ ← organizing (sorts first)
_shared/         ← organizing (sorts first)
BaseLogger/      ← implementation (sorts after)
ConsoleLogger/   ← implementation (sorts after)
lib/             ← organizing (no prefix, sorts with implementations)
```

**Note:** Sorting behavior may vary on Linux depending on locale settings.

#### Benefits

✅ **Visual clarity** - Organizing folders visually distinct from implementations
✅ **Reduced cognitive load** - Easy to identify folder purpose at a glance
✅ **Forced grouping** - Organizing folders sort together
✅ **Scalable** - Pattern works as project grows
✅ **Minimal refactoring** - Only organizing folders need renaming

#### Examples

**✅ Correct:**
```
src/
├── _shared/_base/BaseLogger/           # Organizing → Organizing → Implementation
└── _domains/User/UserEntity/           # Organizing → Organizing → Implementation
```

**❌ Incorrect:**
```
src/
├── shared/BaseLogger/                  # Missing underscore prefix
├── _ConsoleLogger/                     # Wrong: underscore on implementation
└── UserService/                        # Wrong: implementation at root level
```

## Module System

- **ESM ONLY:** Use `import/export`, never `require()` or `module.exports`
- **Package.json:** Contains `"type": "module"`
- **File extensions:** `.ts`, `.mts` for TypeScript; `.js`, `.mjs` for JavaScript
- **No CommonJS:** Project is pure ESM

## Code Quality Standards

### Testing
- **Minimum coverage:** 80%
- **Test location:** `test/unit/` and `test/integration/`
- **Framework:** Jest with ts-jest
- **Naming:** `*.test.ts` or `*.spec.ts`

### Linting & Type Checking
- **ESLint:** Strict mode, zero errors, zero warnings
- **TypeScript:** Strict mode enabled
  - `strictNullChecks: true`
  - `noImplicitAny: true`
  - `exactOptionalPropertyTypes: true`
- **Commands:**
  - `npm run typecheck` - Type checking only
  - `npm run lint` - ESLint all files
  - `npm run lint:fix` - Auto-fix issues

### Code Metrics
- **Max function length:** 75 lines
- **Max file length:** 400 lines (500 for tests)
- **Max cyclomatic complexity:** 10
- **Max function parameters:** 1 (use typed object params)
- **Max class properties:** 15
- **Max class methods:** 15

### Custom ESLint Rules
Project enforces additional code quality rules beyond standard ESLint:

#### no-promise-constructor
**Rule:** Prevent explicit Promise construction
- ❌ Avoid: `Promise.resolve()`, `Promise.reject()`, `new Promise()`
- ✅ Use: `async`/`await` patterns
- **Rationale:** Modern async/await is more readable and maintainable

```typescript
// ❌ Bad
public async flush(): Promise<void> {
  return Promise.resolve();
}

// ✅ Good
public async flush(): Promise<void> {
  return;
}
```

#### no-switch-statement
**Rule:** Prevent switch statements
- ❌ Avoid: `switch` / `case` statements
- ✅ Use: Object literals, Map, or polymorphic dispatch
- **Rationale:** Object literals are more maintainable and testable

```typescript
// ❌ Bad
switch (status) {
  case 'pending': return handlePending();
  case 'active': return handleActive();
  default: return handleUnknown();
}

// ✅ Good
const handlers = {
  pending: () => handlePending(),
  active: () => handleActive(),
};
return (handlers[status] ?? handleUnknown)();
```

#### no-logging-in-loops
**Rule:** Prevent logging inside loops
- ❌ Avoid: `logger.info()`, `console.log()` in loops
- ✅ Use: Collect data, log once outside loop
- **Rationale:** Performance and log volume management

```typescript
// ❌ Bad
for (const item of items) {
  logger.info({ message: `Processing ${item.id}` });
  process(item);
}

// ✅ Good
const processed = items.map((item) => process(item));
logger.info({ message: `Processed ${processed.length} items` });
```

#### max-conditions-per-statement
**Rule:** Limit logical operators (&&, ||) to 1 per statement
- ❌ Avoid: Multiple conditions in single statement
- ✅ Use: Early returns, Extract Methods, Specification Pattern
- **Rationale:** Improves readability and testability

```typescript
// ❌ Bad
if (user !== null && user.isActive && user.hasPermission('admin')) {
  doSomething();
}

// ✅ Good - Early returns
if (user === null) return;
if (!user.isActive) return;
if (!user.hasPermission('admin')) return;
doSomething();

// ✅ Good - Extract method
if (isValidAdmin(user)) {
  doSomething();
}

private isValidAdmin(user: User | null): boolean {
  if (user === null) return false;
  if (!user.isActive) return false;
  return user.hasPermission('admin');
}
```

#### no-bracket-notation
**Rule:** Prevent bracket notation with string literals
- ❌ Avoid: `obj['property']` with static strings
- ✅ Use: Dot notation `obj.property` or optional chaining `obj?.property`
- **Exception:** Dynamic/computed property access is allowed
- **Rationale:** Dot notation is safer and more readable

```typescript
// ❌ Bad
const value = obj['property'];
const name = data['user']['name'];

// ✅ Good - Dot notation
const value = obj.property;
const name = data.user.name;

// ✅ Good - Optional chaining for safety
const value = obj?.property;
const name = data?.user?.name;

// ✅ Good - Dynamic access (allowed)
const key = 'dynamicProperty';
const value = obj[key];
```

## System Architecture

### Multi-Service Containerized Design

**Architecture Version**: 2.0 (Containerized Microservices)
**Reference**: `.claude/aiContext/refactorPlan/architecture-overview.md`

Arbiter follows a **4-layer containerized architecture** with separate services:

```
Client Layer (Discord, CLI)
    ↓
MCP Server Service (Port 3100)
    ↓
Agent Orchestrator Service (Port 3200)
    ↓
Data Service Layer (Port 3300)
    ↓
Database Services (Qdrant, Ollama, PostgreSQL)
```

### Service Structure

**Project follows monorepo pattern with service separation:**

```
arbiter/
├── src/
│   ├── _clients/              # Client implementations
│   │   ├── discord/           # Discord bot client
│   │   └── cli/               # CLI tool client
│   ├── _services/             # Backend services
│   │   ├── mcp-server/        # MCP Server Service
│   │   ├── agent-orchestrator/ # Agent Orchestrator Service
│   │   └── data-service/      # Data Service Layer
│   ├── _agents/               # Agent implementations (spawned as containers)
│   │   ├── _orchestration/    # Orchestrator agents
│   │   ├── _types/            # Specialized agent types
│   │   ├── _context/          # Context engine (HyDE, decomposition)
│   │   └── _shared/           # Shared agent utilities
│   ├── _data/                 # Data layer abstractions
│   │   ├── _repositories/     # Repository interfaces (DAO pattern)
│   │   ├── _implementations/  # Database adapters
│   │   └── _services/         # Data service wrappers
│   └── _shared/               # Shared infrastructure
│       ├── _base/             # Base classes
│       └── _infrastructure/   # Infrastructure implementations
├── docker/
│   ├── clients/               # Client Dockerfiles
│   ├── services/              # Service Dockerfiles
│   └── agents/                # Agent Dockerfiles
├── config/
│   └── agent-llm-models.json  # LLM model configuration
└── docker-compose.yml         # Development orchestration
```

### Service Layer Naming Conventions

**Organizing Folders** (use `_lowercase`):
- `_services/` - Backend services
- `_clients/` - Client applications
- `_agents/` - Agent implementations
- `_data/` - Data layer
- `_shared/` - Shared code

**Implementation Folders** (use `PascalCase`):
- `MCPServer/` - MCP server implementation
- `AgentOrchestrator/` - Agent orchestrator implementation
- `QdrantAdapter/` - Qdrant database adapter

### Containerization Standards

**Each service MUST**:
- Have dedicated Dockerfile in `docker/{type}/Dockerfile.{service}`
- Expose health check endpoint
- Follow 12-factor app principles
- Use environment variables for configuration
- Run as non-root user in container

**Example Service Structure**:
```
src/_services/mcp-server/
├── MCPServer/
│   ├── index.ts                    # Barrel export
│   ├── MCPServerImplementation.ts  # Main server class
│   ├── interfaces.ts               # Type definitions
│   └── types.ts                    # Type aliases
├── transports/
│   ├── StdioTransport/
│   └── StreamableHTTPTransport/
├── SessionManager/
├── RequestRouter/
└── index.ts                        # Service entry point
```

### Transport Layer Standards

**JSON-RPC 2.0** is the standard protocol for all communication:
- Clients → MCP Server: JSON-RPC 2.0
- MCP Server → Agent Orchestrator: JSON-RPC 2.0 or HTTP REST
- Agents → Data Service: HTTP REST

**Multi-Transport Support**:
- **stdio**: CLI tool (single-session, local)
- **Streamable HTTP**: Discord bot, web clients (multi-session, production)

### Agent Container Standards

**All agents MUST**:
- Extend `BaseAgent` abstract class
- Accept configuration via environment variables
- Use LLM provider abstraction (Strategy Pattern)
- Call Data Service APIs (never direct database access)
- Output results to stdout (JSON format)
- Clean up resources on exit

**Agent Types**:
1. **QueryAgent**: Main orchestration, HyDE, query decomposition
2. **ResearchAgent**: Deep research, multi-hop reasoning
3. **ValidationAgent**: Self-RAG validation, hallucination detection
4. **SynthesisAgent**: Answer synthesis from multiple sources
5. **SpecialistAgent**: Domain-specific tasks (list building, calculations)

### LLM Provider Abstraction

**All LLM calls MUST**:
- Go through `LLMProvider` interface (Strategy Pattern)
- Use configuration-driven model selection
- Support fallback providers
- Track token usage

**Provider Support**:
- Anthropic (Claude Sonnet 4, Opus 4, Haiku 4)
- OpenAI (GPT-4o, GPT-4 Turbo)
- Ollama (Llama 3 70B, Mistral - local, free)

**Configuration Location**: `config/agent-llm-models.json`

### Data Layer Abstraction

**All database access MUST**:
- Go through Repository Pattern (DAO)
- Use unified interface across database types
- Support future database swapping

**Repositories**:
- `VectorRepository` → `QdrantAdapter`, `PineconeAdapter` (future)
- `ContextRepository` → `JSONLStore`, `MongoDBStore` (future)
- `MetadataRepository` → `PostgreSQLStore` (future)

### Inter-Service Communication

**Service Dependencies** (must be injected):
```typescript
// MCP Server depends on Agent Orchestrator
environment:
  - AGENT_ORCHESTRATOR_URL=http://agent-orchestrator:3200

// Agent Orchestrator depends on Data Service
environment:
  - DATA_SERVICE_URL=http://data-service:3300

// Data Service depends on databases
environment:
  - QDRANT_URL=http://qdrant:6333
  - OLLAMA_URL=http://ollama:11434
```

**Health Checks** (all services):
```typescript
GET /health
Response: { status: 'ok', service: 'mcp-server', uptime: 12345 }
```

### Docker Compose Development

**Start all services**:
```bash
docker-compose up
```

**Rebuild specific service**:
```bash
docker-compose build mcp-server
docker-compose up -d mcp-server
```

**View logs**:
```bash
docker-compose logs -f agent-orchestrator
```

### Architecture Decision Records (ADRs)

**All major architectural decisions MUST be documented** in ADRs:
- Location: `.claude/aiContext/refactorPlan/ADR-{NNN}-{title}.md`
- Format: Context, Decision, Consequences, Alternatives

**Existing ADRs**:
- ADR-001: Multi-transport design (stdio vs HTTP)
- ADR-002: Dynamic agent container spawning
- ADR-003: LLM provider abstraction

---

## Architecture Patterns

### Typed Object Parameters
All functions/methods MUST use typed object parameters:

```typescript
// ✅ Correct
function createUser(params: { email: string; name: string }): User {
  return new User(params.email, params.name);
}

// ❌ Wrong
function createUser(email: string, name: string): User {
  return new User(email, name);
}
```

### Null vs Undefined
- **Prefer null over undefined** for absent values
- Use `| null` for optional returns
- Use `| undefined` only for optional parameters/properties
- Check with `!== null` not `!= null` (no loose equality)

### No Any Types
- **Never use `any`**
- Use `unknown` with type guards instead
- Use proper TypeScript types or interfaces

```typescript
// ✅ Correct
function processData(data: unknown): Result {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return { id: (data as { id: string }).id };
  }
  throw new Error('Invalid data');
}

// ❌ Wrong
function processData(data: any): Result {
  return { id: data.id };
}
```

### Error Handling
- Always handle errors gracefully
- Use DomainError for domain-specific errors
- Use StandardErrorHandler for error processing
- Log all errors with BaseLogger
- Never swallow errors silently

### Input Validation
- Validate all external inputs
- Use ZodValidator for schema validation
- Use RuleValidator for simple validation
- Return ValidationResult with clear error messages

## Infrastructure Usage

### Base Classes
All infrastructure components must extend base classes:
- `BaseLogger` - Logging
- `BaseCache` - Caching
- `BaseMetrics` - Metrics
- `BaseValidator` - Validation
- `BaseErrorHandler` - Error handling

### Dependency Injection
- Use DI container for service management
- Register services with typed factory functions
- Prefer constructor injection
- Use singleton for stateless services
- Use transient for stateful services

## Documentation

### JSDoc
All public APIs require JSDoc:

```typescript
/**
 * Register a new user in the system
 *
 * @param params - Registration parameters
 * @param params.email - User email address
 * @param params.username - Unique username
 * @returns Newly created user entity
 *
 * @throws {DomainError} When email already exists
 *
 * @example
 * ```typescript
 * const user = await registerUser({
 *   email: 'user@example.com',
 *   username: 'johndoe'
 * });
 * ```
 */
public async registerUser(params: RegisterUserParams): Promise<User>
```

### File Headers
Every file should have a header comment:

```typescript
/**
 * UserRepository
 *
 * Repository for managing user persistence.
 * Provides CRUD operations for User entities.
 *
 * @example
 * ```typescript
 * const repo = new InMemoryUserRepository();
 * const user = await repo.create({ email, username });
 * ```
 */
```

## Security

### Secrets Management
- **NEVER commit secrets** to repository
- Use environment variables for sensitive data
- Use dotenv for local development
- Validate .env files exist in .gitignore

### Input Sanitization
- Validate all user inputs
- Sanitize data before storage
- Escape data before rendering
- Use parameterized queries

## Performance

### Context Management
- Load only relevant files
- Avoid context bloat (keep baseContext.md < 2KB)
- Use sub-agents for parallel work (max 6)
- Clean up temporary files

### Optimization Guidelines
- Profile before optimizing
- Measure performance impact
- Document optimization decisions
- Use caching appropriately
- Avoid premature optimization
