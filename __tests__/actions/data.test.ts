import { getBooks } from "../../actions/data";

// Mock fetch globally
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AWS_API_URL = "https://test-api.com";
  });

  afterEach(() => {
    delete process.env.AWS_API_URL;
  });

  describe("getBooks", () => {
    it("fetches books successfully", async () => {
      const mockBooks = [
        {
          id: 1,
          title: "Book 1",
          author: "Author 1",
          price: 10,
          description: "Desc 1",
        },
        {
          id: 2,
          title: "Book 2",
          author: "Author 2",
          price: 20,
          description: "Desc 2",
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockBooks,
      } as Response);

      const result = await getBooks();

      expect(mockFetch).toHaveBeenCalledWith("https://test-api.com/books", {
        cache: "no-store",
      });

      expect(result).toEqual({
        status: 200,
        data: mockBooks,
      });
    });

    it("handles API error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      } as Response);

      const result = await getBooks();

      expect(result).toEqual({
        status: 500,
        data: { error: "Internal Server Error" },
      });
    });

    it("handles network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await getBooks();
      expect(result).toEqual({
        status: 500,
        data: [],
      });
    });
  });
});
