/**
 * Personality Provider Interfaces
 *
 * Interface definitions for personality-driven prompt customization.
 */

import type { PersonalityPrompt } from './types';

/**
 * Personality Provider Interface
 *
 * Provides personality-specific prompts and configuration.
 * Follows Interface Segregation Principle - minimal, focused interface.
 */
export interface PersonalityProvider {
  /**
   * Get personality-specific prompt additions
   */
  getPersonalityPrompt(): PersonalityPrompt;

  /**
   * Check if personality should be applied to this interaction
   *
   * @param params - Parameters for checking
   * @returns true if personality prompt should be added
   */
  shouldApplyPersonality(params: { isFirstMessage: boolean }): boolean;

  /**
   * Check if preferences should be searched on this interaction
   *
   * @param params - Parameters for checking
   * @returns true if should search for user preferences
   */
  shouldSearchForPreferences(params: { isFirstMessage: boolean }): boolean;
}
