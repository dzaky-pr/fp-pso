import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm, FormField } from "../../components/AuthForm";

describe("FormField Component", () => {
  const defaultProps = {
    id: "test-field",
    name: "testField",
    type: "text",
    label: "Test Label",
    value: "",
    onChange: jest.fn(),
    placeholder: "Test placeholder",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form field with label and input", () => {
    render(<FormField {...defaultProps} />);

    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Test placeholder")).toBeInTheDocument();
  });

  it("calls onChange when input value changes", async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();

    render(<FormField {...defaultProps} onChange={mockOnChange} />);

    const input = screen.getByLabelText("Test Label");
    await user.type(input, "test value");

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("applies custom className", () => {
    render(<FormField {...defaultProps} className="custom-class" />);

    const container = screen.getByLabelText("Test Label").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("sets required attribute when required is true", () => {
    render(<FormField {...defaultProps} required={true} />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toBeRequired();
  });

  it("handles different input types", () => {
    render(<FormField {...defaultProps} type="email" />);

    const input = screen.getByLabelText("Test Label");
    expect(input).toHaveAttribute("type", "email");
  });
});

describe("AuthForm Component", () => {
  const defaultProps = {
    title: "Test Form",
    onSubmit: jest.fn(),
    error: null,
    loading: false,
    buttonText: "Submit",
    footerText: "Footer text",
    footerLinkText: "Link text",
    footerLinkHref: "/test-link",
    children: <div>Form content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders form with title and children", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(screen.getByText("Form content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("displays error message when error is provided", () => {
    render(<AuthForm {...defaultProps} error="Test error message" />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("shows loading state when loading is true", () => {
    render(<AuthForm {...defaultProps} loading={true} />);

    expect(
      screen.getByRole("button", { name: "Loading..." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onSubmit when form is submitted", async () => {
    const user = userEvent.setup();
    const mockOnSubmit = jest.fn((e) => e.preventDefault());

    render(<AuthForm {...defaultProps} onSubmit={mockOnSubmit} />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it("renders footer with link", () => {
    render(<AuthForm {...defaultProps} />);

    expect(screen.getByText("Footer text")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Link text" })).toHaveAttribute(
      "href",
      "/test-link",
    );
  });

  it("prevents form submission when disabled", () => {
    render(<AuthForm {...defaultProps} loading={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
