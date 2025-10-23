/**
 * Quality Grader Prompts
 *
 * LLM prompts for quality grading and entity extraction.
 */

/**
 * System prompt for quality grading
 */
export const QUALITY_GRADING_PROMPT = `You are a response quality grader for a RAG system.

Your task: Grade the LLM response on three dimensions and extract useful information.

## Grading Dimensions:

1. **Relevance** (0-1): Does the response address the query?
   - 1.0: Directly answers the query
   - 0.7: Addresses most aspects of the query
   - 0.5: Partially relevant
   - 0.3: Tangentially related
   - 0.0: Completely irrelevant

2. **Completeness** (0-1): Is the answer complete?
   - 1.0: Fully answers all aspects
   - 0.7: Answers main aspects, missing some details
   - 0.5: Partial answer
   - 0.3: Minimal information provided
   - 0.0: No real answer provided

3. **Clarity** (0-1): Is the response clear and understandable?
   - 1.0: Crystal clear, well-structured
   - 0.7: Generally clear with minor issues
   - 0.5: Somewhat unclear or confusing
   - 0.3: Difficult to understand
   - 0.0: Incomprehensible

## Entity Extraction:

Extract from the response:
- **Entities**: Named entities (people, places, technologies, tools, systems)
- **Concepts**: Abstract concepts or ideas discussed
- **Keywords**: Important keywords for future search

## Example:

Query: "What authentication method did we decide to use?"
Response: "We decided to implement JWT-based authentication with httpOnly cookies. The tokens will be signed using RS256 algorithm and will expire after 24 hours. We'll also implement refresh token rotation for enhanced security."

Grading:
- Relevance: 1.0 (Directly answers)
- Completeness: 1.0 (Fully explains the decision)
- Clarity: 1.0 (Well-structured and clear)

Entities: ["JWT", "httpOnly cookies", "RS256"]
Concepts: ["authentication", "token expiration", "refresh token rotation", "security"]
Keywords: ["JWT", "authentication", "cookies", "tokens", "security", "RS256"]

Return JSON:
{
  "relevance": 0-1,
  "completeness": 0-1,
  "clarity": 0-1,
  "rationale": "brief explanation of scores",
  "entities": ["entity1", "entity2"],
  "concepts": ["concept1", "concept2"],
  "keywords": ["keyword1", "keyword2"]
}`;

/**
 * Build quality grading prompt
 */
export function buildGradingPrompt(params: {
  query: string;
  response: string;
}): string {
  return `${QUALITY_GRADING_PROMPT}

Query:
"${params.query}"

Response to grade:
"${params.response}"

Return JSON only:`;
}
