/**
 * ESLint Rule: prefer-null-over-undefined
 *
 * Enforces returning null instead of undefined for explicit absence of value.
 *
 * Rationale:
 * - null is more explicit and intentional
 * - undefined is ambiguous (intentional vs missing)
 * - null clearly communicates "no value" to callers
 * - More readable and direct
 *
 * ✅ CORRECT:
 *   function getUser(id: string): User | null {
 *     return cache.get(id) ?? null;
 *   }
 *
 * ❌ WRONG:
 *   function getUser(id: string): User | undefined {
 *     return cache.get(id) ?? undefined;
 *   }
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prefer null over undefined in return statements and type annotations',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      returnUndefined: 'Return null instead of undefined for explicit absence of value',
      typeUndefined: 'Use null instead of undefined in return type annotations',
    },
    schema: [],
  },

  create(context) {
    /**
     * Check if node is undefined identifier or undefined keyword
     */
    function isUndefined(node) {
      return (
        (node.type === 'Identifier' && node.name === 'undefined') ||
        node.type === 'TSUndefinedKeyword'
      );
    }

    /**
     * Check if return type includes undefined
     */
    function checkReturnType(node) {
      if (!node.returnType) {
        return;
      }

      const typeAnnotation = node.returnType.typeAnnotation;

      // Check for TSUndefinedKeyword in return type
      if (typeAnnotation.type === 'TSUndefinedKeyword') {
        context.report({
          node: typeAnnotation,
          messageId: 'typeUndefined',
        });
        return;
      }

      // Check union types for undefined
      if (typeAnnotation.type === 'TSUnionType') {
        typeAnnotation.types.forEach((type) => {
          if (type.type === 'TSUndefinedKeyword') {
            context.report({
              node: type,
              messageId: 'typeUndefined',
            });
          }
        });
      }
    }

    return {
      // Check return statements
      ReturnStatement(node) {
        if (node.argument && isUndefined(node.argument)) {
          context.report({
            node: node.argument,
            messageId: 'returnUndefined',
          });
        }
      },

      // Check function return types
      FunctionDeclaration(node) {
        checkReturnType(node);
      },

      ArrowFunctionExpression(node) {
        checkReturnType(node);
      },

      FunctionExpression(node) {
        checkReturnType(node);
      },

      MethodDefinition(node) {
        if (node.value) {
          checkReturnType(node.value);
        }
      },

      TSMethodSignature(node) {
        checkReturnType(node);
      },
    };
  },
};
