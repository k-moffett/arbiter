/**
 * InversifyServiceContainer Barrel Export
 *
 * Public API for the InversifyJS-based service container implementation.
 *
 * @example
 * ```typescript
 * import 'reflect-metadata'
 * import { InversifyServiceContainer } from '@shared/_infrastructure'
 *
 * const container = new InversifyServiceContainer()
 * container.singleton({
 *   identifier: Symbol.for('Logger'),
 *   factory: () => new ConsoleLogger()
 * })
 * ```
 */

// Implementation
export { InversifyServiceContainer } from './InversifyServiceContainerImplementation.js';
