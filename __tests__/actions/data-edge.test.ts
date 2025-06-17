import { getBooks } from "../../actions/data";

// Mock environment
const originalEnv = process.env;

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Data Actions - Additional Coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getBooks edge cases", () => {
    it("returns empty data when AWS_API_URL is not set", async () => {
      delete process.env.AWS_API_URL;

      const result = await getBooks(null);

      expect(result).toEqual({
        data: [],
        status: 200,
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("handles fetch error and returns fallback", async () => {
      process.env.AWS_API_URL = "https://test-api.com";

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await getBooks("dummy-token");

      expect(result).toEqual({
        data: [],
        status: 500,
      });
    });

    it("handles unknown error type", async () => {
      process.env.AWS_API_URL = "https://test-api.com";

      // Mock a non-Error object being thrown
      mockFetch.mockRejectedValueOnce("String error");

      const result = await getBooks("dummy-token");

      expect(result).toEqual({
        data: [],
        status: 500,
      });
    });
  });
});
