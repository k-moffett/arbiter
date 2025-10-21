/**
 * Agent Orchestrator
 *
 * Orchestrates dynamic agent spawning and coordination.
 * Spawns Docker containers for agents based on query complexity.
 *
 * @example
 * ```typescript
 * import { AgentOrchestrator } from '@agents/_orchestration/AgentOrchestrator';
 *
 * const orchestrator = new AgentOrchestrator();
 * const result = await orchestrator.processQuery({
 *   sessionId: 'discord-ch-123456',
 *   query: 'Build me a 2000pt Space Marine list'
 * });
 * ```
 */

// Barrel exports
export * from './interfaces';
export * from './types';

// TODO: Export implementations when ready
// export { AgentOrchestratorImplementation as AgentOrchestrator } from './AgentOrchestrator';
// export { DockerAgentSpawnerImplementation as DockerAgentSpawner } from './DockerAgentSpawner';
// export { AgentPoolManagerImplementation as AgentPoolManager } from './AgentPoolManager';
// export { QueryDecomposerImplementation as QueryDecomposer } from './QueryDecomposer';
