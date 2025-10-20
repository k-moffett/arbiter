/**
 * ESLint Rule: no-logging-in-loops
 *
 * Prevents logging statements inside loops for performance and readability.
 * Collect data during iteration and log once outside the loop.
 *
 * @example
 * // ❌ Bad - Logging in loop
 * for (const item of items) {
 *   logger.info({ message: `Processing ${item.id}` });
 *   processItem(item);
 * }
 *
 * // ✅ Good - Collect and log once
 * const processedIds = [];
 * for (const item of items) {
 *   processItem(item);
 *   processedIds.push(item.id);
 * }
 * logger.info({ message: `Processed ${processedIds.length} items`, context: { ids: processedIds } });
 *
 * // ❌ Bad - Console.log in loop
 * while (queue.length > 0) {
 *   const task = queue.shift();
 *   console.log('Processing task:', task);
 *   process(task);
 * }
 *
 * // ✅ Good - Log summary
 * const processed = [];
 * while (queue.length > 0) {
 *   const task = queue.shift();
 *   process(task);
 *   processed.push(task);
 * }
 * console.log(`Processed ${processed.length} tasks`);
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent logging statements inside loops',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noLoggingInLoop: 'Avoid logging inside loops. Collect data and log once outside the loop for better performance.',
    },
    schema: [],
  },

  create(context) {
    const loopTypes = [
      'ForStatement',
      'ForInStatement',
      'ForOfStatement',
      'WhileStatement',
      'DoWhileStatement',
    ];

    const loopStack = [];

    // Track when we enter/exit loops
    const loopVisitor = {
      ':matches(ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement)'(node) {
        loopStack.push(node);
      },
      ':matches(ForStatement, ForInStatement, ForOfStatement, WhileStatement, DoWhileStatement):exit'() {
        loopStack.pop();
      },
    };

    // Check for logging calls
    const checkLogging = {
      // Check for logger.method() calls
      'CallExpression[callee.object.name=/logger/i][callee.property.name=/^(debug|info|warn|error|fatal|log)$/]'(node) {
        if (loopStack.length > 0) {
          context.report({
            node,
            messageId: 'noLoggingInLoop',
          });
        }
      },

      // Check for console.log/warn/error calls
      'CallExpression[callee.object.name="console"][callee.property.name=/^(log|warn|error|info|debug)$/]'(node) {
        if (loopStack.length > 0) {
          context.report({
            node,
            messageId: 'noLoggingInLoop',
          });
        }
      },
    };

    return {
      ...loopVisitor,
      ...checkLogging,
    };
  },
};
