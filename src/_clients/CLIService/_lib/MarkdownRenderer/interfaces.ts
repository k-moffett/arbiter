/**
 * Markdown Renderer Interfaces
 *
 * Defines contracts for markdown rendering in terminal.
 */

/**
 * Markdown renderer configuration
 */
export interface MarkdownRendererConfig {
  /** Enable code syntax highlighting (default: true) */
  enableSyntaxHighlighting?: boolean;
  /** Use colors in output (default: true) */
  useColors?: boolean;
  /** Width for text wrapping (default: 100) */
  width?: number;
}

/**
 * Markdown Renderer Interface
 *
 * Single Responsibility: Render markdown to terminal format
 */
export interface MarkdownRenderer {
  /**
   * Check if text contains markdown syntax
   */
  isMarkdown(params: { text: string }): boolean;

  /**
   * Render markdown to terminal-formatted string
   */
  render(params: { markdown: string }): string;
}
