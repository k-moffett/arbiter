/**
 * ESLint Rule: no-bracket-notation
 *
 * Prevents bracket notation with literal strings in favor of dot notation or optional chaining.
 * Bracket notation should only be used for computed/dynamic property access.
 *
 * @example
 * // ❌ Bad - Bracket notation with string literals
 * const value = obj['property'];
 * obj['name'] = 'John';
 * const result = data['items'][0];
 *
 * // ✅ Good - Dot notation
 * const value = obj.property;
 * obj.name = 'John';
 * const result = data.items[0];
 *
 * // ✅ Good - Optional chaining for safety
 * const value = obj?.property;
 * const nested = obj?.items?.[0];
 *
 * // ✅ Good - Dynamic/computed property access (allowed)
 * const value = obj[propertyName];
 * const key = 'dynamicKey';
 * const result = data[key];
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce dot notation over bracket notation for static property access',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      useDotNotation: 'Use dot notation ({{property}}) instead of bracket notation. Use optional chaining (?.) for potentially null/undefined values.',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    return {
      MemberExpression(node) {
        // Only check bracket notation (computed === true)
        if (!node.computed) {
          return;
        }

        // Only flag string literals - allow dynamic/variable access
        if (node.property.type !== 'Literal') {
          return;
        }

        // Only flag string properties
        if (typeof node.property.value !== 'string') {
          return;
        }

        const propertyName = node.property.value;

        // Check if property name is a valid identifier
        // If it contains special characters or starts with a number, bracket notation is necessary
        const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(propertyName);

        if (!isValidIdentifier) {
          // Property name contains special characters - bracket notation is necessary
          return;
        }

        context.report({
          node: node.property,
          messageId: 'useDotNotation',
          data: {
            property: propertyName,
          },
          fix(fixer) {
            const objectText = context.sourceCode.getText(node.object);
            return fixer.replaceText(node, `${objectText}.${propertyName}`);
          },
        });
      },
    };
  },
};
