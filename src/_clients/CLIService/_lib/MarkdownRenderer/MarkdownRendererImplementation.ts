/**
 * Markdown Renderer Implementation
 *
 * Renders markdown content beautifully in the terminal using marked and marked-terminal.
 * Supports code blocks with syntax highlighting, tables, lists, and headers.
 *
 * Single Responsibility: Convert markdown to terminal-formatted output
 * Open/Closed: Extendable through configuration, closed for modification
 */

import type { MarkdownRenderer, MarkdownRendererConfig } from './interfaces';
import type { MarkedExtension } from 'marked';

import { markedTerminal } from '@aigne/marked-terminal';
import cardinal from 'cardinal';
import { Marked } from 'marked';
import pc from 'picocolors';

/**
 * Markdown Renderer Implementation
 *
 * @example
 * ```typescript
 * const renderer = new MarkdownRendererImplementation({ width: 120 });
 * const formatted = renderer.render({ markdown: '# Title\n\nSome **bold** text' });
 * console.log(formatted);
 * ```
 */
export class MarkdownRendererImplementation implements MarkdownRenderer {
  private readonly config: Required<MarkdownRendererConfig>;
  private readonly marked: Marked;

  constructor(params: { config: MarkdownRendererConfig }) {
    this.config = {
      enableSyntaxHighlighting: params.config.enableSyntaxHighlighting ?? true,
      useColors: params.config.useColors ?? true,
      width: params.config.width ?? 100,
    };

    // Initialize marked with terminal renderer
    this.marked = new Marked();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- External library with limited types
    const terminalExtension = markedTerminal({
      // eslint-disable-next-line local-rules/require-typed-params -- External library callback signature
      blockquote: (text: string) =>
        this.config.useColors ? pc.dim(pc.gray('│ ' + text)) : '| ' + text,
       
      code: this.renderCodeBlock.bind(this),
      // eslint-disable-next-line local-rules/require-typed-params -- External library callback signature
      codespan: (code: string) => (this.config.useColors ? pc.cyan(code) : code),
      // eslint-disable-next-line local-rules/require-typed-params -- External library callback signature
      em: (text: string) => (this.config.useColors ? pc.italic(text) : text),
      // eslint-disable-next-line local-rules/require-typed-params -- External library callback signature
      strong: (text: string) => (this.config.useColors ? pc.bold(text) : text),
      width: this.config.width,
    });

    this.marked.use(terminalExtension as MarkedExtension);
  }

  /**
   * Check if text contains markdown syntax
   */
  public isMarkdown(params: { text: string }): boolean {
    // Check for common markdown patterns
    const markdownPatterns = [
      /^#{1,6}\s/, // Headers
      /\*\*.*?\*\*/, // Bold
      /\*.*?\*/, // Italic
      /```[\s\S]*?```/, // Code blocks
      /`.*?`/, // Inline code
      /^\s*[-*+]\s/, // Unordered lists
      /^\s*\d+\.\s/, // Ordered lists
      /\[.*?\]\(.*?\)/, // Links
      /^\s*>\s/, // Blockquotes
      /\|.*?\|/, // Tables
    ];

    return markdownPatterns.some((pattern) => pattern.test(params.text));
  }

  /**
   * Render markdown to terminal-formatted string
   */
  public render(params: { markdown: string }): string {
    try {
      const rendered = this.marked.parse(params.markdown) as string;
      return rendered.trim();
    } catch {
      // Fallback to plain text if markdown rendering fails
      return params.markdown;
    }
  }

  /**
   * Format plain code block without syntax highlighting
   */
  private formatPlainCodeBlock(params: { code: string; language?: string }): string {
    const header = params.language !== undefined ? pc.dim(`[${params.language}]`) : '';
    const formattedCode = this.config.useColors ? pc.gray(params.code) : params.code;

    const codeBlock = header + '\n' + formattedCode;
    return params.language !== undefined
      ? this.wrapCodeBlock({ code: codeBlock, language: params.language })
      : this.wrapCodeBlock({ code: codeBlock });
  }

  /**
   * Check if language is JavaScript or TypeScript
   */
  private isJavaScriptOrTypeScript(params: { language?: string }): boolean {
    if (params.language === undefined) {
      return false;
    }
    const jsLangs = ['javascript', 'js', 'typescript', 'ts'];
    return jsLangs.includes(params.language);
  }

  /**
   * Render code block with optional syntax highlighting
   */
  private renderCodeBlock(params: { code: string; language?: string }): string {
    if (!this.config.enableSyntaxHighlighting) {
      return this.formatPlainCodeBlock(params);
    }

    if (!this.config.useColors) {
      return this.formatPlainCodeBlock(params);
    }

    try {
      // Try to highlight JavaScript/TypeScript code
      const langParam = params.language !== undefined ? { language: params.language } : {};
      const isJsTs = this.isJavaScriptOrTypeScript(langParam);
      if (isJsTs) {
        const highlighted = cardinal.highlight(params.code, { linenos: false });
        const wrapParams =
          params.language !== undefined
            ? { code: highlighted, language: params.language }
            : { code: highlighted };
        return this.wrapCodeBlock(wrapParams);
      }

      // For other languages, return without highlighting
      return this.formatPlainCodeBlock(params);
    } catch {
      // Fallback to plain code block if highlighting fails
      return this.formatPlainCodeBlock(params);
    }
  }

  /**
   * Wrap code block with visual borders
   */
  private wrapCodeBlock(params: { code: string; language?: string }): string {
    const border = this.config.useColors
      ? pc.dim('─'.repeat(this.config.width - 4))
      : '-'.repeat(this.config.width - 4);
    const lines = params.code.split('\n').map((line) => '  ' + line);

    return '\n' + border + '\n' + lines.join('\n') + '\n' + border + '\n';
  }
}
