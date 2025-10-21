/**
 * StreamableHTTPTransport Implementation
 *
 * JSON-RPC transport over HTTP for Discord/Slack clients.
 */

import type { Transport } from '../../interfaces';
import type { JSONRPCRequest, JSONRPCResponse } from '../../jsonrpcTypes';
import type { HTTPTransportConfig } from './types';
import type { Express, NextFunction, Request, Response } from 'express';
import type { Server } from 'node:http';

import express from 'express';

/**
 * Streamable HTTP Transport Implementation
 *
 * Serves JSON-RPC requests over HTTP for remote clients.
 * Used for Discord/Slack bot communication.
 *
 * @example
 * ```typescript
 * const transport = new StreamableHTTPTransportImplementation({
 *   port: 3100,
 *   path: '/mcp',
 *   debug: true
 * });
 *
 * transport.onRequest(async (req) => {
 *   // Handle request
 *   return { jsonrpc: '2.0', id: req.id, result: {} };
 * });
 *
 * await transport.start();
 * ```
 */
export class StreamableHTTPTransportImplementation implements Transport {
  private app: Express | null = null;
  private readonly debug: boolean;
  private isRunning: boolean = false;
  private readonly path: string;
  private readonly port: number;
  private requestHandler: ((req: JSONRPCRequest) => Promise<JSONRPCResponse>) | null = null;
  private server: Server | null = null;

  // Interface requires public type property
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly type = 'streamable-http' as const;

  constructor(config: HTTPTransportConfig) {
    this.port = config.port;
    this.path = config.path ?? '/mcp';
    this.debug = config.debug ?? false;
  }

  /**
   * Register request handler
   */
  public onRequest(handler: (req: JSONRPCRequest) => Promise<JSONRPCResponse>): void {
    this.requestHandler = handler;
  }

  /**
   * Send JSON-RPC response (not used for HTTP - response sent inline)
   */
  public sendResponse(_res: JSONRPCResponse): Promise<void> {
    // HTTP responses are sent inline in the POST handler
    // This method exists for interface compatibility
    return (async () => {})();
  }

  /**
   * Start HTTP server
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Transport already running');
    }

    if (this.requestHandler === null) {
      throw new Error('No request handler registered');
    }

    this.app = express();

    // Middleware
    this.app.use(express.json());

    // CORS headers for cross-origin requests
    // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }

      next();
    });

    // JSON-RPC endpoint
    // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params
    this.app.post(this.path, async (req: Request, res: Response) => {
      await this.handleRequest({ req, res });
    });

    // Health check endpoint
    // eslint-disable-next-line local-rules/require-typed-params, @typescript-eslint/max-params
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok' });
    });

    // Start server
    await this.startServer();
  }

  /**
   * Stop HTTP server
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.server !== null) {
      await this.stopServer();
      this.server = null;
    }

    this.app = null;
    this.isRunning = false;

    if (this.debug) {
      console.error('[HTTPTransport] Stopped');
    }
  }

  /**
   * Handle incoming HTTP request
   */
  private async handleRequest(params: { req: Request; res: Response }): Promise<void> {
    const { req, res } = params;

    if (this.debug) {
      console.error('[HTTPTransport] Received request:', JSON.stringify(req.body));
    }

    try {
      // Parse JSON-RPC request
      const jsonrpcRequest = req.body as JSONRPCRequest;

      if (this.requestHandler === null) {
        throw new Error('No request handler');
      }

      // Process request
      const response = await this.requestHandler(jsonrpcRequest);

      // Send response
      res.json(response);

      if (this.debug) {
        console.error('[HTTPTransport] Sent response:', JSON.stringify(response));
      }
    } catch (error) {
      // Send JSON-RPC error response
      const errorResponse: JSONRPCResponse = {
        error: {
          code: -32603,
          data: error instanceof Error ? error.message : String(error),
          message: 'Internal error',
        },
        id: 0, // Use 0 when request ID is unknown
        jsonrpc: '2.0',
      };

      res.json(errorResponse);

      if (this.debug) {
        console.error('[HTTPTransport] Error:', error);
      }
    }
  }

  /**
   * Start the HTTP server listening
   */
  private async startServer(): Promise<void> {
    if (this.app === null) {
      throw new Error('Express app not initialized');
    }

    const app = this.app; // Capture for closure

    // Wrapping Node.js callback-based API requires Promise constructor
    // eslint-disable-next-line local-rules/no-promise-constructor
    return new Promise((resolve) => {
      this.server = app.listen(this.port, () => {
        this.isRunning = true;

        if (this.debug) {
          console.error(`[HTTPTransport] Started on port ${String(this.port)}`);
          console.error(`[HTTPTransport] Endpoint: POST ${this.path}`);
        }

        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  private async stopServer(): Promise<void> {
    if (this.server === null) {
      return;
    }

    const server = this.server; // Capture for closure

    // Wrapping Node.js callback-based API requires Promise constructor
    // eslint-disable-next-line local-rules/no-promise-constructor, local-rules/require-typed-params, @typescript-eslint/max-params
    return new Promise((resolve, reject) => {
      server.close((error) => {
        if (error !== undefined) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
