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
  collectCoverage: true, // aktifkan pelacakan coverage
  coverageDirectory: "coverage", // semua output di ./coverage
  coverageReporters: ["lcov", "text"], // LCOV untuk SonarCloud  ringkasan di log
  collectCoverageFrom: [
    "<rootDir>/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/*.{test,spec}.{js,jsx,ts,tsx}",
    "!**/__tests__/**",
    "!<rootDir>/.next/**",
    "!<rootDir>/terraform/**",
  ],
};
