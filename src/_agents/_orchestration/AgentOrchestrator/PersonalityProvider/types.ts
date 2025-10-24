/**
 * Personality Provider Types
 *
 * Type definitions for personality-driven prompt customization.
 */

/**
 * Available personality types
 */
export type PersonalityType = 'newwestern' | 'tabletop' | 'none';

/**
 * Personality prompt configuration
 */
export interface PersonalityPrompt {
  /**
   * Additional system prompt content specific to this personality
   * Includes guidelines for greeting behavior and personality traits
   */
  systemPromptAddition: string;
}

/**
 * Personality provider configuration
 */
export interface PersonalityProviderConfig {
  /**
   * Whether personality should persist for all messages or only first message
   * Default: false (only first message)
   */
  persistentPersonality?: boolean;
  /**
   * Type of personality to use
   */
  personalityType: PersonalityType;
}
