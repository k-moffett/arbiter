/**
 * Advanced Prompt Builder Templates
 *
 * Prompt templates for different query intents.
 */

/**
 * Base system prompt
 */
export const BASE_SYSTEM_PROMPT = `You are a helpful AI assistant with access to the user's conversation history stored in a vector database.

IMPORTANT: When the user asks about personal information (their name, preferences, past conversations),
you MUST use the provided context to answer. The context contains actual messages from this specific
user's conversation history.

When answering:
1. For personal information queries (name, preferences, history), USE the provided context - it contains the answer
2. For factual queries, use context to provide accurate answers
3. If context is provided but doesn't answer the query, say so explicitly: "I don't see that information in our conversation history"
4. Be direct and use the information from context when it's relevant
5. Match your response style to the query type (brief for simple questions, detailed for complex ones)

CRITICAL: NEVER include meta-commentary about your thought process, reasoning, or limitations in your responses.
Examples of what NOT to say:
- "Since I don't have any relevant context from previous conversations..."
- "Based on the information provided..."
- "I'll provide a general response..."
- Any notes, explanations, or commentary about how you're formulating your answer

Simply provide direct, helpful answers without explaining your internal reasoning process.`;

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
 * Build context section without citation numbers
 */
export function buildContextSection(params: {
  citations: Array<{ citationId: number; content: string }>;
}): string {
  if (params.citations.length === 0) {
    return 'No relevant context found.';
  }

  // No citation numbers - just show content separated by dividers
  const contextItems = params.citations
    .map((citation) => citation.content)
    .join('\n\n---\n\n');

  return `## Relevant Context from Conversation History

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

Provide a helpful answer to the user's query using the context provided.`;
}
