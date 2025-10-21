import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';

// Import custom rules (ESM)
import maxClassMethods from './eslint-rules/max-class-methods.js';
import maxClassProperties from './eslint-rules/max-class-properties.js';
import maxConditionsPerStatement from './eslint-rules/max-conditions-per-statement.js';
import noBracketNotation from './eslint-rules/no-bracket-notation.js';
import noLoggingInLoops from './eslint-rules/no-logging-in-loops.js';
import noPromiseConstructor from './eslint-rules/no-promise-constructor.js';
import noSwitchStatement from './eslint-rules/no-switch-statement.js';
import preferNullOverUndefined from './eslint-rules/prefer-null-over-undefined.js';
import requireTypedParams from './eslint-rules/require-typed-params.js';

export default tseslint.config(
  {
    ignores: [
      // Dependencies
      'node_modules/**',

      // Build outputs
      'dist/**',
      'build/**',
      'coverage/**',

      // Config files (specific files, not all JS/MJS)
      'eslint.config.mjs',
      'jest.config.js',
      'jest.config.mjs',
      'jest.integration.config.js',
      'prettier.config.js',

      // ESLint custom rules (meta-code, not application code)
      'eslint-rules/**',

      // AI-generated temporary files
      '.claude/aiContext/temp/**',

      // Generated files
      '**/*.generated.ts',
      '**/*.generated.js',
      '**/*.d.ts',

      // Test files
      'test/**',
      'test/lint-examples/**',

      // Logs
      '**/*.log',
    ]
  },
  eslint.configs.recommended,
  // TypeScript strict type checking
  ...tseslint.configs.strictTypeChecked,
  {
    // TypeScript files - type checking and strict rules
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      perfectionist,
      '@typescript-eslint': tseslint.plugin,
      'local-rules': {
        rules: {
          'max-class-methods': maxClassMethods,
          'max-class-properties': maxClassProperties,
          'max-conditions-per-statement': maxConditionsPerStatement,
          'no-bracket-notation': noBracketNotation,
          'no-logging-in-loops': noLoggingInLoops,
          'no-promise-constructor': noPromiseConstructor,
          'no-switch-statement': noSwitchStatement,
          'prefer-null-over-undefined': preferNullOverUndefined,
          'require-typed-params': requireTypedParams,
        },
      },
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Perfectionist auto-sorting rules
      'perfectionist/sort-imports': ['error', {
        type: 'natural',
        order: 'asc',
        groups: [
          'type',
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index']
        ],
        newlinesBetween: 'always',
        internalPattern: ['^@/.*']
      }],
      'perfectionist/sort-exports': 'error',
      'perfectionist/sort-named-imports': 'error',
      'perfectionist/sort-named-exports': 'error',
      'perfectionist/sort-object-types': 'error',
      'perfectionist/sort-interfaces': 'error',
      'perfectionist/sort-enums': 'error',
      'perfectionist/sort-classes': ['error', {
        type: 'natural',
        order: 'asc',
        groups: [
          'static-property',
          'private-property',
          'protected-property',
          'property',
          'constructor',
          'static-method',
          'method',
          'protected-method',
          'private-method'
        ]
      }],

      // File and function size limits (relaxed from cogitator)
      'max-lines': ['error', {
        max: 400,               // Increased from 300
        skipBlankLines: true,
        skipComments: true
      }],
      'max-lines-per-function': ['error', {
        max: 75,                // Increased from 50
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true
      }],
      'max-classes-per-file': ['error', 1],
      'max-depth': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'max-statements': ['error', 20],  // Increased from 15
      'max-statements-per-line': ['error', { max: 1 }],

      // Complexity rules
      'complexity': ['error', 10],

      // Custom SOLID enforcement rules
      'local-rules/max-class-methods': ['error', 15],
      'local-rules/max-class-properties': ['error', 15],
      'local-rules/max-conditions-per-statement': ['error', { max: 1 }],
      'local-rules/no-bracket-notation': 'error',
      'local-rules/no-logging-in-loops': 'error',
      'local-rules/no-promise-constructor': 'error',
      'local-rules/no-switch-statement': 'error',
      'local-rules/prefer-null-over-undefined': 'error',
      'local-rules/require-typed-params': 'error',

      // Line length
      'max-len': ['error', {
        code: 100,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: true
      }],

      // TypeScript-specific OOP rules
      '@typescript-eslint/explicit-member-accessibility': ['error', {
        accessibility: 'explicit',
        overrides: {
          constructors: 'no-public',
          properties: 'explicit',
          methods: 'explicit',
          accessors: 'explicit'
        }
      }],

      '@typescript-eslint/member-ordering': ['error', {
        default: [
          // Static
          'public-static-field',
          'protected-static-field',
          'private-static-field',

          // Instance fields
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',

          // Constructors
          'constructor',

          // Static methods
          'public-static-method',
          'protected-static-method',
          'private-static-method',

          // Instance methods
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method'
        ]
      }],

      '@typescript-eslint/max-params': ['error', { max: 1 }],  // Enforces typed object pattern

      // Naming conventions (relaxed - no "I" prefix requirement)
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase']
          // No prefix requirement - more modern TypeScript style
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase']
        },
        {
          selector: 'class',
          format: ['PascalCase']
        },
        {
          selector: 'enum',
          format: ['PascalCase']
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE']
        },
        {
          selector: 'method',
          format: ['camelCase']
        },
        {
          selector: 'property',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE']
        }
      ],

      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-require-imports': 'error',  // ESM only - no require()
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true
      }],
      '@typescript-eslint/strict-boolean-expressions': ['error', {
        allowString: false,
        allowNumber: false,
        allowNullableObject: false
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'method'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // General code quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all']
    }
  },
  {
    // JavaScript files - disable type checking, apply general rules
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      // General code quality (non-TypeScript)
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'max-nested-callbacks': ['error', 3],
      'complexity': ['error', 10],
      'max-len': ['error', {
        code: 100,
        tabWidth: 2,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: true
      }],
    }
  },
  {
    // Test file overrides
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': ['error', 500],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
