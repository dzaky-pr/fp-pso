import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import {
  deleteBookInDB,
  getBookFromDB,
  putBookInDB,
} from "../../actions/actions";
import OriginalBookPage from "../../app/[id]/page"; // This now imports your REAL page component

// Mock the actions
jest.mock("../../actions/actions", () => ({
  getBookFromDB: jest.fn(),
  putBookInDB: jest.fn(),
  deleteBookInDB: jest.fn(),
}));

// Mock the Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the Header component (optional, but good for isolation)
jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

// Mock AuthRequiredWrapper (optional, but good for isolation)
jest.mock("../../components/AuthRequiredWrapper", () => {
  return function MockAuthRequiredWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <div data-testid="auth-required-wrapper">{children}</div>;
  };
});

// Mock authentication functions
jest.mock("../../actions/auth", () => ({
  isAuthenticated: jest.fn(() => true),
  getAuthToken: jest.fn(() => "dummy-token"),
}));

// Mock the global confirm dialog, which will be called by your actual component
global.confirm = jest.fn(() => true);

// Setup typed mocks for easier use
const mockGetBookFromDB = getBookFromDB as jest.MockedFunction<
  typeof getBookFromDB
>;
const mockPutBookInDB = putBookInDB as jest.MockedFunction<typeof putBookInDB>;
const mockDeleteBookInDB = deleteBookInDB as jest.MockedFunction<
  typeof deleteBookInDB
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockBook = {
  id: 1,
  title: "Test Book",
  author: "Test Author",
  price: 25.99,
  description: "Test Description",
};

describe("BookPage", () => {
  // Setup mocks before each test
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks to ensure tests are isolated

    // Provide a mock implementation for the router
    mockUseRouter.mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });

    // Set up a default mock for the confirm dialog
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  it("submits edit form with confirmation", async () => {
    const user = userEvent.setup();
    // Arrange: Set up the mock responses for this specific test
    mockGetBookFromDB.mockResolvedValue({
      status: 200,
      data: mockBook,
    });
    mockPutBookInDB.mockResolvedValue({ status: 200, message: "Success" }); // Example success response

    // Act: Render the actual component
    render(<OriginalBookPage params={{ id: 1 }} />);

    // Wait for the component to finish loading and display the form
    const submitButton = await screen.findByRole("button", {
      name: /update book/i,
    });

    // Simulate the user clicking the submit button
    await user.click(submitButton);

    // Assert: Check that the confirmation dialog was shown
    expect(global.confirm).toHaveBeenCalledWith(
      "Apakah Anda yakin ingin mengedit buku ini?",
    );

    // Assert: Check that the database function was called after confirmation
    await waitFor(() => {
      // The payload for putBookInDB depends on your component's state management.
      // Assuming it sends the entire book object back. Adjust if necessary.
      expect(mockPutBookInDB).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, title: "Test Book" }),
      );
    });

    // Assert: Check that the user is redirected
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith("/");
    });
  });

  it("submits delete form with confirmation", async () => {
    const user = userEvent.setup();
    // Arrange: Set up the mock responses for this specific test
    mockGetBookFromDB.mockResolvedValue({
      status: 200,
      data: mockBook,
    });
    mockDeleteBookInDB.mockResolvedValue({ status: 200, message: "Success" }); // Example success response

    // Act: Render the actual component
    render(<OriginalBookPage params={{ id: 1 }} />);

    // Wait for the component to finish loading and display the delete button
    const deleteButton = await screen.findByRole("button", {
      name: /delete book/i,
    });

    // Simulate the user clicking the delete button
    await user.click(deleteButton);

    // Assert: Check that the confirmation dialog was shown
    expect(global.confirm).toHaveBeenCalledWith(
      "Apakah Anda yakin ingin menghapus buku ini?",
    );

    // Assert: Check that the database function was called with the correct ID
    await waitFor(() => {
      expect(mockDeleteBookInDB).toHaveBeenCalledWith(1);
    });

    // Assert: Check that the user is redirected
    await waitFor(() => {
      expect(mockUseRouter().push).toHaveBeenCalledWith("/");
    });
  });
});
