/**
 * StdioTransport Implementation
 *
 * JSON-RPC transport over stdin/stdout for CLI communication.
 */

import type { Transport } from '../../interfaces';
import type { JSONRPCRequest, JSONRPCResponse } from '../../jsonrpcTypes';
import type { StdioTransportConfig } from './types';

import * as readline from 'node:readline';

/**
 * Stdio Transport Implementation
 *
 * Reads JSON-RPC requests from stdin, writes responses to stdout.
 * Used for CLI client communication.
 *
 * @example
 * ```typescript
 * const transport = new StdioTransportImplementation({ debug: true });
 * transport.onRequest(async (req) => {
 *   // Handle request
 *   return { jsonrpc: '2.0', id: req.id, result: {} };
 * });
 * await transport.start();
 * ```
 */
export class StdioTransportImplementation implements Transport {
  private readonly debug: boolean;
  private isRunning: boolean = false;
  private requestHandler: ((req: JSONRPCRequest) => Promise<JSONRPCResponse>) | null = null;
  private rl: readline.Interface | null = null;

  // Interface requires public type property
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public readonly type = 'stdio' as const;

  constructor(config: StdioTransportConfig = {}) {
    this.debug = config.debug ?? false;
  }

  /**
   * Register request handler
   */
  public onRequest(handler: (req: JSONRPCRequest) => Promise<JSONRPCResponse>): void {
    this.requestHandler = handler;
  }

  /**
   * Send JSON-RPC response to stdout
   */
  public sendResponse(res: JSONRPCResponse): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Transport not running');
    }

    const json = JSON.stringify(res);
    process.stdout.write(`${json}\n`);

    if (this.debug) {
      console.error('[StdioTransport] Sent response:', json);
    }

    // Wrap in async function to satisfy interface requirement
    return (async () => {})();
  }

  /**
   * Start listening on stdin
   */
  public start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Transport already running');
    }

    if (this.requestHandler === null) {
      throw new Error('No request handler registered');
    }

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // eslint-disable-next-line local-rules/require-typed-params
    this.rl.on('line', (line: string) => {
      void this.handleLine({ line });
    });

    this.rl.on('close', () => {
      if (this.debug) {
        console.error('[StdioTransport] stdin closed');
      }
      void this.stop();
    });

    this.isRunning = true;

    if (this.debug) {
      console.error('[StdioTransport] Started, listening on stdin');
    }

    // Wrap in async function to satisfy interface requirement
    return (async () => {})();
  }

  /**
   * Stop the transport
   */
  public stop(): Promise<void> {
    if (!this.isRunning) {
      return (async () => {})();
    }

    if (this.rl !== null) {
      this.rl.close();
      this.rl = null;
    }

    this.isRunning = false;

    if (this.debug) {
      console.error('[StdioTransport] Stopped');
    }

    // Wrap in async function to satisfy interface requirement
    return (async () => {})();
  }

  /**
   * Handle incoming line from stdin
   */
  private async handleLine(params: { line: string }): Promise<void> {
    const { line } = params;

    if (line.trim() === '') {
      return; // Skip empty lines
    }

    if (this.debug) {
      console.error('[StdioTransport] Received:', line);
    }

    try {
      const request = JSON.parse(line) as JSONRPCRequest;

      if (this.requestHandler === null) {
        throw new Error('No request handler');
      }

      const response = await this.requestHandler(request);
      await this.sendResponse(response);
    } catch (error) {
      // Send JSON-RPC error response
      const errorResponse: JSONRPCResponse = {
        error: {
          code: -32700,
          data: error instanceof Error ? error.message : String(error),
          message: 'Parse error',
        },
        id: 0, // Use 0 when request ID is unknown
        jsonrpc: '2.0',
      };

      await this.sendResponse(errorResponse);

      if (this.debug) {
        console.error('[StdioTransport] Error:', error);
      }
    }
  }
}
