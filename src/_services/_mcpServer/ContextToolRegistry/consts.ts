/**
 * Context Tool Registry Constants
 *
 * Tool definitions for MCP context tools.
 */

import type { ContextToolDefinition } from './interfaces';

/**
 * All context tools available via MCP
 */
export const CONTEXT_TOOLS: ContextToolDefinition[] = [
  {
    description: 'Store message embedding in Qdrant conversation-history collection',
    inputSchema: {
      properties: {
        agentType: { type: 'string' },
        containerInstanceId: { type: 'string' },
        messageId: { type: 'string' },
        parentRequestId: { type: 'string' },
        payload: {
          properties: {
            agentType: { type: 'string' },
            channelId: { type: 'string' },
            containerInstanceId: { type: 'string' },
            content: { type: 'string' },
            embeddedText: { type: 'string' },
            intentCategory: { type: 'string' },
            processingTimeMs: { type: 'number' },
            role: { enum: ['user', 'bot'], type: 'string' },
            sessionId: { type: 'string' },
            tags: { items: { type: 'string' }, type: 'array' },
            timestamp: { type: 'number' },
            userId: { type: 'string' },
            userFeedback: { enum: ['success', 'failure', 'neutral'], type: 'string' },
          },
          required: [
            'agentType',
            'channelId',
            'containerInstanceId',
            'content',
            'embeddedText',
            'role',
            'sessionId',
            'tags',
            'timestamp',
            'userId',
          ],
          type: 'object',
        },
        requestId: { type: 'string' },
        rootRequestId: { type: 'string' },
        vector: { items: { type: 'number' }, type: 'array' },
      },
      required: ['messageId', 'requestId', 'rootRequestId', 'vector', 'payload'],
      type: 'object',
    },
    name: 'vector_upsert_context',
  },
  {
    description: 'Semantic search in conversation history with filtering',
    inputSchema: {
      properties: {
        filters: {
          properties: {
            agentType: { type: 'string' },
            excludeRequestId: { type: 'string' },
            excludeTags: { items: { type: 'string' }, type: 'array' },
            requestId: { type: 'string' },
            sessionId: { type: 'string' },
            tags: { items: { type: 'string' }, type: 'array' },
            userFeedback: { enum: ['success', 'failure'], type: 'string' },
          },
          type: 'object'},
        limit: { type: 'number' },
        query: { type: 'string' },
        queryVector: { items: { type: 'number' }, type: 'array' },
        userId: { type: 'string' },
      },
      required: ['queryVector', 'userId'],
      type: 'object',
    },
    name: 'vector_search_context',
  },
  {
    description: 'Retrieve all messages for a specific request chain',
    inputSchema: {
      properties: {
        includeParent: { type: 'boolean' },
        includeSidechains: { type: 'boolean' },
        requestId: { type: 'string' },
      },
      required: ['requestId', 'includeParent', 'includeSidechains'],
      type: 'object',
    },
    name: 'get_request_context',
  },
  {
    description: 'Discover available Qdrant collections with metadata (point count, dimensions, description, tags)',
    inputSchema: {
      properties: {
        includeMetadata: {
          description: 'Include detailed metadata (point count, dimensions, description, tags). Default: false',
          type: 'boolean',
        },
      },
      type: 'object',
    },
    name: 'list_collections',
  },
  {
    description: 'Execute semantic search in specific Qdrant collection (use list_collections first to discover available collections)',
    inputSchema: {
      properties: {
        collectionName: {
          description: 'Target collection name (e.g., "project-odyssey")',
          type: 'string',
        },
        filters: {
          description: 'Metadata filters as key-value pairs',
          type: 'object',
        },
        limit: {
          description: 'Maximum number of results (default: 10)',
          type: 'number',
        },
        queryVector: {
          description: '768-dimensional embedding vector for semantic search',
          items: { type: 'number' },
          type: 'array',
        },
        scoreThreshold: {
          description: 'Minimum similarity score threshold (0-1)',
          type: 'number',
        },
      },
      required: ['collectionName', 'queryVector'],
      type: 'object',
    },
    name: 'search_in_collection',
  },
];
