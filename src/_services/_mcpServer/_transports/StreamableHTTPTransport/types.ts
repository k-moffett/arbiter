/**
 * StreamableHTTPTransport Type Definitions
 *
 * Types for HTTP transport configuration.
 */

/**
 * HTTP transport configuration
 */
export interface HTTPTransportConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** HTTP endpoint path */
  path?: string;
  /** Port to listen on */
  port: number;
}
