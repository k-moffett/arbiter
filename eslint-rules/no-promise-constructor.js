/**
 * ESLint Rule: no-promise-constructor
 *
 * Enforces async/await pattern over explicit Promise construction.
 * Prevents Promise.resolve(), Promise.reject(), and new Promise().
 *
 * @example
 * // ❌ Bad - Using Promise.resolve()
 * async function foo() {
 *   return Promise.resolve(42);
 * }
 *
 * // ✅ Good - Using async/await
 * async function foo() {
 *   return 42;
 * }
 *
 * // ❌ Bad - Using Promise.reject()
 * async function bar() {
 *   return Promise.reject(new Error('fail'));
 * }
 *
 * // ✅ Good - Using throw
 * async function bar() {
 *   throw new Error('fail');
 * }
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce async/await over explicit Promise construction',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noPromiseResolve: 'Use async/await instead of Promise.resolve(). Simply return the value.',
      noPromiseReject: 'Use async/await instead of Promise.reject(). Use throw instead.',
      noPromiseConstructor: 'Use async/await instead of new Promise(). Refactor to async function.',
    },
    schema: [],
  },

  create(context) {
    return {
      // Check for Promise.resolve()
      'CallExpression[callee.object.name="Promise"][callee.property.name="resolve"]'(node) {
        context.report({
          node,
          messageId: 'noPromiseResolve',
        });
      },

      // Check for Promise.reject()
      'CallExpression[callee.object.name="Promise"][callee.property.name="reject"]'(node) {
        context.report({
          node,
          messageId: 'noPromiseReject',
        });
      },

      // Check for new Promise()
      'NewExpression[callee.name="Promise"]'(node) {
        context.report({
          node,
          messageId: 'noPromiseConstructor',
        });
      },
    };
  },
};
