import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import MyBooksPage from "../../app/my-books/page";
import type { IBook } from "../../types";

// Mock server action
jest.mock("../../actions/data", () => ({
  getMyBooks: jest.fn(),
}));

// Mock auth
jest.mock("../../actions/auth", () => ({
  getAuthToken: jest.fn(() => "dummy-token-for-my-books"),
}));

// Mock komponen
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header>Header</header>;
  };
});
jest.mock("../../components/AuthRequiredWrapper", () => {
  return function MockAuthRequiredWrapper({
    children,
  }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});
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

import { getMyBooks as originalGetMyBooks } from "../../actions/data";
const mockGetMyBooks = originalGetMyBooks as jest.Mock;

describe("MyBooksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display loading state initially and then render fetched books", async () => {
    // Arrange: Siapkan data mock yang akan dikembalikan oleh API
    const myMockBooks = [
      { id: 101, title: "My Private Book", isPrivate: true },
      { id: 102, title: "My Public Book", isPrivate: false },
    ];
    mockGetMyBooks.mockResolvedValue({ status: 200, data: myMockBooks });

    // Act: Render komponen
    render(<MyBooksPage />);

    // Assert: Pastikan teks loading muncul
    expect(screen.getByText("Loading your books...")).toBeInTheDocument();

    // Assert: Tunggu hingga buku-buku muncul setelah data diambil
    await waitFor(() => {
      expect(screen.getByText("My Private Book")).toBeInTheDocument();
      expect(screen.getByText("My Public Book")).toBeInTheDocument();
    });

    // Assert: Pastikan server action dipanggil dengan token yang benar
    expect(mockGetMyBooks).toHaveBeenCalledWith("dummy-token-for-my-books");
  }, 10000);
});
