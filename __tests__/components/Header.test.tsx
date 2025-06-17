import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import {
  getUserEmailFromToken,
  isAuthenticated,
  logout,
} from "../../actions/auth";
import Header from "../../components/Header";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../actions/auth", () => ({
  isAuthenticated: jest.fn(),
  logout: jest.fn(),
  getUserEmailFromToken: jest.fn(),
}));

// Mock Image component
jest.mock("next/image", () => {
  return function MockImage(props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }) {
    return (
      <div data-testid="mock-image" data-src={props.src} data-alt={props.alt} />
    );
  };
});

// Mock Link component
jest.mock("next/link", () => {
  return function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockPush = jest.fn();
const mockIsAuthenticated = isAuthenticated as jest.Mock;
const mockLogout = logout as jest.Mock;
const mockGetUserEmailFromToken = getUserEmailFromToken as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe("Header Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(() => "light"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock window methods
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });

    global.addEventListener = jest.fn();
    global.removeEventListener = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders header with logo and title", () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(<Header />);

    expect(screen.getByText("Book Library")).toBeInTheDocument();
    expect(screen.getByTestId("mock-image")).toBeInTheDocument();
  });

  it("shows login button when not authenticated", () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(<Header />);

    expect(screen.getAllByText("Login")).toHaveLength(2); // Desktop and mobile versions
    expect(screen.queryByText("Home")).not.toBeInTheDocument();
  });

  it("shows navigation menu when authenticated", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserEmailFromToken.mockReturnValue("test@example.com");

    render(<Header />);

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("My Books")).toBeInTheDocument();
    expect(screen.getByText("Add Book")).toBeInTheDocument();
  });

  it("displays user email when authenticated", () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserEmailFromToken.mockReturnValue("test@example.com");

    render(<Header />);

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("toggles theme on theme button click", async () => {
    mockIsAuthenticated.mockReturnValue(false);
    const user = userEvent.setup();

    render(<Header />);

    const themeButton = screen.getByLabelText("Toggle Theme Website");
    await user.click(themeButton);

    expect(localStorage.setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("handles logout functionality", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserEmailFromToken.mockReturnValue("test@example.com");
    const user = userEvent.setup();

    render(<Header />);

    // Open profile menu
    const profileButton = screen.getByLabelText("Toggle Profile Menu");
    await user.click(profileButton);

    // Click logout
    const logoutButton = screen.getByText("Log Out");
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("toggles mobile menu", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    mockGetUserEmailFromToken.mockReturnValue("test@example.com");

    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      value: 500,
      writable: true,
    });

    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByLabelText("Open menu");
    await user.click(menuButton);

    // Mobile menu should be visible
    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });

  it("closes mobile menu when window is resized to desktop", () => {
    mockIsAuthenticated.mockReturnValue(true);

    render(<Header />);

    // Simulate window resize
    Object.defineProperty(window, "innerWidth", {
      value: 1024,
      writable: true,
    });

    fireEvent(window, new Event("resize"));

    // Menu should be closed on desktop
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});
