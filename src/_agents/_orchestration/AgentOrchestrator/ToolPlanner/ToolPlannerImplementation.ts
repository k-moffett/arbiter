/**
 * Tool Planner Implementation
 *
 * LLM-guided tool planning and selection.
 * NOT hardcoded rules - flexible and extensible.
 */

import type { Logger } from '../../../../_shared/_infrastructure';
import type { CompletionParams, LLMResponse } from '../../../_shared/types';
import type { ToolPlanner } from './interfaces';
import type { ToolPlan, ToolPlannerConfig, ToolPlanningParams, ToolStep } from './types';

import { buildToolPlanningPrompt } from './prompts';

/**
 * Ollama provider interface (minimal subset needed)
 */
interface OllamaProvider {
  complete(params: CompletionParams): Promise<LLMResponse>;
}

/**
 * Tool Planner Implementation
 *
 * @example
 * ```typescript
 * const planner = new ToolPlannerImplementation({
 *   config,
 *   logger,
 *   ollamaProvider
 * });
 *
 * const plan = await planner.planTools({
 *   query: 'Compare X and Y',
 *   complexity: 8,
 *   intentType: 'comparative'
 * });
 * // plan.steps = [{ tool: 'vector_search_context', ... }, { tool: 'analysis', ... }]
 * ```
 */
export class ToolPlannerImplementation implements ToolPlanner {
  private readonly config: ToolPlannerConfig;
  private readonly logger: Logger;
  private readonly ollamaProvider: OllamaProvider;

  constructor(params: {
    config: ToolPlannerConfig;
    logger: Logger;
    ollamaProvider: OllamaProvider;
  }) {
    this.config = params.config;
    this.logger = params.logger;
    this.ollamaProvider = params.ollamaProvider;
  }

  /**
   * Plan tool execution for a query
   */
  public async planTools(params: ToolPlanningParams): Promise<ToolPlan> {
    const startTime = Date.now();

    try {
      const promptParams: {
        availableContext?: string[];
        complexity?: number;
        intentType?: string;
        query: string;
      } = {
        query: params.query,
      };

      if (params.availableContext !== undefined) {
        promptParams.availableContext = params.availableContext;
      }

      if (params.complexity !== undefined) {
        promptParams.complexity = params.complexity;
      }

      if (params.intentType !== undefined) {
        promptParams.intentType = params.intentType;
      }

      const prompt = buildToolPlanningPrompt(promptParams);

      const response = await this.ollamaProvider.complete({
        maxTokens: 512,
        model: this.config.llmModel,
        prompt,
        temperature: this.config.temperature,
      });

      const plan = this.parsePlanResponse({ response: response.text });

      // Validate and sanitize plan
      const validatedPlan = this.validatePlan({ plan });

      const duration = Date.now() - startTime;

      this.logger.info({
        message: 'Tool plan created',
        metadata: {
          duration,
          stepsCount: validatedPlan.steps.length,
        },
      });

      return validatedPlan;
    } catch (error) {
      this.logger.error({
        message: 'Tool planning failed, using fallback',
        metadata: { error, query: params.query },
      });

      // Fallback: simple vector search plan
      return this.fallbackPlan({ query: params.query });
    }
  }

  /**
   * Extract JSON from LLM response
   */
  private extractJsonFromResponse(params: { response: string }): string {
    let jsonStr = params.response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      const match = /```json\s*(\{[\s\S]*?\})\s*```/.exec(jsonStr);
      const extracted = match?.[1];
      if (extracted !== undefined && extracted !== '') {
        jsonStr = extracted;
      }
    } else if (jsonStr.includes('```')) {
      const match = /```\s*(\{[\s\S]*?\})\s*```/.exec(jsonStr);
      const extracted = match?.[1];
      if (extracted !== undefined && extracted !== '') {
        jsonStr = extracted;
      }
    }

    // Find first JSON object
    const jsonMatch = /\{[\s\S]*?\}/.exec(jsonStr);
    if (jsonMatch !== null) {
      jsonStr = jsonMatch[0];
    }

    return jsonStr;
  }

  /**
   * Fallback plan when LLM planning fails
   */
  private fallbackPlan(params: { query: string }): ToolPlan {
    return {
      rationale: 'Fallback plan: simple vector search',
      steps: [
        {
          description: 'Retrieve relevant context',
          parameters: {
            limit: 10,
            query: params.query,
          },
          priority: 1,
          tool: 'vector_search_context',
        },
      ],
    };
  }

  /**
   * Parse LLM plan response
   */
  private parsePlanResponse(params: { response: string }): ToolPlan {
    const jsonStr = this.extractJsonFromResponse({ response: params.response });

    const parsed = JSON.parse(jsonStr) as {
      rationale: string;
      steps: Array<{
        description: string;
        parameters: Record<string, unknown>;
        priority: number;
        tool: string;
      }>;
    };

    return {
      rationale: parsed.rationale,
      steps: parsed.steps.map((step) => ({
        description: step.description,
        parameters: step.parameters,
        priority: step.priority,
        tool: this.validateToolType({ toolType: step.tool }),
      })),
    };
  }

  /**
   * Validate and sanitize tool plan
   */
  private validatePlan(params: { plan: ToolPlan }): ToolPlan {
    // Limit number of steps
    const steps = params.plan.steps.slice(0, this.config.maxSteps);

    // Sort by priority (lowest number = highest priority)
    // Manual sort to comply with single-parameter rule
    for (let i = 0; i < steps.length - 1; i++) {
      for (let j = i + 1; j < steps.length; j++) {
        const stepI = steps[i];
        const stepJ = steps[j];
        if (stepI === undefined || stepJ === undefined) {
          continue;
        }
        if (stepJ.priority < stepI.priority) {
          steps[i] = stepJ;
          steps[j] = stepI;
        }
      }
    }

    // Ensure at least one step
    if (steps.length === 0) {
      steps.push({
        description: 'Retrieve relevant context',
        parameters: { limit: 10 },
        priority: 1,
        tool: 'vector_search_context',
      });
    }

    return {
      rationale: params.plan.rationale,
      steps,
    };
  }

  /**
   * Validate tool type
   */
  private validateToolType(params: { toolType: string }): ToolStep['tool'] {
    const validTools = ['vector_search_context', 'summarize_context', 'analysis'];

    if (validTools.includes(params.toolType)) {
      return params.toolType as ToolStep['tool'];
    }

    // Default to vector search
    return 'vector_search_context';
  }
}
