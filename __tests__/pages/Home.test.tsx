import { render, screen } from "@testing-library/react";
import { getBooks } from "../../actions/data";
import Home from "../../app/page";
import type { IBook } from "../../types";

// Mock the data function
jest.mock("../../actions/data", () => ({
  getBooks: jest.fn(),
}));

// Mock the components
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

jest.mock("../../components/BookList", () => {
  return function MockBookList({ books }: { books: IBook[] }) {
    return (
      <div data-testid="book-list">BookList with {books.length} books</div>
    );
  };
});

const mockGetBooks = getBooks as jest.MockedFunction<typeof getBooks>;

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and main content", async () => {
    mockGetBooks.mockResolvedValue({
      status: 200,
      data: [
        {
          id: 1,
          title: "Test Book",
          author: "Test Author",
          price: 10,
          description: "Test desc",
        },
      ],
    });

    render(await Home());

    expect(screen.getByTestId("header")).toBeTruthy();
    expect(screen.getByText("Explore Our Collections")).toBeTruthy();
    expect(screen.getByTestId("book-list")).toBeTruthy();
  });

  it("handles empty books data", async () => {
    mockGetBooks.mockResolvedValue({
      status: 200,
      data: null,
    });

    render(await Home());

    const bookList = screen.getByTestId("book-list");
    expect(bookList.textContent).toContain("BookList with 0 books");
  });

  it("handles books data as array", async () => {
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

    mockGetBooks.mockResolvedValue({
      status: 200,
      data: mockBooks,
    });

    render(await Home());

    const bookList = screen.getByTestId("book-list");
    expect(bookList.textContent).toContain("BookList with 2 books");
  });
});
