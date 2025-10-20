export default {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file locations
  roots: [
    '<rootDir>/src',
    '<rootDir>/test'
  ],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // TypeScript transformation
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json',
      useESM: true
    }]
  },

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts' // Exclude barrel exports
  ],

  // Coverage thresholds - 80% minimum
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Coverage report formats
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],

  // Module path aliases matching tsconfig
  moduleNameMapper: {
    '^@interface/(.*)$': '<rootDir>/src/interface/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@orchestrator/(.*)$': '<rootDir>/src/orchestrator/$1',
    '^@tools/(.*)$': '<rootDir>/src/tools/$1',
    '^@parsers/(.*)$': '<rootDir>/src/parsers/$1',
    '^@vector/(.*)$': '<rootDir>/src/vector/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@shared/(.*)$': '<rootDir>/src/_shared/$1'
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.ts'
  ],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Max worker threads
  maxWorkers: '50%'
};
