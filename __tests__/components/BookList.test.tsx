import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookList from "../../components/BookList";
import type { IBook } from "../../types";

// Mock the components
jest.mock("../../components/SearchBar", () => {
  return function MockSearchBar({
    onSearch,
  }: {
    onSearch: (query: string) => void;
  }) {
    return (
      <input
        data-testid="search-bar"
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search books..."
      />
    );
  };
});

jest.mock("../../components/BookCard", () => {
  return function MockBookCard({ book }: { book: IBook }) {
    return <div data-testid={`book-card-${book.id}`}>{book.title}</div>;
  };
});

const mockBooks: IBook[] = [
  {
    id: 1,
    title: "Book One",
    author: "Author A",
    price: 10,
    description: "Description 1",
  },
  {
    id: 2,
    title: "Book Two",
    author: "Author B",
    price: 20,
    description: "Description 2",
  },
  {
    id: 3,
    title: "Another Book",
    author: "Author C",
    price: 30,
    description: "Description 3",
  },
];

describe("BookList", () => {
  it("renders all books when no search query", () => {
    render(<BookList books={mockBooks} />);

    expect(screen.getByTestId("search-bar")).toBeTruthy();
    expect(screen.getByTestId("book-card-1")).toBeTruthy();
    expect(screen.getByTestId("book-card-2")).toBeTruthy();
    expect(screen.getByTestId("book-card-3")).toBeTruthy();
  });

  it("filters books based on search query", async () => {
    const user = userEvent.setup();
    render(<BookList books={mockBooks} />);

    const searchInput = screen.getByTestId("search-bar");
    await user.type(searchInput, "Book One");

    // Should show only the matching book
    expect(screen.getByTestId("book-card-1")).toBeTruthy();
    expect(screen.queryByTestId("book-card-2")).toBeNull();
    expect(screen.queryByTestId("book-card-3")).toBeNull();
  });

  it("shows no books message when no matches found", async () => {
    const user = userEvent.setup();
    render(<BookList books={mockBooks} />);

    const searchInput = screen.getByTestId("search-bar");
    await user.type(searchInput, "Nonexistent Book");

    expect(
      screen.getByText("No books found matching your search."),
    ).toBeTruthy();
    expect(screen.queryByTestId("book-card-1")).toBeNull();
    expect(screen.queryByTestId("book-card-2")).toBeNull();
    expect(screen.queryByTestId("book-card-3")).toBeNull();
  });

  it("shows empty state when no books provided", () => {
    render(<BookList books={[]} />);

    expect(
      screen.getByText("No books available. Add some books to get started!"),
    ).toBeTruthy();
    expect(screen.getByTestId("search-bar")).toBeTruthy();
  });

  it("case-insensitive search works", async () => {
    const user = userEvent.setup();
    render(<BookList books={mockBooks} />);

    const searchInput = screen.getByTestId("search-bar");
    await user.type(searchInput, "book one");

    expect(screen.getByTestId("book-card-1")).toBeTruthy();
    expect(screen.queryByTestId("book-card-2")).toBeNull();
  });

  it("searches in author names", async () => {
    const user = userEvent.setup();
    render(<BookList books={mockBooks} />);

    const searchInput = screen.getByTestId("search-bar");
    await user.type(searchInput, "Author B");

    expect(screen.getByTestId("book-card-2")).toBeTruthy();
    expect(screen.queryByTestId("book-card-1")).toBeNull();
    expect(screen.queryByTestId("book-card-3")).toBeNull();
  });
});
