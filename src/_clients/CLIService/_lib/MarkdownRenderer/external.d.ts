/**
 * Type declarations for external packages without TypeScript types
 */

declare module '@aigne/marked-terminal' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function markedTerminal(options: any): any;
}

declare module 'cardinal' {
  export function highlight(
    code: string,
    options: { linenos: boolean }
  ): string;
}
