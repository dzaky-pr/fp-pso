/* eslint-disable @typescript-eslint/no-require-imports */
require("@testing-library/jest-dom");

// Configure React Testing Library to suppress act warnings
const { configure } = require("@testing-library/react");
configure({
  testIdAttribute: "data-testid",
  asyncUtilTimeout: 5000,
});

// --- TAMBAHKAN MOCK GLOBAL UNTUK NEXT/NAVIGATION ---
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    // Tambahkan metode router lain jika komponen Anda menggunakannya
  })),
  usePathname: jest.fn(() => "/mock-path"), // Mock usePathname jika ada yang menggunakannya
  useSearchParams: jest.fn(() => new URLSearchParams()), // Mock useSearchParams
}));

// Mock window.matchMedia for theme toggling in Header.tsx
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false, // Default ke light mode untuk tes kecuali di-mock secara eksplisit
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
// --- AKHIR MOCK GLOBAL ---

// Suppress JSDOM navigation errors and React warnings globally
const originalError = console.error;
console.error = (...args) => {
  const firstArg = args[0];

  // Tangani error/peringatan string
  if (typeof firstArg === "string") {
    const message = firstArg;
    if (
      message.includes("Not implemented: navigation") ||
      message.includes("Warning: An update to") ||
      message.includes(
        "Warning: The current testing environment is not configured to support act",
      ) ||
      message.includes("invariant expected app router to be mounted") // Supress error ini
    ) {
      return; // Supress error/peringatan spesifik ini
    }
  }

  // Tangani objek Error dari JSDOM
  if (firstArg instanceof Error) {
    const errorMessage = firstArg.message || "";
    const errorType = firstArg.type || "";
    if (
      errorMessage.includes("Not implemented: navigation") ||
      errorType === "not implemented" ||
      errorMessage.includes("navigation (except hash changes)") ||
      errorMessage.includes("invariant expected app router to be mounted") // Supress error ini
    ) {
      return; // Supress error navigasi JSDOM
    }
  }

  // Juga periksa apakah ada argumen yang berisi error navigasi JSDOM
  const argsString = args.join(" ");
  if (
    argsString.includes("Not implemented: navigation") ||
    argsString.includes("navigateFetch") ||
    argsString.includes("HTMLHyperlinkElementUtils") ||
    argsString.includes("invariant expected app router to be mounted") // Supress error ini
  ) {
    return; // Supress error terkait navigasi JSDOM
  }

  originalError.call(console, ...args);
};

// Supress console.warn untuk tes kecuali secara eksplisit diperlukan
global.beforeEach(() => {
  // biome-ignore lint/correctness/noUndeclaredVariables: <explanation>
  // biome-ignore lint/suspicious/noEmptyBlockStatements: <explanation>
  jest.spyOn(console, "warn").mockImplementation(() => {});
});

global.afterEach(() => {
  jest.restoreAllMocks();
});

// Mock localStorage globally with a proper implementation
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});
