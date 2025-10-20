/**
 * Service Type Identifiers
 *
 * Central registry of Symbol-based service identifiers for dependency injection.
 * Use these symbols when registering and resolving services from the DI container.
 *
 * Why Symbols?
 * - Type-safe: Unlike strings, symbols prevent typos and provide IntelliSense
 * - Unique: Symbol.for() ensures no collisions across modules
 * - Refactor-friendly: Renaming is safe with IDE refactoring tools
 *
 * @example Registering a service
 * ```typescript
 * container.singleton({
 *   identifier: SERVICE_TYPES.Logger,
 *   factory: () => new ConsoleLogger({ level: LogLevel.INFO })
 * })
 * ```
 *
 * @example Resolving a service
 * ```typescript
 * const logger = container.resolve<BaseLogger>({
 *   identifier: SERVICE_TYPES.Logger
 * })
 * ```
 */

/**
 * Service Type Registry
 *
 * Add new service types here as you create them.
 * Use descriptive names that match the interface or class name.
 */
/* eslint-disable @typescript-eslint/naming-convention -- UPPER_CASE is appropriate for const symbol registry */
export const SERVICE_TYPES = {
  // Infrastructure Services
  CACHE: Symbol.for('Cache'),
  ERROR_HANDLER: Symbol.for('ErrorHandler'),
  LOGGER: Symbol.for('Logger'),
  METRICS: Symbol.for('Metrics'),
  VALIDATOR: Symbol.for('Validator'),

  // Future: Discord-specific services
  // CHAT_CONTEXT: Symbol.for('ChatContext'),
  // CONVERSATION_HISTORY: Symbol.for('ConversationHistory'),
  // MESSAGE_HANDLER: Symbol.for('MessageHandler'),
  // VECTOR_STORE: Symbol.for('VectorStore'),
} as const;
/* eslint-enable @typescript-eslint/naming-convention */

/**
 * Service Type
 *
 * Type helper for extracting service identifier types.
 * Ensures type safety when working with service identifiers.
 */
export type ServiceType = (typeof SERVICE_TYPES)[keyof typeof SERVICE_TYPES];
