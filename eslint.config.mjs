import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import perfectionist from 'eslint-plugin-perfectionist';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
      '*.config.js',
      '*.config.mjs',
      'eslintrc.js',
      'test/**'
    ]
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: {
      perfectionist,
      '@typescript-eslint': tseslint.plugin
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
          'private-method',
          'protected-method',
          'method'
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

      // Complexity rules
      'complexity': ['error', 10],

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

      '@typescript-eslint/max-params': ['error', { max: 4 }],

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
    // Test file overrides
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': ['error', 500],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
