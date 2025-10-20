/**
 * ESLint Rule: require-typed-params
 *
 * Enforces that all methods and functions accept either:
 * - Zero parameters (for getters/simple methods)
 * - One typed object parameter (for methods with inputs)
 *
 * This rule prevents confusion about parameter order and makes the codebase AI-friendly.
 *
 * ✅ CORRECT:
 *   function getLevel(): LogLevel { }
 *   function setLevel(params: SetLevelParams): void { }
 *   function log(params: LogParams): void { }
 *
 * ❌ WRONG:
 *   function setLevel(level: LogLevel): void { }  // Primitive parameter
 *   function log(message: string, context?: object): void { }  // Multiple parameters
 *
 * @see TYPED-OBJECT-PARAMETERS.md
 */

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require methods to accept either zero or one typed object parameter',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      multipleParams: 'Methods must accept either zero parameters or one typed object parameter. Found {{count}} parameters.',
      primitiveParam: 'Methods must accept a typed object parameter, not a primitive type. Use an interface like {{name}}Params.',
    },
    schema: [],
  },

  create(context) {
    /**
     * Check if a parameter is a primitive type
     */
    function isPrimitiveType(param) {
      if (!param.typeAnnotation || !param.typeAnnotation.typeAnnotation) {
        return false;
      }

      const typeNode = param.typeAnnotation.typeAnnotation;
      const primitiveTypes = [
        'TSStringKeyword',
        'TSNumberKeyword',
        'TSBooleanKeyword',
        'TSBigIntKeyword',
        'TSSymbolKeyword',
        'TSUndefinedKeyword',
        'TSNullKeyword',
        'TSAnyKeyword',
      ];

      return primitiveTypes.includes(typeNode.type);
    }

    /**
     * Get a suggested parameter name from the method name
     */
    function getSuggestedParamName(methodName) {
      // Capitalize first letter
      const capitalized = methodName.charAt(0).toUpperCase() + methodName.slice(1);
      return `${capitalized}Params`;
    }

    /**
     * Check if a function/method has valid parameters
     */
    function checkFunction(node) {
      const params = node.params;

      // Zero parameters is always OK
      if (params.length === 0) {
        return;
      }

      // More than one parameter is not allowed
      if (params.length > 1) {
        context.report({
          node,
          messageId: 'multipleParams',
          data: {
            count: params.length,
          },
        });
        return;
      }

      // Single parameter - check if it's a primitive type
      const param = params[0];

      // Skip rest parameters (...args)
      if (param.type === 'RestElement') {
        return;
      }

      if (isPrimitiveType(param)) {
        const methodName = node.key ? node.key.name : node.id ? node.id.name : 'method';

        context.report({
          node: param,
          messageId: 'primitiveParam',
          data: {
            name: getSuggestedParamName(methodName),
          },
        });
      }
    }

    return {
      // Check class methods
      MethodDefinition(node) {
        // Skip constructors (they can have multiple params for DI)
        if (node.kind === 'constructor') {
          return;
        }

        checkFunction(node.value);
      },

      // Check function declarations
      FunctionDeclaration(node) {
        checkFunction(node);
      },

      // Check function expressions
      FunctionExpression(node) {
        checkFunction(node);
      },

      // Check arrow functions
      ArrowFunctionExpression(node) {
        checkFunction(node);
      },
    };
  },
};
