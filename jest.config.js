module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testURL: 'http://localhost:3000/',
  coverageDirectory: './coverage/',
  collectCoverage: true,
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
  testPathIgnorePatterns: ['.next', 'node_modules', '@types'],
  moduleDirectories: ['node_modules', './'],
  globals: {
    'ts-jest': {
      tsconfig: 'app/tsconfig.json',
    },
  },
};
