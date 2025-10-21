# ADR-001: Multi-Transport Design (stdio vs Streamable HTTP)

**Status**: Accepted
**Date**: 2025-10-20
**Deciders**: Architecture Team
**Related**: architecture-overview.md

---

## Context

Arbiter needs to support multiple client types with different connectivity requirements:

1. **CLI Tool**: Single-user, local development and scripting
2. **Discord Bot**: Multi-user, multi-channel, concurrent sessions, production
3. **Future clients**: Slack bot, web UI, API gateway

The Model Context Protocol (MCP) specification (v2025-03-26) supports two transport mechanisms:
- **stdio**: Communication over standard input/output
- **Streamable HTTP**: HTTP POST/GET with optional streaming (replaces deprecated HTTP+SSE)

### Research Findings (2025 Industry Standards)

**stdio Transport**:
> "stdio has limitations for concurrent sessions since the MCP server is launched as a stdio process with streams for sending and receiving messages, creating a 1:1 connection model."
>
> "stdio is recommended when the server can live as a local subprocess of the host; it's the simplest, lowest-friction option for local integration and development."

**Streamable HTTP Transport**:
> "Streamable HTTP emerges as the recommended transport due to its superior performance, scalability, and modern architecture, achieving 10x better performance with session pooling."
>
> "For multiple concurrent sessions specifically, Streamable HTTP is the clear winner in 2025, while stdio remains appropriate only for local, single-session use cases."

**HTTP+SSE Deprecation**:
> "Server-Sent Events (SSE) transport is now officially deprecated as of the 2025-03-26 specification. The dual-endpoint architecture created significant operational complexity and performance bottlenecks."

---

## Decision

**We will implement BOTH stdio and Streamable HTTP transports in the MCP Server**, with intelligent routing based on client type:

### Transport Assignment

| Client Type | Transport | Rationale |
|-------------|-----------|-----------|
| CLI Tool | stdio | Single-user, local, low latency, simple subprocess model |
| Discord Bot | Streamable HTTP | Multi-user, concurrent sessions, production-ready |
| Slack Bot (future) | Streamable HTTP | Multi-user, concurrent sessions |
| Web UI (future) | Streamable HTTP | Browser-based, requires HTTP |
| API Gateway (future) | Streamable HTTP | Distributed, load-balanced |

### Protocol Layer

Both transports use **JSON-RPC 2.0** for message formatting:
- Unified message structure regardless of transport
- Stateful session management
- Request/response correlation via request IDs

### MCP Server Architecture

```typescript
class MCPServer {
  private transports: Transport[] = [];

  start(config: {
    stdio?: boolean;
    http?: { port: number };
  }): void {
    if (config.stdio) {
      const stdioTransport = new StdioTransport();
      stdioTransport.onRequest((req) => this.handleRequest(req));
      this.transports.push(stdioTransport);
    }

    if (config.http) {
      const httpTransport = new StreamableHTTPTransport(config.http.port);
      httpTransport.onRequest((req) => this.handleRequest(req));
      this.transports.push(httpTransport);
    }

    this.transports.forEach(t => t.start());
  }

  private async handleRequest(req: JSONRPCRequest): Promise<JSONRPCResponse> {
    // Unified request handling for both transports
    const sessionId = req.params.sessionId;
    const session = this.sessionManager.getOrCreate(sessionId);
    return this.requestRouter.route(session, req);
  }
}
```

---

## Consequences

### Positive

✅ **CLI Developer Experience**
- Fast local development with stdio (no network overhead)
- Simple subprocess model (no port conflicts)
- Works offline

✅ **Production Scalability**
- HTTP supports 1000+ concurrent Discord users
- Load balancing via reverse proxy (nginx, Traefik)
- Horizontal scaling of MCP server instances

✅ **Future-Proof**
- Easy to add new HTTP-based clients (Slack, web UI)
- Streamable HTTP aligns with 2025 MCP spec
- No dependency on deprecated SSE transport

✅ **Code Reuse**
- Single request handling logic for both transports
- JSON-RPC abstraction hides transport differences
- Shared session management

### Negative

⚠️ **Implementation Complexity**
- Must maintain two transport layers
- More test coverage required
- Docker socket binding for stdio in containers

⚠️ **Configuration Management**
- Different deployment configs for CLI vs Discord
- Environment-based transport selection

### Mitigation Strategies

1. **Unified Interface**: Both transports implement `Transport` interface
2. **Shared Core**: Request routing, session management, tool execution are transport-agnostic
3. **Comprehensive Testing**: Integration tests for both transports
4. **Clear Documentation**: Examples for both stdio and HTTP usage

---

## Alternatives Considered

### Alternative 1: stdio Only
**Rejected** because:
- ❌ Cannot handle concurrent Discord sessions (1:1 connection model)
- ❌ Not suitable for distributed deployments
- ❌ Requires long-lived processes per user

### Alternative 2: HTTP Only
**Rejected** because:
- ❌ Worse developer experience (must start HTTP server locally)
- ❌ Port conflicts in development
- ❌ Higher latency for local CLI usage
- ❌ Network configuration complexity

### Alternative 3: HTTP+SSE (Deprecated)
**Rejected** because:
- ❌ Officially deprecated in MCP spec (v2025-03-26)
- ❌ Performance bottlenecks (file descriptor limits)
- ❌ Operational complexity (dual-endpoint architecture)
- ❌ Industry moving away from SSE

### Alternative 4: gRPC
**Not Considered** because:
- ❌ Not part of MCP specification
- ❌ Would break MCP protocol compatibility
- ❌ Adds complexity without clear benefit

---

## Implementation Plan

### Phase 1: Transport Abstraction
```typescript
interface Transport {
  type: 'stdio' | 'streamable-http';
  start(): Promise<void>;
  onRequest(handler: (req: JSONRPCRequest) => Promise<JSONRPCResponse>): void;
  sendResponse(res: JSONRPCResponse): Promise<void>;
  stop(): Promise<void>;
}
```

### Phase 2: stdio Transport
```typescript
class StdioTransport implements Transport {
  start(): Promise<void> {
    process.stdin.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const req = JSON.parse(line);
        this.requestHandler(req).then((res) => this.sendResponse(res));
      }
    });
  }

  sendResponse(res: JSONRPCResponse): Promise<void> {
    process.stdout.write(JSON.stringify(res) + '\n');
  }
}
```

### Phase 3: Streamable HTTP Transport
```typescript
class StreamableHTTPTransport implements Transport {
  private httpServer: http.Server;

  constructor(private port: number) {}

  start(): Promise<void> {
    this.httpServer = http.createServer(async (req, res) => {
      if (req.method === 'POST' && req.url === '/jsonrpc') {
        const body = await this.readBody(req);
        const jsonReq = JSON.parse(body);
        const jsonRes = await this.requestHandler(jsonReq);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(jsonRes));
      }
    });

    this.httpServer.listen(this.port);
  }
}
```

### Phase 4: Client Examples

**CLI Tool** (stdio):
```typescript
// Launch MCP server as subprocess
const server = spawn('arbiter-mcp-server', ['--transport=stdio']);

// Send JSON-RPC request via stdin
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  method: 'agent/query',
  params: { sessionId: 'cli-session', query: 'What is a Terminator?' },
  id: '1'
}) + '\n');

// Read JSON-RPC response from stdout
server.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString());
  console.log(response.result);
});
```

**Discord Bot** (HTTP):
```typescript
// Connect to MCP server via HTTP
const response = await fetch('http://mcp-server:3100/jsonrpc', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'agent/query',
    params: {
      sessionId: 'discord-ch-123456',
      query: 'Build me a 2000pt Space Marine list'
    },
    id: generateId()
  })
});

const result = await response.json();
```

---

## Validation

### Acceptance Criteria

✅ CLI tool can communicate with MCP server via stdio
✅ Discord bot can communicate with MCP server via HTTP
✅ Both transports share session management logic
✅ Both transports use JSON-RPC 2.0 format
✅ HTTP transport supports concurrent sessions (>100 simultaneous users)
✅ stdio transport provides <10ms latency for local calls
✅ Unit tests for both transport implementations
✅ Integration tests for CLI and Discord clients

---

## References

- [MCP Specification v2025-03-26 - Transports](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [Why MCP Uses JSON-RPC](https://medium.com/@dan.avila7/why-model-context-protocol-uses-json-rpc-64d466112338)
- [SSE vs Streamable HTTP: Why MCP Switched](https://brightdata.com/blog/ai/sse-vs-streamable-http)
- [Multi-session Chatbot Architecture](https://medium.com/@aslam.develop912/master-session-management-for-ai-apps-a-practical-guide-with-backend-frontend-code-examples-cb36c676ea77)

---

**Decision Date**: 2025-10-20
**Status**: Accepted
**Next Review**: After implementation of Phase 1-4
