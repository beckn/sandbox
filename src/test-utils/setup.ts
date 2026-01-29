/**
 * Jest setup file - runs before each test file
 */

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  jest.spyOn(console, 'log').mockImplementation(() => {});
}

// Set default environment variables for tests
process.env.NODE_ENV = 'test';
process.env.CALLBACK_TIMEOUT = '1000'; // Faster timeout for tests
process.env.LEDGER_TIMEOUT = '1000';
process.env.LEDGER_RETRY_COUNT = '1';
process.env.LEDGER_RETRY_DELAY = '100';

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});
