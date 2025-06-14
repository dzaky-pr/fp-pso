import { render, screen } from "@testing-library/react";
import { getBooks } from "../../actions/data";
import Home from "../../app/page";
import type { IBook } from "../../types";

// --- MOCK next/navigation and actions/auth ---
// Mock useRouter
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock isAuthenticated to control auth state in tests
const mockIsAuthenticated = jest.fn();
jest.mock("../../actions/auth", () => ({
  isAuthenticated: () => mockIsAuthenticated(),
  getAuthToken: jest.fn(), // Mock other functions if they are used by components being tested
  logout: jest.fn(),
  login: jest.fn(),
  register: jest.fn(),
  getUserIdFromToken: jest.fn(),
}));

// --- END MOCKING ---

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

// Mock AuthProtectedBookList so its internal logic doesn't cause useRouter issues in the test
// And we can control its rendering directly for Home component tests
jest.mock("../../components/AuthProtectedBookList", () => {
  return function MockAuthProtectedBookList({
    initialBooks,
  }: { initialBooks: IBook[] }) {
    // In tests, we'll assume it handles auth and just renders the BookList.
    // Real auth logic is tested separately or via integration tests.
    return (
      <div data-testid="auth-protected-booklist">
        <div data-testid="book-list">
          BookList with {initialBooks.length} books
        </div>
      </div>
    );
  };
});

const mockGetBooks = getBooks as jest.MockedFunction<typeof getBooks>;

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default to authenticated for Home page tests to ensure content renders
    mockIsAuthenticated.mockReturnValue(true);
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
    expect(screen.getByTestId("auth-protected-booklist")).toBeTruthy(); // Check the wrapper
    expect(screen.getByTestId("book-list")).toBeTruthy(); // Check content inside
    expect(screen.getByText("BookList with 1 books")).toBeTruthy();
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
