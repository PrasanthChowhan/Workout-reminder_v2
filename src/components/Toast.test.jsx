import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ToastContainer } from "./Toast";
import { toast } from "../utils/toast";

vi.mock("../utils/toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe("ToastContainer", () => {
  let onCloseToastMock;
  let originalClipboard;

  beforeEach(() => {
    onCloseToastMock = vi.fn();
    originalClipboard = global.navigator.clipboard;
    global.navigator.clipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(() => {
    global.navigator.clipboard = originalClipboard;
    vi.clearAllMocks();
    cleanup();
  });

  it("returns null when there are no toasts", () => {
    const { container } = render(<ToastContainer toasts={[]} onCloseToast={onCloseToastMock} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders multiple toasts correctly with different types", () => {
    const toasts = [
      { id: "1", type: "success", message: "Success message" },
      { id: "2", type: "error", message: "Error message" },
      { id: "3", type: "info", message: "Info message" },
    ];

    render(<ToastContainer toasts={toasts} onCloseToast={onCloseToastMock} />);

    expect(screen.getByText("Success message")).toBeDefined();
    expect(screen.getByText("Error message")).toBeDefined();
    expect(screen.getByText("Info message")).toBeDefined();
  });

  it("calls onCloseToast with the correct ID when a toast is clicked", () => {
    const toasts = [
      { id: "test-id-123", type: "info", message: "Click me to close" },
    ];

    render(<ToastContainer toasts={toasts} onCloseToast={onCloseToastMock} />);

    const toastElement = screen.getByText("Click me to close").closest("div").parentElement;
    fireEvent.click(toastElement);

    expect(onCloseToastMock).toHaveBeenCalledWith("test-id-123");
    expect(onCloseToastMock).toHaveBeenCalledTimes(1);
  });

  it("copies to clipboard and stops propagation when copy button is clicked on error toast", () => {
    const toasts = [
      { id: "err-1", type: "error", message: "Failed to connect" },
    ];

    render(<ToastContainer toasts={toasts} onCloseToast={onCloseToastMock} />);

    const copyButton = screen.getByTitle("Copy to clipboard");
    fireEvent.click(copyButton);

    expect(global.navigator.clipboard.writeText).toHaveBeenCalledWith("Failed to connect");
    expect(toast.success).toHaveBeenCalledWith("Copied to clipboard!");
    expect(onCloseToastMock).not.toHaveBeenCalled();
  });
});
