/**
 * Clack Theme Interfaces
 *
 * Defines contracts for themed CLI prompts and messages.
 */

import type { GradientTheme } from '../../types';

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Gradient theme for banners */
  gradientTheme: GradientTheme;
  /** Use colors in output */
  useColors: boolean;
  /** Use Unicode symbols */
  useUnicode: boolean;
}

/**
 * Spinner interface
 */
export interface Spinner {
  /** Change spinner message */
  message(params: { text: string }): void;
  /** Start the spinner */
  start(): void;
  /** Stop the spinner */
  stop(params?: { finalMessage?: string }): void;
}

/**
 * Clack Theme Interface
 *
 * Single Responsibility: Provide themed CLI UI components
 * Interface Segregation: Clean API for CLI theming
 */
export interface ClackTheme {
  /**
   * Display error message
   */
  error(params: { message: string }): void;

  /**
   * Format agent response with visual styling
   */
  formatAgentResponse(params: { content: string }): string;

  /**
   * Format statistics display
   */
  formatStats(params: { avgResponseTime: number; messageCount: number }): string;

  /**
   * Format user input with visual styling
   */
  formatUserInput(params: { content: string }): string;

  /**
   * Display info message
   */
  info(params: { message: string }): void;

  /**
   * Display intro banner
   */
  intro(params: { message?: string; title: string }): void;

  /**
   * Display outro message
   */
  outro(params: { message: string }): void;

  /**
   * Create a themed spinner
   */
  spinner(params: { message: string }): Spinner;

  /**
   * Display step message
   */
  step(params: { message: string }): void;

  /**
   * Display success message
   */
  success(params: { message: string }): void;

  /**
   * Display warning message
   */
  warning(params: { message: string }): void;
}
