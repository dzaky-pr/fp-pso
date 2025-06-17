module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^server-only$": "<rootDir>/__mocks__/server-only.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/**/*.test.{js,jsx,ts,tsx}",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/terraform/",
    "/.next/",
    "/build/",
    "/dist/",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ["node_modules/(?!(.*\\.mjs$))"],

  /* ---------- Coverage settings ---------- */
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "json", "html"],
  collectCoverageFrom: [
    // Frontend components dan pages yang benar-benar perlu testing
    "<rootDir>/components/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/app/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/actions/**/*.{js,jsx,ts,tsx}",
    // Exclude patterns - more comprehensive
    "!**/*.d.ts",
    "!**/*.{test,spec}.{js,jsx,ts,tsx}",
    "!**/__tests__/**",
    "!**/__mocks__/**",
    "!<rootDir>/.next/**",
    "!<rootDir>/node_modules/**",
    "!<rootDir>/coverage/**",
    "!<rootDir>/terraform/**",
    "!<rootDir>/shared/**", // Exclude shared utilities dari coverage
    "!<rootDir>/playwright_test/**",
    "!<rootDir>/test-results/**",
    "!<rootDir>/jest.*.js",
    "!<rootDir>/*.config.{js,ts,mjs}",
    "!<rootDir>/server.js", // Exclude development server
    "!<rootDir>/local-lambda.js", // Exclude local development files
    "!<rootDir>/app/layout.tsx", // Layout tidak perlu test coverage tinggi
    "!<rootDir>/app/globals.css",
    "!<rootDir>/app/favicon.ico",
    "!<rootDir>/build/**",
    "!<rootDir>/dist/**",
    "!<rootDir>/scripts/**",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/coverage/",
    "/terraform/",
    "/playwright_test/",
    "/test-results/",
    "/__tests__/",
    "/__mocks__/",
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 35,
      lines: 40,
      statements: 40,
    },
    "./components/": {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    "./actions/": {
      branches: 9,
      functions: 25,
      lines: 25,
      statements: 30,
    },
    "./app/": {
      branches: 30,
      functions: 35,
      lines: 40,
      statements: 40,
    },
  },
};
