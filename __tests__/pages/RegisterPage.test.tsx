import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { register } from "../../actions/auth";
import RegisterPage from "../../app/register/page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../actions/auth", () => ({
  register: jest.fn(),
}));

jest.mock("../../components/Header", () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

jest.mock("../../components/AuthForm", () => ({
  AuthForm: ({
    children,
    onSubmit,
    error,
    loading,
    title,
  }: {
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    error: string | null;
    loading: boolean;
    title: string;
  }) => (
    <form data-testid="auth-form" onSubmit={onSubmit}>
      <h1>{title}</h1>
      {children}
      {error && <div data-testid="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Register"}
      </button>
    </form>
  ),
  FormField: ({
    id,
    value,
    onChange,
    type,
    placeholder,
    label,
  }: {
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type: string;
    placeholder: string;
    label: string;
  }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  ),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockRegister = register as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it("renders register form", () => {
    render(<RegisterPage />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("auth-form")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Register" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("handles successful registration", async () => {
    mockRegister.mockResolvedValue({ success: true });
    const user = userEvent.setup();

    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /register/i });

    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: "newuser@example.com",
        password: "password123",
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("handles registration error", async () => {
    mockRegister.mockResolvedValue({
      success: false,
      error: "Email already exists",
    });
    const user = userEvent.setup();

    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /register/i });

    await user.type(emailInput, "existing@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Email already exists",
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows loading state during registration", async () => {
    mockRegister.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100),
        ),
    );
    const user = userEvent.setup();

    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /register/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("updates input values correctly", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");

    expect(emailInput.value).toBe("test@example.com");
    expect(passwordInput.value).toBe("password123");
  });
});
