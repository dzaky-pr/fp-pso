require("@testing-library/jest-dom");

// Configure React Testing Library to suppress act warnings
const { configure } = require("@testing-library/react");
configure({
  testIdAttribute: "data-testid",
  asyncUtilTimeout: 5000,
});

// Suppress JSDOM navigation errors and React warnings globally
const originalError = console.error;
console.error = (...args) => {
  const firstArg = args[0];

  // Handle string errors/warnings
  if (typeof firstArg === "string") {
    const message = firstArg;
    if (
      message.includes("Not implemented: navigation") ||
      message.includes("Warning: An update to") ||
      message.includes(
        "Warning: The current testing environment is not configured to support act",
      )
    ) {
      return; // Suppress these specific errors/warnings
    }
  }

  // Handle Error objects from JSDOM
  if (firstArg instanceof Error) {
    const errorMessage = firstArg.message || "";
    const errorType = firstArg.type || "";
    if (
      errorMessage.includes("Not implemented: navigation") ||
      errorType === "not implemented" ||
      errorMessage.includes("navigation (except hash changes)")
    ) {
      return; // Suppress JSDOM navigation errors
    }
  }

  // Also check if any of the arguments contain JSDOM navigation errors
  const argsString = args.join(" ");
  if (
    argsString.includes("Not implemented: navigation") ||
    argsString.includes("navigateFetch") ||
    argsString.includes("HTMLHyperlinkElementUtils")
  ) {
    return; // Suppress JSDOM navigation related errors
  }

  originalError.call(console, ...args);
};

// Suppress console.warn for tests unless explicitly needed
global.beforeEach(() => {
  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

global.afterEach(() => {
  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  jest.restoreAllMocks();
});
