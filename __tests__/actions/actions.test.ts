import {
  deleteBookInDB,
  getBookFromDB,
  putBookInDB,
} from "../../actions/actions";
import * as dataModule from "../../actions/data";

// Mock the data module
jest.mock("../../actions/data", () => ({
  getBook: jest.fn(),
  putBook: jest.fn(),
  deleteBook: jest.fn(),
}));

const mockGetBook = dataModule.getBook as jest.MockedFunction<
  typeof dataModule.getBook
>;
const mockPutBook = dataModule.putBook as jest.MockedFunction<
  typeof dataModule.putBook
>;
const mockDeleteBook = dataModule.deleteBook as jest.MockedFunction<
  typeof dataModule.deleteBook
>;

describe("Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBookFromDB", () => {
    it("should fetch a book by id", async () => {
      const mockBook = {
        id: 1,
        title: "Test Book",
        author: "Test Author",
        price: 25.99,
        description: "Test Description",
      };

      mockGetBook.mockResolvedValue({
        status: 200,
        data: mockBook,
      });

      const result = await getBookFromDB(1);

      expect(mockGetBook).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        status: 200,
        data: mockBook,
      });
    });

    it("should handle error when book not found", async () => {
      mockGetBook.mockResolvedValue({
        status: 404,
        data: { message: "Book not found" },
      });

      const result = await getBookFromDB(999);

      expect(mockGetBook).toHaveBeenCalledWith(999);
      expect(result).toEqual({
        status: 404,
        data: { message: "Book not found" },
      });
    });
  });

  describe("putBookInDB", () => {
    it("should create/update a book", async () => {
      const newBook = {
        id: 2,
        title: "New Book",
        author: "New Author",
        price: 30.0,
        description: "New Description",
      };

      mockPutBook.mockResolvedValue({
        status: 200,
        data: newBook,
      });

      const result = await putBookInDB(newBook);

      expect(mockPutBook).toHaveBeenCalledWith(newBook);
      expect(result).toEqual({
        status: 200,
        data: newBook,
      });
    });

    it("should handle error when putting book fails", async () => {
      const invalidBook = {
        id: 3,
        title: "",
        author: "",
        price: -1,
        description: "",
      };

      mockPutBook.mockResolvedValue({
        status: 400,
        data: { error: "Invalid book data" },
      });

      const result = await putBookInDB(invalidBook);

      expect(mockPutBook).toHaveBeenCalledWith(invalidBook);
      expect(result).toEqual({
        status: 400,
        data: { error: "Invalid book data" },
      });
    });
  });

  describe("deleteBookInDB", () => {
    it("should delete a book by id", async () => {
      mockDeleteBook.mockResolvedValue({
        status: 200,
        data: { message: "Book deleted successfully" },
      });

      const result = await deleteBookInDB(1);

      expect(mockDeleteBook).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        status: 200,
        data: { message: "Book deleted successfully" },
      });
    });

    it("should handle error when deleting non-existent book", async () => {
      mockDeleteBook.mockResolvedValue({
        status: 404,
        data: { error: "Book not found" },
      });

      const result = await deleteBookInDB(999);

      expect(mockDeleteBook).toHaveBeenCalledWith(999);
      expect(result).toEqual({
        status: 404,
        data: { error: "Book not found" },
      });
    });
  });
});
