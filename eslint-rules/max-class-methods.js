/**
 * ESLint Custom Rule: max-class-methods
 *
 * Enforces a maximum number of public methods in a class to encourage
 * Interface Segregation Principle and prevent god classes.
 *
 * @fileoverview Limits the number of public methods in a class
 * @author Arbiter Team
 * @type {import('eslint').Rule.RuleModule}
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of public methods in a class',
      category: 'Best Practices',
      recommended: false,
    },
    messages: {
      tooManyMethods:
        'Class has {{count}} public methods. Maximum allowed is {{max}}.',
    },
    schema: [
      {
        type: 'integer',
        minimum: 1,
      },
    ],
  },

  create(context) {
    const maxMethods = context.options[0] || 15; // Default: 15 methods

    /**
     * Count public methods in a class body
     * @param {ASTNode} node - The class node
     * @returns {number} Number of public methods
     */
    function countPublicMethods(node) {
      if (!node.body || !node.body.body) {
        return 0;
      }

      // Count MethodDefinition nodes that are not private
      return node.body.body.filter((member) => {
        if (member.type !== 'MethodDefinition') {
          return false;
        }

        // Exclude constructors
        if (member.kind === 'constructor') {
          return false;
        }

        // Exclude private methods (those with # prefix or private keyword)
        if (member.key && member.key.type === 'PrivateIdentifier') {
          return false;
        }

        // Exclude methods with accessibility set to 'private' or 'protected'
        // (TypeScript AST extension)
        if (
          member.accessibility === 'private' ||
          member.accessibility === 'protected'
        ) {
          return false;
        }

        return true;
      }).length;
    }

    /**
     * Check if class exceeds public method limit
     * @param {ASTNode} node - The class node
     */
    function checkClass(node) {
      const methodCount = countPublicMethods(node);

      if (methodCount > maxMethods) {
        context.report({
          node,
          messageId: 'tooManyMethods',
          data: {
            count: methodCount,
            max: maxMethods,
          },
        });
      }
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    };
  },
};
