/**
 * ESLint Rule: max-conditions-per-statement
 *
 * Limits the number of logical operators (&&, ||) in conditional statements.
 * Encourages early returns, guard clauses, and extracted helper methods.
 *
 * @example
 * // ❌ Bad - Multiple conditions in one statement
 * if (user !== null && user.isActive && user.hasPermission('admin')) {
 *   doSomething();
 * }
 *
 * // ✅ Good - Early returns (guard clauses)
 * if (user === null) return;
 * if (!user.isActive) return;
 * if (!user.hasPermission('admin')) return;
 * doSomething();
 *
 * // ✅ Good - Extract to method
 * if (isValidAdmin(user)) {
 *   doSomething();
 * }
 *
 * function isValidAdmin(user) {
 *   if (user === null) return false;
 *   if (!user.isActive) return false;
 *   return user.hasPermission('admin');
 * }
 *
 * // ❌ Bad - Complex OR conditions
 * if (status === 'pending' || status === 'processing' || status === 'queued') {
 *   handleStatus();
 * }
 *
 * // ✅ Good - Use Set/Array
 * const activeStatuses = new Set(['pending', 'processing', 'queued']);
 * if (activeStatuses.has(status)) {
 *   handleStatus();
 * }
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Limit logical operators per conditional statement',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      tooManyConditions: 'Too many conditions ({{count}} operators). Max allowed: {{max}}. Use early returns, extract methods, or simplify logic.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: {
            type: 'integer',
            minimum: 0,
            default: 1,
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const maxConditions = options.max ?? 1;

    /**
     * Count logical operators (&&, ||) in an expression
     */
    function countLogicalOperators(node) {
      if (!node) return 0;

      if (node.type === 'LogicalExpression') {
        // Count this operator plus any in child expressions
        return 1 + countLogicalOperators(node.left) + countLogicalOperators(node.right);
      }

      return 0;
    }

    return {
      // Check if statements
      IfStatement(node) {
        const count = countLogicalOperators(node.test);
        if (count > maxConditions) {
          context.report({
            node: node.test,
            messageId: 'tooManyConditions',
            data: {
              count,
              max: maxConditions,
            },
          });
        }
      },

      // Check conditional (ternary) expressions
      ConditionalExpression(node) {
        const count = countLogicalOperators(node.test);
        if (count > maxConditions) {
          context.report({
            node: node.test,
            messageId: 'tooManyConditions',
            data: {
              count,
              max: maxConditions,
            },
          });
        }
      },

      // Check while loops
      WhileStatement(node) {
        const count = countLogicalOperators(node.test);
        if (count > maxConditions) {
          context.report({
            node: node.test,
            messageId: 'tooManyConditions',
            data: {
              count,
              max: maxConditions,
            },
          });
        }
      },

      // Check do-while loops
      DoWhileStatement(node) {
        const count = countLogicalOperators(node.test);
        if (count > maxConditions) {
          context.report({
            node: node.test,
            messageId: 'tooManyConditions',
            data: {
              count,
              max: maxConditions,
            },
          });
        }
      },
    };
  },
};
