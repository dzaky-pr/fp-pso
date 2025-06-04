import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import BookCard from "../../components/BookCard";
import type { IBook } from "../../types";

// Mock the router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockBook: IBook = {
  id: 1,
  title: "Test Book Title",
  author: "Test Author",
  price: 25.99,
  description:
    "This is a test book description that should be displayed on the card.",
};

describe("BookCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it("renders book information", () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText("Test Book Title")).toBeTruthy();
    expect(screen.getByText("by Test Author")).toBeTruthy();
    expect(screen.getByText("Rp 25,99")).toBeTruthy();
  });

  it("navigates to book detail page when clicked", async () => {
    const user = userEvent.setup();
    render(<BookCard book={mockBook} />);

    const bookCard = screen.getByRole("link");
    await user.click(bookCard);

    expect(bookCard).toHaveAttribute("href", "/1");
  });

  it("formats price correctly", () => {
    const bookWithDifferentPrice = {
      ...mockBook,
      price: 10,
    };

    render(<BookCard book={bookWithDifferentPrice} />);

    expect(screen.getByText("Rp 10,00")).toBeTruthy();
  });

  it("displays view book button", () => {
    render(<BookCard book={mockBook} />);

    const viewBookButton = screen.getByRole("button", { name: "View Book" });
    expect(viewBookButton).toBeTruthy();
  });

  it("handles books with zero price", () => {
    const freeBook = {
      ...mockBook,
      price: 0,
    };

    render(<BookCard book={freeBook} />);

    expect(screen.getByText("Rp 0,00")).toBeTruthy();
  });
});
