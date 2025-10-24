/**
 * Collection Selector Prompts
 *
 * LLM prompts for intelligent collection selection.
 */

import type { CollectionInfo } from '../../../../_services/_mcpServer/ContextToolRegistry';

/**
 * System prompt for collection selection
 */
export const COLLECTION_SELECTION_SYSTEM_PROMPT = `You are a collection selection expert for a retrieval-augmented generation (RAG) system.

Your task: Analyze user queries and available Qdrant collections to determine which collections should be searched.

Guidelines:
1. **Always include conversation-history** - Contains past interactions and context
2. **Analyze collection metadata** - Use name, description, tags, and point count
3. **Match query semantics** - Look for topic overlap between query and collections
4. **Consider multiple collections** - Queries may span multiple knowledge domains
5. **Provide confidence scores** - Rate 0-1 how confident you are in each selection
6. **Explain reasoning** - Justify why each collection is relevant

Collection Metadata Fields:
- name: Collection identifier (e.g., "warhammer-40k_rules", "project-odyssey")
- description: Manual description of collection contents
- tags: Topic tags for categorization
- pointCount: Number of documents in collection
- vectorDimensions: Embedding dimensions (usually 768)
- distance: Distance metric (Cosine, Euclid, Dot)
- status: Collection health status

Return JSON only:
{
  "confidence": 0-1,
  "selections": [
    {
      "collection": "collection-name",
      "confidence": 0-1,
      "reasoning": "Why this collection is relevant"
    }
  ]
}`;

/**
 * Few-shot examples for collection selection
 */
export const COLLECTION_SELECTION_EXAMPLES = `
Examples:

Query: "What did we discuss last time?"
Available: [{"name": "conversation-history", "pointCount": 150, "tags": ["chat"]}]
{
  "confidence": 0.95,
  "selections": [
    {
      "collection": "conversation-history",
      "confidence": 0.98,
      "reasoning": "Query explicitly references past conversation"
    }
  ]
}

Query: "Tell me about Project Odyssey's architecture"
Available: [
  {"name": "conversation-history", "pointCount": 150, "tags": ["chat"]},
  {"name": "project-odyssey", "description": "Project Odyssey documentation", "pointCount": 392, "tags": ["docs", "project"]}
]
{
  "confidence": 0.92,
  "selections": [
    {
      "collection": "conversation-history",
      "confidence": 0.85,
      "reasoning": "May contain previous discussions about Project Odyssey"
    },
    {
      "collection": "project-odyssey",
      "confidence": 0.95,
      "reasoning": "Directly matches query topic - contains Project Odyssey documentation"
    }
  ]
}

Query: "What are the rules for Feel No Pain in Warhammer 40k?"
Available: [
  {"name": "conversation-history", "pointCount": 150, "tags": ["chat"]},
  {"name": "warhammer-40k_rules", "description": "Warhammer 40,000 game rules", "pointCount": 5847, "tags": ["warhammer", "rules", "games"]},
  {"name": "project-odyssey", "pointCount": 392, "tags": ["docs"]}
]
{
  "confidence": 0.96,
  "selections": [
    {
      "collection": "conversation-history",
      "confidence": 0.70,
      "reasoning": "May contain past Warhammer discussions"
    },
    {
      "collection": "warhammer-40k_rules",
      "confidence": 0.98,
      "reasoning": "Exact topic match - contains Warhammer 40k rules including Feel No Pain"
    }
  ]
}

Query: "Hello!"
Available: [
  {"name": "conversation-history", "pointCount": 150, "tags": ["chat"]},
  {"name": "warhammer-40k_rules", "pointCount": 5847, "tags": ["warhammer", "rules"]}
]
{
  "confidence": 0.90,
  "selections": [
    {
      "collection": "conversation-history",
      "confidence": 0.88,
      "reasoning": "Greeting may reference past conversation context"
    }
  ]
}`;

/**
 * Build collection selection prompt
 */
export function buildCollectionSelectionPrompt(params: {
  collections: CollectionInfo[];
  query: string;
}): string {
  // Format collections as JSON for LLM
  const collectionsJson = params.collections.map((c) => ({
    description: c.description,
    distance: c.distance,
    name: c.name,
    pointCount: c.pointCount,
    status: c.status,
    tags: c.tags,
    vectorDimensions: c.vectorDimensions,
  }));

  return `${COLLECTION_SELECTION_SYSTEM_PROMPT}

${COLLECTION_SELECTION_EXAMPLES}

Now select collections for this query:

Query: "${params.query}"

Available Collections:
${JSON.stringify(collectionsJson, null, 2)}

Return JSON only:`;
}
