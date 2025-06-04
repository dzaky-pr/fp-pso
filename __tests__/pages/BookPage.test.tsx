import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import {
  deleteBookInDB,
  getBookFromDB,
  putBookInDB,
} from "../../actions/actions";
import BookPage from "../../app/[id]/page";

// Mock the actions
jest.mock("../../actions/actions", () => ({
  getBookFromDB: jest.fn(),
  putBookInDB: jest.fn(),
  deleteBookInDB: jest.fn(),
}));

// Mock the router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the Header component
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

// Mock window.confirm
global.confirm = jest.fn();

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockGetBookFromDB = getBookFromDB as jest.MockedFunction<
  typeof getBookFromDB
>;
const mockPutBookInDB = putBookInDB as jest.MockedFunction<typeof putBookInDB>;
const mockDeleteBookInDB = deleteBookInDB as jest.MockedFunction<
  typeof deleteBookInDB
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockConfirm = global.confirm as jest.MockedFunction<typeof confirm>;

const mockBook = {
  id: 1,
  title: "Test Book",
  author: "Test Author",
  price: 25.99,
  description: "Test Description",
};

describe("BookPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it("renders loading state initially", () => {
    mockGetBookFromDB.mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves to test loading state
        }),
    );

    render(<BookPage params={{ id: 1 }} />);

    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("renders book edit form when book is loaded", async () => {
    mockGetBookFromDB.mockResolvedValue({
      status: 200,
      data: mockBook,
    });

    render(<BookPage params={{ id: 1 }} />);

    await waitFor(() => {
      expect(screen.getByText("Edit Book")).toBeTruthy();
      expect(screen.getByDisplayValue("Test Book")).toBeTruthy();
      expect(screen.getByDisplayValue("Test Author")).toBeTruthy();
      expect(screen.getByDisplayValue(25.99)).toBeTruthy();
      expect(screen.getByDisplayValue("Test Description")).toBeTruthy();
    });
  });

  it("submits edit form with confirmation", async () => {
    const user = userEvent.setup();
    mockGetBookFromDB.mockResolvedValue({
      status: 200,
      data: mockBook,
    });
    mockConfirm.mockReturnValue(true);
    mockPutBookInDB.mockResolvedValue(undefined);

    render(<BookPage params={{ id: 1 }} />);

    await waitFor(() => {
      expect(screen.getByText("Edit Book")).toBeTruthy();
    });

    const submitButton = screen.getByRole("button", { name: "Update Book" });
    await user.click(submitButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      "Apakah Anda yakin ingin mengedit buku ini?",
    );
    await waitFor(() => {
      expect(mockPutBookInDB).toHaveBeenCalledWith(mockBook);
    });
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("submits delete form with confirmation", async () => {
    const user = userEvent.setup();
    mockGetBookFromDB.mockResolvedValue({
      status: 200,
      data: mockBook,
    });
    mockConfirm.mockReturnValue(true);
    mockDeleteBookInDB.mockResolvedValue(undefined);

    render(<BookPage params={{ id: 1 }} />);

    await waitFor(() => {
      expect(screen.getByText("Delete Book")).toBeTruthy();
    });

    const deleteButton = screen.getByRole("button", { name: "Delete Book" });
    await user.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      "Apakah Anda yakin ingin menghapus buku ini?",
    );
    await waitFor(() => {
      expect(mockDeleteBookInDB).toHaveBeenCalledWith(1);
    });
    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
