/**
 * StandardErrorHandler Interfaces
 *
 * Interface definitions for StandardErrorHandler configuration.
 */

import type { BaseLogger } from '../../_base/BaseLogger/index.js';

/**
 * Constructor parameters for StandardErrorHandler
 */
export interface StandardErrorHandlerParams {
  logger: BaseLogger;
}
