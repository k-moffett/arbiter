/**
 * Personality Provider Implementation
 *
 * Provides personality-specific prompts and behavior configuration.
 * Single Responsibility: Only handles personality-related logic.
 */

import type { PersonalityProvider } from './interfaces';
import type { PersonalityPrompt, PersonalityProviderConfig } from './types';

import { PERSONALITIES } from './personalities';

/**
 * Personality Provider Implementation
 *
 * @example
 * ```typescript
 * const provider = new PersonalityProviderImplementation({
 *   config: { personalityType: 'newwestern' }
 * });
 *
 * const prompt = provider.getPersonalityPrompt();
 * // prompt.systemPromptAddition = "You are an expert in real estate..."
 * // Includes greeting guidelines for the LLM to generate dynamic welcomes
 *
 * const shouldSearch = provider.shouldSearchForPreferences({ isFirstMessage: true });
 * // shouldSearch = true (search for user name and preferences)
 * ```
 */
export class PersonalityProviderImplementation implements PersonalityProvider {
  private readonly config: PersonalityProviderConfig;
  private readonly personality: PersonalityPrompt;

  constructor(params: { config: PersonalityProviderConfig }) {
    this.config = params.config;
    this.personality = PERSONALITIES[params.config.personalityType];
  }

  /**
   * Get personality-specific prompt additions
   */
  public getPersonalityPrompt(): PersonalityPrompt {
    return this.personality;
  }

  /**
   * Check if personality should be applied to this interaction
   *
   * Applies if:
   * - persistentPersonality is enabled (applies to all messages), OR
   * - This is the first message (applies only to greeting)
   */
  public shouldApplyPersonality(params: { isFirstMessage: boolean }): boolean {
    // If no personality is set, never apply
    if (this.config.personalityType === 'none') {
      return false;
    }

    // If persistent personality is enabled, always apply
    if (this.config.persistentPersonality === true) {
      return true;
    }

    // Otherwise, only apply on first message
    return params.isFirstMessage;
  }

  /**
   * Check if preferences should be searched on this interaction
   *
   * Only search on first message and only if personality is set (not 'none').
   */
  public shouldSearchForPreferences(params: { isFirstMessage: boolean }): boolean {
    return params.isFirstMessage && this.config.personalityType !== 'none';
  }
}
