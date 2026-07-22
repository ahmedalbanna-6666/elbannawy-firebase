/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'repositories/**/*.ts',
    'services/**/*.ts',
    'domain/**/*.ts',
    'shared/**/*.ts',
    'validators/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
};
