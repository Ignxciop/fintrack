export default {
    testEnvironment: "node",
    transform: {},
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(spec|test).js"],
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/**/*.test.js",
        "!src/**/*.spec.js",
    ],
    coverageDirectory: "coverage",
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};
