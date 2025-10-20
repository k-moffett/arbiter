/**
 * ESLint Rule: no-switch-statement
 *
 * Prevents switch statements in favor of object literals or maps.
 * Switch statements can be refactored to more maintainable object-based dispatch.
 *
 * @example
 * // ❌ Bad - Using switch statement
 * function getColor(status) {
 *   switch (status) {
 *     case 'error': return 'red';
 *     case 'warning': return 'yellow';
 *     case 'success': return 'green';
 *     default: return 'gray';
 *   }
 * }
 *
 * // ✅ Good - Using object literal
 * function getColor(status) {
 *   const colors = {
 *     error: 'red',
 *     warning: 'yellow',
 *     success: 'green',
 *   };
 *   return colors[status] ?? 'gray';
 * }
 *
 * // ✅ Good - Using Map for complex logic
 * const handlers = new Map([
 *   ['create', (data) => createHandler(data)],
 *   ['update', (data) => updateHandler(data)],
 *   ['delete', (data) => deleteHandler(data)],
 * ]);
 *
 * function dispatch(action, data) {
 *   const handler = handlers.get(action);
 *   if (!handler) throw new Error(`Unknown action: ${action}`);
 *   return handler(data);
 * }
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent switch statements in favor of object literals or maps',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noSwitch: 'Avoid switch statements. Use object literals or Map for cleaner dispatch logic.',
    },
    schema: [],
  },

  create(context) {
    return {
      SwitchStatement(node) {
        context.report({
          node,
          messageId: 'noSwitch',
        });
      },
    };
  },
};
