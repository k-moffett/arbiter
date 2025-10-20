/**
 * ESLint Custom Rule: max-class-properties
 *
 * Enforces a maximum number of properties (fields) in a class to encourage
 * composition and adherence to Single Responsibility Principle.
 *
 * @fileoverview Limits the number of class properties
 * @author Arbiter Team
 * @type {import('eslint').Rule.RuleModule}
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of properties in a class',
      category: 'Best Practices',
      recommended: false,
    },
    messages: {
      tooManyProperties:
        'Class has {{count}} properties. Maximum allowed is {{max}}.',
    },
    schema: [
      {
        type: 'integer',
        minimum: 1,
      },
    ],
  },

  create(context) {
    const maxProperties = context.options[0] || 15; // Default: 15 properties

    /**
     * Count properties in a class body
     * @param {ASTNode} node - The class node
     * @returns {number} Number of properties
     */
    function countProperties(node) {
      if (!node.body || !node.body.body) {
        return 0;
      }

      // Count PropertyDefinition nodes (class fields)
      return node.body.body.filter((member) => {
        return member.type === 'PropertyDefinition';
      }).length;
    }

    /**
     * Check if class exceeds property limit
     * @param {ASTNode} node - The class node
     */
    function checkClass(node) {
      const propertyCount = countProperties(node);

      if (propertyCount > maxProperties) {
        context.report({
          node,
          messageId: 'tooManyProperties',
          data: {
            count: propertyCount,
            max: maxProperties,
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
