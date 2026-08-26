import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DailyAccountabilityModal from "./DailyAccountabilityModal";
import { invoke } from "../utils/tauri";

// Mock the tauri utility
vi.mock("../utils/tauri", () => ({
  invoke: vi.fn(),
}));

describe("DailyAccountabilityModal", () => {
  let onAnsweredMock;
  let consoleErrorSpy;
  let alertSpy;

  beforeEach(() => {
    onAnsweredMock = vi.fn();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    invoke.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("should submit 'yes' response successfully", async () => {
    invoke.mockResolvedValueOnce();

    render(
      <DailyAccountabilityModal
        isOpen={true}
        questionText="Test Question?"
        onAnswered={onAnsweredMock}
      />
    );

    const yesButton = screen.getByText("YES");
    fireEvent.click(yesButton);

    expect(yesButton.disabled).toBe(true);
    expect(screen.getByText("Saving...")).not.toBeNull();

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("submit_daily_question_response", {
        response: "yes",
      });
      expect(onAnsweredMock).toHaveBeenCalled();
    });
  });

  it("should submit 'no' response successfully", async () => {
    invoke.mockResolvedValueOnce();

    render(
      <DailyAccountabilityModal
        isOpen={true}
        questionText="Test Question?"
        onAnswered={onAnsweredMock}
      />
    );

    const noButton = screen.getByText("NO");
    fireEvent.click(noButton);

    expect(noButton.disabled).toBe(true);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("submit_daily_question_response", {
        response: "no",
      });
      expect(onAnsweredMock).toHaveBeenCalled();
    });
  });

  it("should handle submission error gracefully", async () => {
    const error = new Error("Network error");
    invoke.mockRejectedValueOnce(error);

    render(
      <DailyAccountabilityModal
        isOpen={true}
        questionText="Test Question?"
        onAnswered={onAnsweredMock}
      />
    );

    const yesButton = screen.getByText("YES");
    fireEvent.click(yesButton);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("submit_daily_question_response", {
        response: "yes",
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to submit response:",
        error
      );
      expect(alertSpy).toHaveBeenCalledWith(
        "Failed to save response. Please try again."
      );
      expect(onAnsweredMock).not.toHaveBeenCalled();
    });

    // Check if the state reverted back to false (submitting = false)
    expect(yesButton.disabled).toBe(false);
    expect(screen.getByText("YES")).not.toBeNull();
  });
});
