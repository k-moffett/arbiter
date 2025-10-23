/**
 * Advanced Prompt Builder Templates
 *
 * Prompt templates for different query intents.
 */

/**
 * Base system prompt
 */
export const BASE_SYSTEM_PROMPT = `You are a helpful AI assistant with access to conversation history.

When answering:
1. ONLY use context when it's relevant to answering the user's specific query
2. For greetings and small talk, respond naturally WITHOUT citing conversation history
3. For factual queries, use context to provide accurate answers with citations [1], [2]
4. If the provided context doesn't help answer the query, respond based on your knowledge
5. Be concise and natural - don't force-fit context into your responses
6. Match your response style to the query type (brief for greetings, detailed for complex questions)`;

/**
 * Intent-specific instructions
 */
export const INTENT_INSTRUCTIONS = {
  conversational: `The user is greeting you or making small talk. Respond appropriately:
- Keep your response brief and friendly
- Match the user's energy level (casual greeting → casual response)
- Do NOT recite conversation history unless explicitly asked
- Do NOT list previous topics or citations unprompted
- Be natural and conversational, not robotic
- If you remember the user's name from context, you may use it naturally`,

  comparative: `The user is asking you to compare multiple things. Structure your response clearly:
- Highlight similarities and differences
- Use the context to support your comparison
- Organize your answer for easy understanding`,

  factual: `The user is asking for factual information. Focus on:
- Providing accurate facts from the context
- Being precise and specific
- Citing sources when possible`,

  'listBuilding': `The user is asking for a list or collection. Structure your response:
- Present items in a clear, organized format
- Use bullet points or numbering
- Ensure completeness based on available context`,

  semantic: `The user is asking a general question. Provide a helpful response:
- Use context to inform your answer
- Be conversational and clear
- Address the core question directly`,

  temporal: `The user is asking about past conversations or events. Focus on:
- Temporal accuracy (what was said when)
- Chronological ordering if relevant
- Specific references to past discussions`,

  hybrid: `The user's query involves multiple aspects. Address all parts:
- Break down complex questions
- Provide comprehensive coverage
- Organize your response logically`,
};

/**
 * Build context section with citations
 */
export function buildContextSection(params: {
  citations: Array<{ citationId: number; content: string }>;
}): string {
  if (params.citations.length === 0) {
    return 'No relevant context found.';
  }

  const contextItems = params.citations
    .map((citation) => `[${String(citation.citationId)}] ${citation.content}`)
    .join('\n\n');

  return `## Relevant Context

${contextItems}`;
}

/**
 * Build full prompt from components
 */
export function buildFullPrompt(params: {
  contextSection: string;
  intentInstructions: string;
  query: string;
  systemPrompt: string;
}): string {
  return `${params.systemPrompt}

${params.intentInstructions}

${params.contextSection}

## User Query

${params.query}

## Your Response

Provide a helpful answer to the user's query using the context provided. Reference specific context items using citation numbers [1], [2], etc. when appropriate.`;
}
