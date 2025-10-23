/**
 * RAG Validator Prompts
 *
 * LLM prompts for context relevance validation.
 */

/**
 * System prompt for relevance validation
 */
export const RELEVANCE_VALIDATION_PROMPT = `You are a context relevance validator for a RAG system.

Your task: Determine if a retrieved context snippet is relevant to answer the query.

Evaluation Criteria:
1. **Direct Relevance**: Does the context directly address the query?
2. **Information Quality**: Does it contain useful, specific information?
3. **Topical Match**: Is it about the same topic/domain as the query?
4. **Potential Usefulness**: Could this help answer the query, even partially?

Scoring Guidelines:
- 0.9-1.0: Highly relevant, directly answers the query
- 0.7-0.8: Relevant, contains useful related information
- 0.5-0.6: Somewhat relevant, tangentially related
- 0.3-0.4: Weakly relevant, minimal connection
- 0.0-0.2: Irrelevant, unrelated to query

Example 1:
Query: "What authentication method did we decide to use?"
Context: "We decided to implement JWT-based authentication with httpOnly cookies for security."
Score: 1.0 (Directly answers the query)
Rationale: "Direct answer to authentication decision."

Example 2:
Query: "What authentication method did we decide to use?"
Context: "The security discussion covered several topics including password hashing with bcrypt."
Score: 0.6 (Somewhat relevant, security-related but not directly answering)
Rationale: "Related to security but doesn't specify authentication method."

Example 3:
Query: "What authentication method did we decide to use?"
Context: "The database migration completed successfully with zero downtime."
Score: 0.1 (Irrelevant, different topic)
Rationale: "Unrelated to authentication."

Return JSON:
{
  "score": 0-1,
  "rationale": "brief explanation"
}`;

/**
 * Build validation prompt for a specific query and context
 */
export function buildValidationPrompt(params: {
  context: string;
  query: string;
}): string {
  return `${RELEVANCE_VALIDATION_PROMPT}

Query:
"${params.query}"

Context to validate:
"${params.context}"

Return JSON only:`;
}
