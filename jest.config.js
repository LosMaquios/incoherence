module.exports = {
  preset: 'ts-jest',
  coverageDirectory: 'coverage',
  coverageReporters: [
    'html',
    'lcov',
    'text'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts'
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
