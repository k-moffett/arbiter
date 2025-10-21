/**
 * MCP Server Implementation
 *
 * Main MCP server coordinating transports, routing, and context tools.
 * Provides centralized access to Qdrant for all agent containers.
 */

import type { Transport } from '../interfaces';
import type { JSONRPCRequest, JSONRPCResponse } from '../jsonrpcTypes';
import type { HealthCheckResponse, MCPServer } from './interfaces';
import type { MCPServerConfig } from './types';

import { QdrantClientAdapter } from '../../../_data/_repositories/QdrantClientAdapter';
import { Logger } from '../../../_shared/_infrastructure';
import { StdioTransport } from '../_transports/StdioTransport';
import { StreamableHTTPTransport } from '../_transports/StreamableHTTPTransport';
import { ContextToolRegistry } from '../ContextToolRegistry';
import { RequestRouter } from '../RequestRouter';

/**
 * MCP Server Implementation
 *
 * @example
 * ```typescript
 * const server = new MCPServerImplementation();
 *
 * await server.start({
 *   httpPort: 3100,
 *   qdrantUrl: 'http://qdrant:6333',
 *   transports: ['streamable-http']
 * });
 * ```
 */
export class MCPServerImplementation implements MCPServer {
  private readonly activeRequests: Map<string, Date> = new Map();
  private contextToolRegistry: ContextToolRegistry | null = null;
  private isRunning: boolean = false;
  private readonly logger: Logger;
  private readonly maxConcurrentRequests: number;
  private qdrantClient: QdrantClientAdapter | null = null;
  private readonly requestTimeout: number;
  private router: RequestRouter | null = null;
  private startTime: number = 0;
  private transport: Transport | null = null;

  constructor() {
    this.maxConcurrentRequests = 50;  // Default, overridden by config
    this.requestTimeout = 30000;       // Default, overridden by config
    this.logger = new Logger({
      metadata: {
        className: 'MCPServerImplementation',
        serviceName: 'MCP Server',
      },
    });
  }

  /**
   * Health check with detailed metrics
   */
  public health(): HealthCheckResponse {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    const memUsage = process.memoryUsage();

    return {
      activeRequests: this.activeRequests.size,
      memoryUsage: {
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
      },
      qdrantConnected: this.qdrantClient !== null,
      queuedRequests: 0, // No queue in simple polling approach
      status: 'ok',
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Start the MCP server
   */
  public async start(config: MCPServerConfig): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    this.startTime = Date.now();

    // Apply configuration overrides
    if (config.maxConcurrentRequests !== undefined) {
      // Use type assertion to assign to readonly property during initialization
      (this as unknown as { maxConcurrentRequests: number }).maxConcurrentRequests =
        config.maxConcurrentRequests;
    }

    if (config.requestTimeout !== undefined) {
      (this as unknown as { requestTimeout: number }).requestTimeout = config.requestTimeout;
    }

    // Initialize Qdrant client
    const qdrantConfig: {
      apiKey?: string;
      collection: string;
      url: string;
    } = {
      collection: 'conversation-history',
      url: config.qdrantUrl ?? 'http://qdrant:6333',
    };

    if (config.qdrantApiKey !== undefined) {
      qdrantConfig.apiKey = config.qdrantApiKey;
    }

    this.qdrantClient = new QdrantClientAdapter(qdrantConfig);

    // Ensure collection exists
    await this.ensureCollection();

    // Initialize context tool registry
    this.contextToolRegistry = new ContextToolRegistry({
      qdrantClient: this.qdrantClient,
    });

    // Initialize request router
    this.router = new RequestRouter();

    // Register context tools
    this.registerContextTools();

    // Initialize and start transport
    await this.initializeTransport(config);

    this.isRunning = true;

    // Log startup info
    this.logStartup(config);
  }

  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    // Stop transport
    if (this.transport !== null) {
      await this.transport.stop();
      this.transport = null;
    }

    this.contextToolRegistry = null;
    this.router = null;
    this.qdrantClient = null;
    this.isRunning = false;
  }

  /**
   * Create payload indexes for efficient query filtering
   */
  private async createPayloadIndexes(): Promise<void> {
    if (this.qdrantClient === null) {
      throw new Error('Qdrant client not initialized');
    }

    const indexes = [
      { fieldName: 'sessionId', fieldSchema: 'keyword' as const },
      { fieldName: 'requestId', fieldSchema: 'keyword' as const },
      { fieldName: 'rootRequestId', fieldSchema: 'keyword' as const },
      { fieldName: 'agentType', fieldSchema: 'keyword' as const },
      { fieldName: 'userFeedback', fieldSchema: 'keyword' as const },
      { fieldName: 'userId', fieldSchema: 'keyword' as const },
      { fieldName: 'channelId', fieldSchema: 'keyword' as const },
      { fieldName: 'role', fieldSchema: 'keyword' as const },
      { fieldName: 'timestamp', fieldSchema: 'integer' as const },
    ];

    const results = {
      created: [] as string[],
      existing: [] as string[],
    };

    for (const index of indexes) {
      try {
        await this.qdrantClient.createPayloadIndex({
          collection: 'conversation-history',
          ...index,
        });
        results.created.push(index.fieldName);
      } catch {
        results.existing.push(index.fieldName);
      }
    }

    // Log results after loop completes
    if (results.created.length > 0) {
      this.logger.info({
        message: 'Created payload indexes',
        context: { createdIndexes: results.created },
      });
    }
    if (results.existing.length > 0) {
      this.logger.debug({
        message: 'Payload indexes already exist',
        context: { existingIndexes: results.existing },
      });
    }
  }

  /**
   * Ensure Qdrant collection exists with proper schema
   */
  private async ensureCollection(): Promise<void> {
    if (this.qdrantClient === null) {
      throw new Error('Qdrant client not initialized');
    }

    try {
      // Try to create collection (will fail if it already exists)
      const dimensions = 768; // nomic-embed-text dimensions
      const collectionName = 'conversation-history';

      await this.qdrantClient.createCollection({
        dimensions,
        name: collectionName,
      });

      this.logger.info({
        message: 'Created Qdrant collection',
        context: { collection: collectionName, dimensions },
      });
    } catch {
      // Collection likely already exists
      const collectionName = 'conversation-history';
      this.logger.debug({
        message: 'Qdrant collection already exists',
        context: { collection: collectionName },
      });
    }

    // Create payload indexes for efficient filtering
    await this.createPayloadIndexes();
  }

  /**
   * Execute request with concurrency control
   */
  private async executeWithConcurrencyControl(params: {
    request: JSONRPCRequest;
  }): Promise<JSONRPCResponse> {
    const requestId = `req_${String(Date.now())}_${String(Math.random()).slice(2, 8)}`;

    // Check if we can process immediately
    if (this.activeRequests.size < this.maxConcurrentRequests) {
      return await this.processRequest({ request: params.request, requestId });
    }

    // Wait until capacity is available
    while (this.activeRequests.size >= this.maxConcurrentRequests) {
      // Wait a bit before checking again (polling approach)
      // eslint-disable-next-line local-rules/no-promise-constructor -- Wrapping callback-based setTimeout API
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }

    // Now process the request
    return await this.processRequest({ request: params.request, requestId });
  }

  /**
   * Handle incoming JSON-RPC request from transport
   * Applies concurrency control, timeout, and queuing
   */
  private async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    return await this.executeWithConcurrencyControl({ request });
  }

  /**
   * Initialize and start transport
   */
  private async initializeTransport(config: MCPServerConfig): Promise<void> {
    const transportType = config.transports[0]; // Use first transport for MVP

    if (transportType === 'stdio') {
      this.transport = new StdioTransport({ debug: true });
    } else if (transportType === 'streamable-http') {
      this.transport = new StreamableHTTPTransport({
        debug: true,
        port: config.httpPort ?? 3100,
      });
    } else {
      throw new Error(`Unsupported transport type: ${String(transportType)}`);
    }

    // Wire router to transport
    this.transport.onRequest(async (req) => this.handleRequest(req));

    // Start transport
    await this.transport.start();
  }

  /**
   * Log startup information
   */
  private logStartup(config: MCPServerConfig): void {
    if (this.contextToolRegistry === null) {
      throw new Error('Context tool registry not initialized');
    }

    const qdrantUrl = config.qdrantUrl ?? 'http://qdrant:6333';
    const toolCount = this.contextToolRegistry.getToolDefinitions().length;

    this.logger.info({
      message: 'MCP Server started successfully',
      context: {
        collection: 'conversation-history',
        maxConcurrentRequests: this.maxConcurrentRequests,
        qdrantUrl,
        registeredTools: toolCount,
        requestTimeout: this.requestTimeout,
      },
    });
  }

  /**
   * Process request with tracking and timeout
   */
  private async processRequest(params: {
    request: JSONRPCRequest;
    requestId: string;
  }): Promise<JSONRPCResponse> {
    // Track active request
    this.activeRequests.set(params.requestId, new Date());

    try {
      // Create timeout promise
      // eslint-disable-next-line local-rules/no-promise-constructor, local-rules/require-typed-params, @typescript-eslint/max-params -- Wrapping callback-based setTimeout API
      const timeoutPromise = new Promise<JSONRPCResponse>((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${String(this.requestTimeout)}ms`));
        }, this.requestTimeout);
      });

      // Race between actual request and timeout
      const response = await Promise.race([
        this.routeRequest(params.request),
        timeoutPromise,
      ]);

      return response;
    } finally {
      // Remove from active requests
      this.activeRequests.delete(params.requestId);
    }
  }

  /**
   * Register context tools with router
   */
  private registerContextTools(): void {
    if (this.router === null) {
      throw new Error('Router not initialized');
    }

    if (this.contextToolRegistry === null) {
      throw new Error('Context tool registry not initialized');
    }

    const handlers = this.contextToolRegistry.createHandlers();

    // Register each context tool
    this.router.registerTool({
      handler: async (params: unknown) => handlers.handleVectorUpsertContext(params),
      name: 'vector_upsert_context',
    });

    this.router.registerTool({
      handler: async (params: unknown) => handlers.handleVectorSearchContext(params),
      name: 'vector_search_context',
    });

    this.router.registerTool({
      handler: async (params: unknown) => handlers.handleGetRequestContext(params),
      name: 'get_request_context',
    });
  }

  /**
   * Route request through router
   */
  private async routeRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (this.router === null) {
      throw new Error('Router not initialized');
    }

    // Create minimal session for request
    // TODO: Implement proper session management with SessionManager
    const session = {
      activeRequests: new Map(),
      clientType: 'cli' as const,
      createdAt: new Date(),
      id: 'default-session',
      lastAccessedAt: new Date(),
      metadata: {},
    };

    return this.router.route({ request, session });
  }
}
