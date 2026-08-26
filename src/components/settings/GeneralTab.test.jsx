import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import GeneralTab from "./GeneralTab";
import { invoke } from "../../utils/tauri";

// Mock the Tauri invoke function
vi.mock("../../utils/tauri", () => ({
  invoke: vi.fn(),
}));

describe("GeneralTab handleSnooze error paths", () => {
  const mockSettingsForm = { run_at_start: false };
  const mockSetSettingsForm = vi.fn();
  const mockParentStyles = {
    "tab-pane": "tab-pane",
    "settings-group": "settings-group",
    "settings-group-title": "settings-group-title",
    "settings-field": "settings-field",
    "checkbox-field": "checkbox-field",
    "settings-label": "settings-label",
    "settings-checkbox": "settings-checkbox",
    "settings-item-desc": "settings-item-desc",
    "settings-input": "settings-input",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation for get_timer_state so component can mount without errors
    invoke.mockImplementation((cmd) => {
      if (cmd === "get_timer_state") {
        return Promise.resolve({ reminder_state: { type: "Active" } });
      }
      return Promise.resolve();
    });

    // Mock console.error to prevent test output noise and allow asserting on it
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should catch and log error when invoke("snooze_for") fails', async () => {
    render(
      <GeneralTab
        settingsForm={mockSettingsForm}
        setSettingsForm={mockSetSettingsForm}
        parentStyles={mockParentStyles}
      />
    );

    // Wait for initial fetchReminderState to complete
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_timer_state");
    });

    // Clear previous mock implementations and setup the failure
    invoke.mockImplementation((cmd) => {
      if (cmd === "snooze_for") {
        return Promise.reject(new Error("Mock snooze_for failure"));
      }
      if (cmd === "get_timer_state") {
        return Promise.resolve({ reminder_state: { type: "Active" } });
      }
      return Promise.resolve();
    });

    // Find the Snooze button
    const snoozeButton = screen.getByRole("button", { name: "Snooze" });

    // Ensure 30 minutes (or any standard non-restart option) is selected
    // There are two selects, the first one is the snooze select
    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "30" } });

    // Click Snooze
    fireEvent.click(snoozeButton);

    // Wait for the error handling to occur
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("snooze_for", { minutes: 30 });
      expect(console.error).toHaveBeenCalledWith("Snooze failed", expect.any(Error));
    });
  });

  it('should catch and log error when invoke("snooze_until_restart") fails', async () => {
    render(
      <GeneralTab
        settingsForm={mockSettingsForm}
        setSettingsForm={mockSetSettingsForm}
        parentStyles={mockParentStyles}
      />
    );

    // Wait for initial fetchReminderState to complete
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("get_timer_state");
    });

    // Clear previous mock implementations and setup the failure
    invoke.mockImplementation((cmd) => {
      if (cmd === "snooze_until_restart") {
        return Promise.reject(new Error("Mock snooze_until_restart failure"));
      }
      if (cmd === "get_timer_state") {
        return Promise.resolve({ reminder_state: { type: "Active" } });
      }
      return Promise.resolve();
    });

    // Select "Until restart"
    const selects = screen.getAllByRole("combobox");
    const select = selects[0];
    fireEvent.change(select, { target: { value: "restart" } });

    // Find the Snooze button
    const snoozeButtons = screen.getAllByRole("button", { name: "Snooze" });
    const snoozeButton = snoozeButtons[0];

    // Click Snooze
    fireEvent.click(snoozeButton);

    // Wait for the error handling to occur
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith("snooze_until_restart");
      expect(console.error).toHaveBeenCalledWith("Snooze failed", expect.any(Error));
    });
  });
});
