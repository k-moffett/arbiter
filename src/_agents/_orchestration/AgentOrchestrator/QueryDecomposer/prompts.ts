/**
 * Query Decomposer Prompts
 *
 * LLM prompts for query analysis and decomposition.
 */

/**
 * System prompt for query decomposition
 */
export const DECOMPOSITION_SYSTEM_PROMPT = `You are a query decomposition expert for a RAG system.

Your task: Break down complex queries into simpler sub-queries that can be answered independently.

Query Types:
- simple: Single concept, direct question
- complex: Multi-part, requires multiple steps
- comparative: Comparing two or more things
- list-building: Requires gathering multiple items

Decomposition Rules:
1. Each sub-query should be independently answerable
2. Identify dependencies (which sub-queries must be answered first)
3. Assign priority (1 = highest, execute first)
4. Suggest appropriate tool for each sub-query
5. Keep sub-queries simple and focused

Example 1:
Query: "Compare X and Y, then summarize"
SubQueries:
- "What is X?" (priority: 1, dependencies: [], tool: "vector_search_context")
- "What is Y?" (priority: 1, dependencies: [], tool: "vector_search_context")
- "Compare X and Y" (priority: 2, dependencies: ["What is X?", "What is Y?"], tool: "analysis")
- "Summarize comparison" (priority: 3, dependencies: ["Compare X and Y"], tool: "summarize_context")

Example 2:
Query: "What did we discuss about topic A and how does it relate to topic B?"
SubQueries:
- "What did we discuss about topic A?" (priority: 1, dependencies: [], tool: "vector_search_context")
- "What did we discuss about topic B?" (priority: 1, dependencies: [], tool: "vector_search_context")
- "How does topic A relate to topic B?" (priority: 2, dependencies: ["What did we discuss about topic A?", "What did we discuss about topic B?"], tool: "analysis")

Return JSON:
{
  "originalQuery": "the query",
  "queryType": "simple|complex|comparative|list-building",
  "complexity": 0-10,
  "subQueries": [
    {
      "query": "sub-query text",
      "priority": 1-5,
      "dependencies": ["query IDs"],
      "suggestedTool": "tool_name"
    }
  ]
}`;

/**
 * System prompt for intent analysis
 */
export const INTENT_ANALYSIS_PROMPT = `You are a query intent analyzer.

Analyze the query and determine:
1. type: temporal (references past), semantic (topic-based), factual (general knowledge), comparative, hybrid, listBuilding
2. temporalScope: If temporal, specify lastMessage, recent, session, or all_time
3. topics: Key topics mentioned (2-5 keywords)
4. requiresContext: Does it need conversation history?
5. requiresTools: Does it need tool usage?
6. confidence: How confident (0-1)

Return JSON:
{
  "type": "temporal|semantic|factual|comparative|hybrid|listBuilding",
  "temporalScope": "lastMessage|recent|session|all_time",
  "topics": ["topic1", "topic2"],
  "requiresContext": true|false,
  "requiresTools": true|false,
  "confidence": 0-1
}`;

/**
 * Build decomposition prompt
 */
export function buildDecompositionPrompt(params: { query: string }): string {
  return `${DECOMPOSITION_SYSTEM_PROMPT}

Query to decompose:
"${params.query}"

Return JSON only:`;
}

/**
 * Build intent analysis prompt
 */
export function buildIntentPrompt(params: { query: string }): string {
  return `${INTENT_ANALYSIS_PROMPT}

Query to analyze:
"${params.query}"

Return JSON only:`;
}
