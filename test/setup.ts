/**
 * Jest Setup File
 *
 * This file runs before all tests to set up the testing environment.
 */

// Set test environment variables (use bracket notation for strict TypeScript)
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error'; // Suppress logs during tests

// Add any global test utilities here
