import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import {
  deleteBookInDB,
  getBookFromDB,
  putBookInDB,
} from "../../actions/actions";
import BookPage from "../../app/[id]/page";

// Mock server actions
jest.mock("../../actions/actions", () => ({
  getBookFromDB: jest.fn(),
  putBookInDB: jest.fn(),
  deleteBookInDB: jest.fn(),
}));

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock auth, sekarang termasuk getUserIdFromToken
jest.mock("../../actions/auth", () => ({
  getAuthToken: jest.fn(() => "dummy-token"),
  getUserIdFromToken: jest.fn(() => "user-adalah-pemilik"),
}));

// Mock komponen lainnya
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});
jest.mock("../../components/AuthRequiredWrapper", () => {
  return function MockAuthRequiredWrapper({
    children,
  }: { children: React.ReactNode }) {
    return <div data-testid="auth-required-wrapper">{children}</div>;
  };
});
jest.mock("../../components/Toggle", () => {
  return function MockToggle() {
    return <button>Toggle</button>;
  };
});

const mockGetBookFromDB = getBookFromDB as jest.Mock;
const mockPutBookInDB = putBookInDB as jest.Mock;
const mockDeleteBookInDB = deleteBookInDB as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const mockBookOwned = {
  id: 1,
  title: "Test Book",
  author: "Test Author",
  price: 25.99,
  description: "Test Description",
  ownerId: "user-adalah-pemilik", // Owner ID sama dengan mock user
};

describe("BookPage", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush, refresh: jest.fn() });
    global.confirm = jest.fn(() => true);
    mockGetBookFromDB.mockResolvedValue({ status: 200, data: mockBookOwned });
  });

  it("submits edit form when user is the owner", async () => {
    mockPutBookInDB.mockResolvedValue({ success: true });
    render(<BookPage params={{ id: 1 }} />);

    const submitButton = await screen.findByRole("button", {
      name: /update book/i,
    });
    expect(submitButton).toBeInTheDocument();

    await userEvent.click(submitButton);

    expect(global.confirm).toHaveBeenCalledWith(
      "Apakah Anda yakin ingin mengedit buku ini?",
    );

    await waitFor(() => {
      expect(mockPutBookInDB).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
        "dummy-token", // Periksa token juga dikirim
      );
    });

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("submits delete form when user is the owner", async () => {
    mockDeleteBookInDB.mockResolvedValue({ success: true });
    render(<BookPage params={{ id: 1 }} />);

    const deleteButton = await screen.findByRole("button", {
      name: /delete book/i,
    });
    expect(deleteButton).toBeInTheDocument();

    await userEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledWith(
      "Apakah Anda yakin ingin menghapus buku ini?",
    );

    await waitFor(() => {
      expect(mockDeleteBookInDB).toHaveBeenCalledWith(1, "dummy-token");
    });

    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows read-only view when user is not the owner", async () => {
    // Override mock untuk test case ini
    const bookNotOwned = { ...mockBookOwned, ownerId: "user-lain" };
    mockGetBookFromDB.mockResolvedValue({ status: 200, data: bookNotOwned });

    render(<BookPage params={{ id: 1 }} />);

    // Tunggu sampai judul buku muncul
    await waitFor(() => {
      expect(screen.getByText("Test Book")).toBeTruthy();
    });

    // Pastikan tombol edit dan delete TIDAK ADA
    expect(screen.queryByRole("button", { name: /update book/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /delete book/i })).toBeNull();
  });
});
