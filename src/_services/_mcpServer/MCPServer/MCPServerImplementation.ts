/**
 * MCP Server Implementation
 *
 * Main MCP server coordinating transports, routing, and context tools.
 * Provides centralized access to Qdrant for all agent containers.
 */

import type { MCPServer } from './interfaces';
import type { MCPServerConfig } from './types';

import { QdrantClientAdapter } from '../../../_data/_repositories/QdrantClientAdapter';
import { createContextToolHandlers } from '../contextToolHandlers';
import { CONTEXT_TOOLS } from '../contextTools';
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
  private isRunning: boolean = false;
  private qdrantClient: QdrantClientAdapter | null = null;
  private router: RequestRouter | null = null;
  private startTime: number = 0;

  /**
   * Health check
   */
  public health(): { status: 'ok'; uptime: number } {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    return {
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

    // Initialize request router
    this.router = new RequestRouter();

    // Register context tools
    this.registerContextTools();

    // TODO: Initialize transports based on config
    // For now, we'll just mark the server as running
    // Transport initialization will be implemented in a future phase

    this.isRunning = true;

    // Log startup info
    this.logStartup(config);
  }

  /**
   * Stop the MCP server
   */
  public stop(): void {
    if (!this.isRunning) {
      throw new Error('Server is not running');
    }

    // TODO: Stop transports

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
       
      console.warn(`Created indexes: ${results.created.join(', ')}`);
    }
    if (results.existing.length > 0) {
       
      console.warn(`Indexes already exist: ${results.existing.join(', ')}`);
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
      await this.qdrantClient.createCollection({
        dimensions: 768, // nomic-embed-text dimensions
        name: 'conversation-history',
      });

       
      console.warn('Created Qdrant collection: conversation-history');
    } catch {
      // Collection likely already exists
       
      console.warn('Qdrant collection already exists: conversation-history');
    }

    // Create payload indexes for efficient filtering
    await this.createPayloadIndexes();
  }

  /**
   * Log startup information
   */
  private logStartup(config: MCPServerConfig): void {
    const qdrantUrl = config.qdrantUrl ?? 'http://qdrant:6333';
    const toolCount = String(CONTEXT_TOOLS.length);

     
    console.warn('MCP Server started successfully');
     
    console.warn(`- Qdrant URL: ${qdrantUrl}`);
     
    console.warn('- Collection: conversation-history');
     
    console.warn(`- Registered tools: ${toolCount}`);
  }

  /**
   * Register context tools with router
   */
  private registerContextTools(): void {
    if (this.router === null) {
      throw new Error('Router not initialized');
    }

    if (this.qdrantClient === null) {
      throw new Error('Qdrant client not initialized');
    }

    const handlers = createContextToolHandlers({
      qdrantClient: this.qdrantClient,
    });

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
}
