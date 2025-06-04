import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { putBookInDB } from "../../actions/actions";
import AddPage from "../../app/add/page";

// Mock the actions
jest.mock("../../actions/actions", () => ({
  putBookInDB: jest.fn(),
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
  });

  it("renders add book form", () => {
    render(<AddPage />);

    expect(screen.getByTestId("header")).toBeTruthy();
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

    // Submit form
    await user.click(screen.getByRole("button", { name: "Add Book" }));

    await waitFor(() => {
      expect(mockPutBookInDB).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Test Book",
          author: "Test Author",
          price: 25.99,
          description: "Test Description",
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add Book" })).not.toBeDisabled();
    });

    expect(mockPush).toHaveBeenCalledWith("/");
    expect(mockRefresh).toHaveBeenCalled();
  });

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

    // Submit form
    const submitButton = screen.getByRole("button", { name: "Add Book" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled();
    });

    // Resolve the promise to finish the test
    resolvePromise!();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add Book" })).not.toBeDisabled();
    });
  });

  it("handles submission error", async () => {
    const user = userEvent.setup();
    mockPutBookInDB.mockRejectedValue(new Error("Failed to add book"));

    render(<AddPage />);

    // Fill required fields
    await user.type(screen.getByLabelText("Title"), "Test Book");
    await user.type(screen.getByLabelText("Author"), "Test Author");
    await user.type(screen.getByLabelText("Price"), "25.99");
    await user.type(screen.getByLabelText("Description"), "Test Description");

    // Submit form
    await user.click(screen.getByRole("button", { name: "Add Book" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to add book")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add Book" })).not.toBeDisabled();
    });
  });
});
