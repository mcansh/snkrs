/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testEnvironmentOptions: {
    url: "http://localhost:3000/",
  },
  coverageDirectory: "./coverage/",
  collectCoverage: true,
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
  moduleDirectories: ["node_modules", "./"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/app/$1",
  },
  passWithNoTests: true,
};
