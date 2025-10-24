#!/usr/bin/env tsx

/**
 * Semantic Search Test Script
 *
 * Tests the integrity of embeddings by performing semantic searches
 */

/* eslint-disable no-console -- CLI script requires console output */

import { OllamaEmbeddingService } from '../../OllamaEmbeddingService/index.js';

interface SearchResult {
  id: string;
  payload: {
    chunkIndex: number;
    content: string;
    relationship?: string;
  };
  score: number;
}

/**
 * Perform semantic search
 */
async function searchCollection(params: {
  collectionName: string;
  limit?: number;
  query: string;
}): Promise<SearchResult[]> {
  const { collectionName, query, limit = 3 } = params;

  console.log(`\n🔍 Searching for: "${query}"`);

  // Generate embedding for query
  const embeddingService = new OllamaEmbeddingService();
  const result = await embeddingService.generateEmbedding({
    text: query,
  });

  // Search Qdrant
  const qdrantUrl = 'http://localhost:6333';
  const response = await fetch(`${qdrantUrl}/collections/${collectionName}/points/search`, {
    method: 'POST',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Qdrant API requires this format
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vector: result.embedding,
      limit,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- Qdrant API requires snake_case
      with_payload: true,
    }),
  });

  const data = await response.json() as { result: SearchResult[] };
  return data.result;
}

/**
 * Display search results
 */
function displayResults(params: { results: SearchResult[] }): void {
  const { results } = params;

  const output: string[] = [];

  for (const [index, result] of results.entries()) {
    const position =
      result.payload.relationship !== undefined
        ? (JSON.parse(result.payload.relationship) as { position?: string }).position ?? 'N/A'
        : 'N/A';

    output.push(`\n📄 Result ${String(index + 1)} (Score: ${result.score.toFixed(4)})`);
    output.push(`   Chunk: ${String(result.payload.chunkIndex + 1)}`);
    output.push(`   Position: ${position}`);
    output.push(`   Content: ${result.payload.content.substring(0, 200)}...`);
  }

  console.log(output.join('\n'));
}

/**
 * Main test function
 */
async function main(): Promise<void> {
  const output: string[] = [];

  output.push('🧪 Semantic Search Integrity Test\n');
  output.push('Testing collection: project-odyssey');
  output.push('='.repeat(60));

  const queries = [
    'security and data protection policies',
    'project management and planning',
    'compliance and regulatory requirements',
    'risk assessment and mitigation strategies',
    'technical architecture and system design',
  ];

  for (const query of queries) {
    const results = await searchCollection({
      collectionName: 'project-odyssey',
      query,
      limit: 3,
    });

    displayResults({ results });
    output.push('\n' + '-'.repeat(60));
  }

  output.push('\n✅ Semantic search integrity test complete!\n');

  console.log(output.join('\n'));
}

void main();
