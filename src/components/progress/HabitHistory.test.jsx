import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HabitHistory from "./HabitHistory";

describe("HabitHistory", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders empty state when no checkins are provided", () => {
    render(<HabitHistory checkins={[]} />);
    expect(screen.getByText("No check-in history recorded.")).toBeDefined();
  });

  it("renders empty state when checkins is null", () => {
    render(<HabitHistory checkins={null} />);
    expect(screen.getByText("No check-in history recorded.")).toBeDefined();
  });

  it("formats valid dates correctly", () => {
    const checkins = [
      { response: "yes", localDate: "2023-10-15T12:00:00Z" }
    ];

    // We mock toLocaleDateString to avoid timezone/locale flakiness in CI
    const dateSpy = vi.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("Oct 15");

    render(<HabitHistory checkins={checkins} />);

    expect(screen.getByText("Answered YES")).toBeDefined();
    expect(screen.getByText("Oct 15")).toBeDefined();
  });

  it("returns original string when date formatting throws", () => {
    const checkins = [
      { response: "no", localDate: "Invalid Date String" }
    ];

    const dateSpy = vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(() => {
      throw new Error("Simulated formatting error");
    });

    render(<HabitHistory checkins={checkins} />);

    expect(screen.getByText("Answered NO")).toBeDefined();
    expect(screen.getByText("Invalid Date String")).toBeDefined();
  });
});
