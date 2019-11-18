module.exports = {
  preset: 'ts-jest',
  coverageDirectory: 'coverage',
  coverageReporters: [
    'html',
    'lcov',
    'text'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    // Ignore public API
    '!packages/*/src/index.ts'
  ],
  watchPathIgnorePatterns: [
    '/node_modules/'
  ],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@incoherence/(.+?)$': '<rootDir>/packages/$1/src'
  },
  rootDir: __dirname,
  testMatch: [
    '<rootDir>/packages/**/__tests__/**/*spec.[jt]s'
  ]
}
