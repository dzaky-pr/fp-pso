/**
 * @jest-environment jsdom
 */
// Jest will mock this globally from jest.setup.js, but we want to test the real functions
import {
  getAuthToken,
  getUserEmailFromToken,
  getUserIdFromToken,
  isAuthenticated,
  login,
  logout,
  register,
} from "../../actions/auth";

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Auth Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    window.localStorage.clear();
    console.error = jest.fn();
    // Don't set AWS_API_URL to force fallback to localhost
  });

  afterEach(() => {
    console.error = originalConsoleError;
    delete process.env.AWS_API_URL;
  });

  describe("register", () => {
    it("successfully registers a new user", async () => {
      const mockResponse = {
        userId: "user123",
        email: "test@example.com",
        message: "Registration successful",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await register({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        },
      );

      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });

    it("handles registration error", async () => {
      const errorResponse = {
        error: "Email already exists",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      } as Response);

      const result = await register({
        email: "existing@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        success: false,
        error: "Email already exists",
      });
    });

    it("handles network error during registration", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await register({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        success: false,
        error: "Network error",
      });
    });
  });

  describe("login", () => {
    it("successfully logs in a user", async () => {
      const mockResponse = {
        userId: "user123",
        email: "test@example.com",
        token: "jwt-token-123",
        message: "Login successful",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await login({
        email: "test@example.com",
        password: "password123",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
            password: "password123",
          }),
        },
      );

      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });

      // Check token was stored
      expect(window.localStorage.getItem("authToken")).toBe("jwt-token-123");
    });

    it("handles login error", async () => {
      const errorResponse = {
        error: "Invalid credentials",
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse,
      } as Response);

      const result = await login({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(result).toEqual({
        success: false,
        error: "Invalid credentials",
      });

      expect(window.localStorage.getItem("authToken")).toBeNull();
    });

    it("handles network error during login", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await login({
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toEqual({
        success: false,
        error: "Network error",
      });
    });
  });

  describe("logout", () => {
    it("removes auth token from localStorage", () => {
      window.localStorage.setItem("authToken", "jwt-token-123");
      expect(window.localStorage.getItem("authToken")).toBe("jwt-token-123");

      logout();

      expect(window.localStorage.getItem("authToken")).toBeNull();
    });
  });

  describe("getAuthToken", () => {
    it("returns token when it exists", () => {
      window.localStorage.setItem("authToken", "jwt-token-123");

      const token = getAuthToken();

      expect(token).toBe("jwt-token-123");
    });

    it("returns null when token doesn't exist", () => {
      const token = getAuthToken();

      expect(token).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("returns true when token exists", () => {
      window.localStorage.setItem("authToken", "jwt-token-123");

      const authenticated = isAuthenticated();

      expect(authenticated).toBe(true);
    });

    it("returns false when token doesn't exist", () => {
      const authenticated = isAuthenticated();

      expect(authenticated).toBe(false);
    });
  });

  describe("getUserIdFromToken", () => {
    it("returns userId from valid JWT token", () => {
      // JWT token with payload: { userId: "user123", email: "test@example.com" }
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature";

      window.localStorage.setItem("authToken", validToken);

      const userId = getUserIdFromToken();

      expect(userId).toBe("user123");
    });

    it("returns null when no token exists", () => {
      const userId = getUserIdFromToken();

      expect(userId).toBeNull();
    });

    it("returns null when token is malformed", () => {
      window.localStorage.setItem("authToken", "invalid-token");

      const userId = getUserIdFromToken();

      expect(userId).toBeNull();
    });
  });

  describe("getUserEmailFromToken", () => {
    it("returns email from valid JWT token", () => {
      // JWT token with payload: { userId: "user123", email: "test@example.com" }
      const validToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIn0.signature";

      window.localStorage.setItem("authToken", validToken);

      const email = getUserEmailFromToken();

      expect(email).toBe("test@example.com");
    });

    it("returns null when no token exists", () => {
      const email = getUserEmailFromToken();

      expect(email).toBeNull();
    });

    it("returns null when token is malformed", () => {
      window.localStorage.setItem("authToken", "invalid-token");

      const email = getUserEmailFromToken();

      expect(email).toBeNull();
    });

    it("returns null in server environment", () => {
      // Temporarily mock window as undefined to simulate server environment
      const originalWindow = global.window;
      // @ts-expect-error Testing server environment behavior
      delete global.window;

      const email = getUserEmailFromToken();

      expect(email).toBeNull();

      // Restore window
      global.window = originalWindow;
    });
  });
});
