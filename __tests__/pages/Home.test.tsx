import { render, screen, waitFor } from "@testing-library/react";
import { getBooks } from "../../actions/actions";
import Home from "../../app/page";
import type { IBook } from "../../types";

// Mock server action
jest.mock("../../actions/actions", () => ({
  getBooks: jest.fn(),
}));

// Mock auth
jest.mock("../../actions/auth", () => ({
  isAuthenticated: jest.fn(() => true),
  getAuthToken: jest.fn(() => "dummy-token"),
}));

// Mock komponen
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});
jest.mock("../../components/AuthProtectedBookList", () => {
  return function MockAuthProtectedBookList({
    initialBooks,
  }: { initialBooks: IBook[] }) {
    return (
      <div data-testid="book-list">
        {initialBooks.length > 0 ? (
          initialBooks.map((book) => <div key={book.id}>{book.title}</div>)
        ) : (
          <div>No books available. Add some books to get started!</div>
        )}
      </div>
    );
  };
});

const mockGetBooks = getBooks as jest.Mock;

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders books after fetching", async () => {
    const mockBooks = [
      {
        id: 1,
        title: "Test Book",
        author: "Test Author",
        price: 10,
        description: "Desc",
      },
    ];
    mockGetBooks.mockResolvedValue({ status: 200, data: mockBooks });

    render(<Home />);

    expect(screen.getByText("Loading books...")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Test Book")).toBeInTheDocument();
    });

    expect(screen.getByText("Explore Our Collections")).toBeTruthy();
    expect(mockGetBooks).toHaveBeenCalledWith("dummy-token");
  });

  it("shows no books message when fetch returns empty array", async () => {
    mockGetBooks.mockResolvedValue({ status: 200, data: [] });

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByText("No books available. Add some books to get started!"),
      ).toBeInTheDocument();
    });
  });
});
