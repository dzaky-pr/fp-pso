import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { putBookInDB } from "../../actions/actions";
import AddPage from "../../app/add/page";

// Mock the actions
jest.mock("../../actions/actions", () => ({
  putBookInDB: jest.fn(),
}));

// Mock the router (jika belum di-mock secara global oleh jest.setup.js)
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the Header component
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

// --- MOCK AuthRequiredWrapper ---
// Kita akan memmock AuthRequiredWrapper agar selalu merender childrennya
// dalam konteks tes ini, karena kita ingin menguji AddPage itu sendiri.
jest.mock("../../components/AuthRequiredWrapper", () => {
  return function MockAuthRequiredWrapper({
    children,
  }: { children: React.ReactNode }) {
    return <div data-testid="auth-required-wrapper">{children}</div>;
  };
});

// Mock isAuthenticated() dari actions/auth agar selalu true di test ini
// Karena AuthRequiredWrapper mungkin bergantung padanya.
jest.mock("../../actions/auth", () => ({
  ...jest.requireActual("../../actions/auth"), // Pertahankan fungsi asli lainnya jika diperlukan
  isAuthenticated: jest.fn(() => true), // Paksa isAuthenticated mengembalikan true untuk tes
  getAuthToken: jest.fn(() => "dummy-token"), // Juga berikan token dummy
}));
// --- AKHIR MOCK ---

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockPutBookInDB = putBookInDB as jest.MockedFunction<typeof putBookInDB>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("AddPage", () => {
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
    // Mock localStorage to simulate authenticated state for tests if needed
    // Ini sudah kita mock secara global di jest.setup.js, tapi bisa di-override di sini jika perlu.
    // Untuk tes ini, karena mockIsAuthenticated sudah diset true, ini tidak terlalu krusial di sini.
  });

  afterEach(() => {
    (window.localStorage.getItem as jest.Mock).mockRestore();
  });

  it("renders add book form", () => {
    render(<AddPage />);

    expect(screen.getByTestId("header")).toBeTruthy();
    // Karena kita membungkus dengan AuthRequiredWrapper, kita harus mengecek wrapper dulu,
    // lalu konten di dalamnya.
    expect(screen.getByTestId("auth-required-wrapper")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Add Book" })).toBeTruthy();
    expect(screen.getByLabelText("Title")).toBeTruthy();
    expect(screen.getByLabelText("Author")).toBeTruthy();
    expect(screen.getByLabelText("Price")).toBeTruthy();
    expect(screen.getByLabelText("Description")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add Book" })).toBeTruthy();
  });

  it("handles form input changes", async () => {
    const user = userEvent.setup();
    render(<AddPage />);

    const titleInput = screen.getByLabelText("Title");
    const authorInput = screen.getByLabelText("Author");
    const priceInput = screen.getByLabelText("Price");

    await user.type(titleInput, "Test Book");
    await user.type(authorInput, "Test Author");
    await user.clear(priceInput);
    await user.type(priceInput, "25.99");

    expect(titleInput).toHaveValue("Test Book");
    expect(authorInput).toHaveValue("Test Author");
    expect(priceInput).toHaveValue(25.99);
  });

  it("submits form successfully", async () => {
    const user = userEvent.setup();
    mockPutBookInDB.mockResolvedValue(undefined);

    render(<AddPage />);

    // Fill form
    await user.type(screen.getByLabelText("Title"), "Test Book");
    await user.type(screen.getByLabelText("Author"), "Test Author");
    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "25.99");
    await user.type(screen.getByLabelText("Description"), "Test Description");

    // Submit form wrapped in act
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Add Book" }));
    });

    await waitFor(() => {
      expect(mockPutBookInDB).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(Number), // ID will be random
          title: "Test Book",
          author: "Test Author",
          price: 25.99,
          description: "Test Description",
        }),
        "dummy-token",
      );
    });

    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockRefresh).toHaveBeenCalled();
  }, 10000);

  it("shows loading state during submission", async () => {
    const user = userEvent.setup();
    let resolvePromise: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });

    mockPutBookInDB.mockReturnValue(promise);

    render(<AddPage />);

    // Fill required fields
    await user.type(screen.getByLabelText("Title"), "Test Book");
    await user.type(screen.getByLabelText("Author"), "Test Author");
    await user.type(screen.getByLabelText("Price"), "25.99");
    await user.type(screen.getByLabelText("Description"), "Test Description");

    // Submit form wrapped in act
    const submitButton = screen.getByRole("button", { name: "Add Book" });

    await act(async () => {
      await user.click(submitButton);
    });

    // Check loading state immediately after click
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Loading..." })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
    });

    // Resolve the promise to finish the test
    await act(async () => {
      resolvePromise!();
    });
  }, 10000);

  it("handles submission error", async () => {
    const user = userEvent.setup();
    mockPutBookInDB.mockRejectedValue(new Error("Failed to add book"));

    render(<AddPage />);

    // Fill required fields
    await user.type(screen.getByLabelText("Title"), "Test Book");
    await user.type(screen.getByLabelText("Author"), "Test Author");
    await user.type(screen.getByLabelText("Price"), "25.99");
    await user.type(screen.getByLabelText("Description"), "Test Description");

    // Submit form wrapped in act
    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Add Book" }));
    });

    await waitFor(
      () => {
        expect(screen.getByText("Failed to add book")).toBeTruthy();
      },
      { timeout: 3000 },
    );
  }, 10000);
});
