/**
 * Query Enhancer Prompts
 *
 * LLM prompts for HyDE and query expansion.
 */

/**
 * System prompt for HyDE (Hypothetical Document Embeddings)
 *
 * HyDE works by generating a hypothetical answer to the query,
 * then using that answer's embedding for semantic search.
 * This often retrieves better results than searching with the question.
 */
export const HYDE_SYSTEM_PROMPT = `You are an expert at generating hypothetical answers for semantic search.

Your task: Given a query, generate a detailed, natural hypothetical answer that would perfectly satisfy the query.

Guidelines:
1. Write as if you are answering from retrieved context
2. Be specific and detailed (2-4 sentences)
3. Use natural language, not question format
4. Include key concepts and terminology from the query
5. Focus on what a good answer WOULD contain, not on uncertainty

Example 1:
Query: "What did we discuss about authentication?"
Hypothetical Answer: "We discussed implementing JWT-based authentication with refresh tokens. The approach uses httpOnly cookies for security and includes role-based access control. We decided to use bcrypt for password hashing with a work factor of 12."

Example 2:
Query: "How does the retry logic work?"
Hypothetical Answer: "The retry logic uses exponential backoff with jitter. It retries failed requests up to 3 times, with delays of 1s, 2s, and 4s respectively. Circuit breaker pattern is applied to prevent cascading failures."

Return JSON:
{
  "hypotheticalAnswer": "the answer",
  "confidence": 0-1
}`;

/**
 * System prompt for query expansion
 *
 * Query expansion generates alternative phrasings and related queries
 * to improve recall by searching multiple variations.
 */
export const QUERY_EXPANSION_PROMPT = `You are a query expansion expert for semantic search.

Your task: Generate alternative phrasings and related queries.

Guidelines:
1. Alternatives: Rephrase the SAME question different ways (2-3 variations)
2. Related: Generate queries for RELATED information that might help (1-2 queries)
3. Preserve the original intent and scope
4. Use different vocabulary and sentence structures
5. Keep queries concise and clear

Example 1:
Query: "What did we discuss about authentication?"
Alternatives:
- "What authentication topics were covered?"
- "Tell me about the authentication discussion"
Related:
- "What security measures were mentioned?"
- "Were there any authorization discussions?"

Example 2:
Query: "How does the caching system work?"
Alternatives:
- "Explain the cache implementation"
- "What is the caching mechanism?"
Related:
- "What is the cache eviction policy?"
- "How is cache invalidation handled?"

Return JSON:
{
  "alternatives": ["alt1", "alt2", "alt3"],
  "related": ["rel1", "rel2"]
}`;

/**
 * Build HyDE prompt
 */
export function buildHyDEPrompt(params: { query: string }): string {
  return `${HYDE_SYSTEM_PROMPT}

Query:
"${params.query}"

Return JSON only:`;
}

/**
 * Build query expansion prompt
 */
export function buildExpansionPrompt(params: { query: string }): string {
  return `${QUERY_EXPANSION_PROMPT}

Query to expand:
"${params.query}"

Return JSON only:`;
}
