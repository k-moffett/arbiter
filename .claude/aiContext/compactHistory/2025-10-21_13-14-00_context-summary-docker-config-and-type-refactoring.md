# Session Context: Docker Configuration & Type Structure Refactoring

**Date:** 2025-10-21
**Session Duration:** ~2 hours
**Status:** ✅ Complete

## Session Summary

This session completed two major tasks:
1. **Docker Infrastructure Configuration** - Environment variables, concurrency control, container lifecycle
2. **Type Structure Refactoring** - Eliminated `_sharedTypes` directory, aligned with project conventions

## Key Accomplishments

### 1. Docker Configuration (100% Complete)

**Files Created/Updated:**
- ✅ `docker-compose.mcp.yml` - MCP server stack with persistent services
- ✅ `docker-compose.cli.yml` - User-controlled CLI client
- ✅ `docker-compose.services.yml` - Updated with restart policies
- ✅ `docker/scripts/health-check.sh` - Service health verification
- ✅ `package.json` - Docker management scripts
- ✅ `.env.example` - Complete environment variable documentation

**Container Lifecycle Strategy:**
- **Persistent services** (`restart: unless-stopped`): qdrant, ollama, mcp-server
  - Never rebuild on requests, remain running
- **One-time init** (`restart: "no"`): ollama-init
  - Pulls models once, exits, never restarts
- **User-controlled** (no restart): cli
  - Interactive session, removed with `--rm` flag

**MCP Server Concurrency:**
- Max concurrent requests: 50 (configurable via `MAX_CONCURRENT_REQUESTS`)
- Request timeout: 30,000ms (configurable via `REQUEST_TIMEOUT`)
- Implementation: Capacity-based polling with timeout protection
- Tracking: Active requests Map with request IDs, cleanup in finally block

**Environment Variables:**
- All Docker compose files use `${VAR:-default}` syntax
- Loaded from root `.env` via dotenv
- Documented in `.env.example` with descriptions and defaults

**NPM Scripts Added:**
```bash
npm run docker:mcp:up          # Start MCP server stack
npm run docker:mcp:down        # Stop MCP server stack
npm run docker:mcp:logs        # View logs
npm run docker:cli             # Run CLI client
npm run docker:health          # Run health check script
npm run docker:mvp             # Start full MVP stack + health check
npm run docker:mvp:down        # Stop all MVP services
```

### 2. Type Structure Refactoring (100% Complete)

**Problem Identified:**
- `src/_services/_mcpServer/_sharedTypes/` directory violated project structure conventions
- Project pattern: shared types live at root of parent directory, NOT in subdirectories
- Naming convention: `{domain}Types.ts` (NOT dot notation like `domain.types.ts`)

**Solution Implemented:**
- Moved `_sharedTypes/jsonrpcTypes.ts` → `jsonrpcTypes.ts` (root)
- Moved `_sharedTypes/sessionTypes.ts` → `sessionTypes.ts` (root)
- Deleted `_sharedTypes/` directory entirely
- Updated all imports in 8 files

**Adjacency Principle Applied:**
- JSON-RPC types used by: MCPServer/, RequestRouter/, _transports/
- Session types used by: MCPServer/, RequestRouter/
- Highest common directory: `_mcpServer/` root ✅

**Files Updated:**
- Root level: `types.ts`, `interfaces.ts`
- MCPServer: `types.ts`, `MCPServerImplementation.ts`
- RequestRouter: `interfaces.ts`, `RequestRouterImplementation.ts`
- Transports: `StdioTransportImplementation.ts`, `StreamableHTTPTransportImplementation.ts`

**Verification:**
- ✅ `npm run typecheck` - 0 errors
- ✅ `npm run lint` - 0 errors (auto-fixed import ordering)
- ✅ `npm run build` - Clean compilation

## Critical Insights

### Docker Container Best Practices
1. **Never use hardcoded values** - Always use `${VAR:-default}` for configurability
2. **Restart policies matter** - Distinguish between persistent, one-time, and interactive containers
3. **Health checks are critical** - Use TCP socket tests for reliability
4. **Resource limits prevent conflicts** - Specify CPU/memory limits for GPU services
5. **Network isolation** - Use `external: true` for CLI to connect to existing network

### Project Structure Conventions
1. **No `_sharedTypes` directories** - Breaks adjacency principle
2. **Naming convention**: `{domain}Types.ts` (e.g., `vllmTypes.ts`, `jsonrpcTypes.ts`)
3. **NOT dot notation**: Never use `domain.types.ts` format
4. **Adjacency principle**: Types live at highest common directory where shared
5. **Organizing folders**: Use `_lowercase` prefix (e.g., `_services`, `_data`)
6. **Implementation folders**: Use `PascalCase` matching class name

### MCP Server Concurrency Pattern
```typescript
// Capacity-based polling approach
private async executeWithConcurrencyControl(params: {
  request: JSONRPCRequest;
}): Promise<JSONRPCResponse> {
  // Check capacity
  if (this.activeRequests.size < this.maxConcurrentRequests) {
    return await this.processRequest({ request, requestId });
  }

  // Poll until capacity available
  while (this.activeRequests.size >= this.maxConcurrentRequests) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return await this.processRequest({ request, requestId });
}

// Track with timeout protection
private async processRequest(params: {
  request: JSONRPCRequest;
  requestId: string;
}): Promise<JSONRPCResponse> {
  this.activeRequests.set(params.requestId, new Date());

  try {
    return await Promise.race([
      this.routeRequest(params.request),
      timeoutPromise,
    ]);
  } finally {
    this.activeRequests.delete(params.requestId);
  }
}
```

## Architecture Decisions

### ADR: Container Lifecycle Management
**Context:** Need to prevent services from rebuilding on every request while supporting one-time initialization.

**Decision:** Three-tier container lifecycle:
1. Persistent services: `restart: unless-stopped`
2. One-time init: `restart: "no"`
3. User-controlled: No restart policy

**Consequences:**
- ✅ Services persist across requests
- ✅ GPU resources not wasted on restarts
- ✅ Proper separation of concerns
- ✅ Explicit user control for CLI

### ADR: Environment Variable Strategy
**Context:** Need consistent configuration across local development and Docker.

**Decision:** Use `${VAR:-default}` syntax in all compose files, load from root `.env` via dotenv.

**Consequences:**
- ✅ Single source of truth (`.env`)
- ✅ Sensible defaults for production
- ✅ Easy customization per environment
- ✅ Well-documented in `.env.example`

### ADR: Type File Placement
**Context:** `_sharedTypes` directory violated project structure conventions.

**Decision:** Place shared types at highest common directory level using `{domain}Types.ts` naming.

**Consequences:**
- ✅ Follows established project pattern
- ✅ Clear adjacency to usage
- ✅ Consistent with DTO mapper pattern (e.g., `vllmTypes.ts`)
- ✅ No special subdirectories needed

## Dependencies & Relationships

### Service Dependencies (Docker)
```
CLI Client
  ↓ depends_on
MCP Server (port 3100)
  ↓ depends_on
Qdrant (port 6333)

Supporting Services:
- Ollama (port 11434) - GPU bound
- vLLM (port 8000) - GPU bound
- ollama-init - One-time model download
```

### Type Dependencies (TypeScript)
```
jsonrpcTypes.ts (root)
  ↓ imported by
  - MCPServer/MCPServerImplementation.ts
  - RequestRouter/interfaces.ts
  - RequestRouter/RequestRouterImplementation.ts
  - _transports/StdioTransport/StdioTransportImplementation.ts
  - _transports/StreamableHTTPTransport/StreamableHTTPTransportImplementation.ts
  - types.ts (re-export)
  - interfaces.ts (re-export)

sessionTypes.ts (root)
  ↓ imported by
  - MCPServer/types.ts (TransportType)
  - RequestRouter/interfaces.ts (Session)
  - types.ts (re-export)
```

## Next Steps & Priorities

### High Priority
1. **Integration Testing** (Pending)
   - Test concurrent request handling (50+ simultaneous requests)
   - Verify containers don't rebuild on requests
   - Validate health checks work correctly
   - Test MCP server timeout behavior (30s)

2. **Docker Stack Testing**
   - Run `npm run docker:mvp` to start full stack
   - Verify all services healthy
   - Test CLI client interaction
   - Monitor resource usage with GPU services

### Medium Priority
3. **Documentation Updates**
   - Update ARCHITECTURE.md with Docker configuration
   - Document environment variable usage
   - Add Docker troubleshooting guide

4. **Performance Optimization**
   - Monitor concurrency queue behavior
   - Tune polling interval (currently 100ms)
   - Optimize health check intervals

### Low Priority
5. **Additional Features**
   - Add Prometheus metrics for concurrency tracking
   - Implement graceful shutdown for MCP server
   - Add request priority queuing

## Blockers & Considerations

### Current Blockers
- None - all planned work complete

### Important Considerations

1. **GPU Resource Management**
   - Ollama and vLLM both use GPU 0 (RTX 4070 12GB)
   - Memory limits configured: Ollama (8GB max), vLLM (12GB max)
   - Must monitor VRAM usage during concurrent requests

2. **Concurrency Tuning**
   - Default 50 concurrent requests may need adjustment based on:
     - Qdrant performance under load
     - Agent orchestrator capacity
     - Memory constraints
   - Polling interval (100ms) may need tuning

3. **Health Check Reliability**
   - TCP socket tests used for maximum reliability
   - 30-60s start_period for model loading (vLLM)
   - Must ensure health checks don't overlap with actual requests

4. **Environment Variable Loading**
   - Dotenv loads from root `.env` automatically
   - Docker compose substitution happens at runtime
   - Must ensure `.env` exists before running Docker commands

## File Changes Summary

**Created:**
- `src/_services/_mcpServer/jsonrpcTypes.ts` (35 lines)
- `src/_services/_mcpServer/sessionTypes.ts` (41 lines)
- `docker/scripts/health-check.sh` (62 lines, executable)

**Modified:**
- `src/_services/_mcpServer/types.ts` - Updated imports
- `src/_services/_mcpServer/interfaces.ts` - Updated imports
- `src/_services/_mcpServer/MCPServer/types.ts` - Updated imports
- `src/_services/_mcpServer/MCPServer/MCPServerImplementation.ts` - Updated imports, concurrency control
- `src/_services/_mcpServer/RequestRouter/interfaces.ts` - Updated imports
- `src/_services/_mcpServer/RequestRouter/RequestRouterImplementation.ts` - Updated imports
- `src/_services/_mcpServer/_transports/StdioTransport/StdioTransportImplementation.ts` - Updated imports
- `src/_services/_mcpServer/_transports/StreamableHTTPTransport/StreamableHTTPTransportImplementation.ts` - Updated imports
- `docker-compose.mcp.yml` - Environment variable substitution
- `docker-compose.cli.yml` - Environment variable substitution
- `package.json` - Added Docker scripts

**Deleted:**
- `src/_services/_mcpServer/_sharedTypes/` (entire directory)

## Verification Status

✅ **TypeScript Compilation:** `npm run typecheck` - 0 errors
✅ **ESLint:** `npm run lint` - 0 errors, 0 warnings
✅ **Build:** `npm run build` - Clean compilation
✅ **Directory Structure:** Verified via `ls` commands
✅ **Import Resolution:** All imports updated and verified

## Session Metrics

- **Files Created:** 3
- **Files Modified:** 13
- **Files Deleted:** 4 (entire `_sharedTypes/` directory)
- **Lines of Code Added:** ~200
- **Lines of Code Modified:** ~50
- **Import Statements Updated:** 8
- **Todo Items Completed:** 18
- **Commands Executed:** ~30 (reads, edits, verifications)

---

**Session Outcome:** ✅ Successfully completed Docker configuration with environment variables and concurrency control, refactored type structure to follow project conventions, verified all changes with clean build.
