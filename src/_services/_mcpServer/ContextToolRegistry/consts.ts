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
];
