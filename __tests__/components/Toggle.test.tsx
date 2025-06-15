import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Toggle from "../../components/Toggle";

describe("Toggle Component", () => {
  it("should be unchecked by default", () => {
    // Arrange
    const mockSetEnabled = jest.fn(); // Gunakan jest.fn() sebagai placeholder
    render(<Toggle enabled={false} setEnabled={mockSetEnabled} />);

    // Act
    const button = screen.getByRole("switch");

    // Assert
    expect(button).toHaveAttribute("aria-checked", "false");
  });

  it("should be checked when enabled prop is true", () => {
    // Arrange
    const mockSetEnabled = jest.fn(); // Gunakan jest.fn() sebagai placeholder
    render(<Toggle enabled={true} setEnabled={mockSetEnabled} />);

    // Act
    const button = screen.getByRole("switch");

    // Assert
    expect(button).toHaveAttribute("aria-checked", "true");
  });

  it("should call setEnabled with true when clicked while off", async () => {
    // Arrange
    const mockSetEnabled = jest.fn();
    render(<Toggle enabled={false} setEnabled={mockSetEnabled} />);
    const button = screen.getByRole("switch");

    // Act
    await userEvent.click(button);

    // Assert
    expect(mockSetEnabled).toHaveBeenCalledWith(true);
  });

  it("should call setEnabled with false when clicked while on", async () => {
    // Arrange
    const mockSetEnabled = jest.fn();
    render(<Toggle enabled={true} setEnabled={mockSetEnabled} />);
    const button = screen.getByRole("switch");

    // Act
    await userEvent.click(button);

    // Assert
    expect(mockSetEnabled).toHaveBeenCalledWith(false);
  });
});
