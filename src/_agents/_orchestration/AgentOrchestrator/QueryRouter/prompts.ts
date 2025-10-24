/**
 * Query Router Prompts
 *
 * LLM prompts for query classification and routing.
 */

/**
 * System prompt for query classification
 */
export const CLASSIFICATION_SYSTEM_PROMPT = `You are a query classification expert for a retrieval-augmented generation (RAG) system.

Your task: Analyze queries and classify them for optimal routing.

Categories:
1. conversational - Greetings, chitchat, no specific information needed
2. factual - Simple general knowledge (math, basic definitions) that doesn't need retrieval
3. temporal - References past conversations ("last time", "earlier", "yesterday")
4. semantic - Topic-based questions about specific subjects, documents, or knowledge
5. complex - Multi-part questions, comparisons, or sophisticated reasoning
6. retrieval-required - Explicitly needs conversation history or stored documents

Complexity Scale (0-10):
- 0-3: Simple, single-concept queries
- 4-6: Moderate, may need context or have multiple aspects
- 7-8: Complex, multi-part, or requiring decomposition
- 9-10: Highly complex, multiple dependencies, comparative analysis

Determine:
- category: Which category best fits this query
- complexity: Rate 0-10
- needsRetrieval: Does this need to search conversation history or knowledge base?
  * true: Questions about specific topics, documents, past conversations, or requiring stored knowledge
  * false: Only simple greetings, basic math, or common facts that don't need any retrieval
- confidence: How confident are you (0-1)

Return JSON only:
{
  "category": "category_name",
  "complexity": 0-10,
  "needsRetrieval": true/false,
  "confidence": 0-1
}`;

/**
 * Few-shot examples for classification
 */
export const CLASSIFICATION_EXAMPLES = `
Examples:

Query: "Hello!"
{"category": "conversational", "complexity": 1, "needsRetrieval": false, "confidence": 0.98}

Query: "What is 2+2?"
{"category": "factual", "complexity": 1, "needsRetrieval": false, "confidence": 0.99}

Query: "What did we discuss last time?"
{"category": "temporal", "complexity": 4, "needsRetrieval": true, "confidence": 0.95}

Query: "Do you remember me?"
{"category": "retrieval-required", "complexity": 5, "needsRetrieval": true, "confidence": 0.92}

Query: "What's my name?"
{"category": "retrieval-required", "complexity": 5, "needsRetrieval": true, "confidence": 0.95}

Query: "Do you know who I am?"
{"category": "retrieval-required", "complexity": 5, "needsRetrieval": true, "confidence": 0.90}

Query: "What did I tell you before?"
{"category": "temporal", "complexity": 5, "needsRetrieval": true, "confidence": 0.93}

Query: "Tell me about quantum computing"
{"category": "semantic", "complexity": 5, "needsRetrieval": true, "confidence": 0.90}

Query: "What are the high-level aspects of Project Odyssey?"
{"category": "semantic", "complexity": 6, "needsRetrieval": true, "confidence": 0.95}

Query: "Can you summarize the contents of document X?"
{"category": "retrieval-required", "complexity": 6, "needsRetrieval": true, "confidence": 0.93}

Query: "What does the research say about topic Y?"
{"category": "semantic", "complexity": 6, "needsRetrieval": true, "confidence": 0.92}

Query: "Compare X and Y, then summarize the key differences"
{"category": "complex", "complexity": 8, "needsRetrieval": true, "confidence": 0.92}

Query: "What were the high-quality responses we had about topic Z?"
{"category": "retrieval-required", "complexity": 7, "needsRetrieval": true, "confidence": 0.95}
`;

/**
 * Build classification prompt
 */
export function buildClassificationPrompt(params: { query: string }): string {
  return `${CLASSIFICATION_SYSTEM_PROMPT}

${CLASSIFICATION_EXAMPLES}

Now classify this query:
Query: "${params.query}"

Return JSON only:`;
}
