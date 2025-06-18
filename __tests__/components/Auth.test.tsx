import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../../actions/auth";
import AuthProtectedBookList from "../../components/AuthProtectedBookList";
import AuthRequiredWrapper from "../../components/AuthRequiredWrapper";
import type { IBook } from "../../types";

// Mock auth dan navigation
jest.mock("../../actions/auth");
jest.mock("next/navigation");
jest.mock("../../components/BookList", () => {
  return function MockBookList({ books }: { books: IBook[] }) {
    return (
      <div data-testid="book-list">
        {books.map((book) => (
          <div key={book.id}>{book.title}</div>
        ))}
      </div>
    );
  };
});

// Type-safe mock setup
const mockIsAuthenticated = jest.mocked(isAuthenticated);
const mockUseRouter = jest.mocked(useRouter);
const mockPush = jest.fn();

describe("Auth Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("AuthRequiredWrapper", () => {
    it("should render children when authenticated", () => {
      // Arrange
      mockIsAuthenticated.mockReturnValue(true);

      // Act
      render(
        <AuthRequiredWrapper>
          <div>Protected Content</div>
        </AuthRequiredWrapper>,
      );

      // Assert
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should redirect to /login when not authenticated", () => {
      // Arrange
      mockIsAuthenticated.mockReturnValue(false);

      // Act
      render(
        <AuthRequiredWrapper>
          <div>Protected Content</div>
        </AuthRequiredWrapper>,
      );

      // Assert
      expect(screen.queryByText("Protected Content")).toBeNull();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });

  describe("AuthProtectedBookList", () => {
    it("should render BookList when authenticated", () => {
      // Arrange
      mockIsAuthenticated.mockReturnValue(true);

      // Act
      render(<AuthProtectedBookList initialBooks={[]} />);

      // Assert
      expect(screen.getByTestId("book-list")).toBeInTheDocument();
    });
  });
});
