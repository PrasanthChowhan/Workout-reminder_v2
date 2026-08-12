import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useHoldToConfirm } from "./useHoldToConfirm";

describe("useHoldToConfirm", () => {
  let onConfirmMock;

  beforeEach(() => {
    onConfirmMock = vi.fn();
    vi.useFakeTimers();
    // requestAnimationFrame mock for fake timers
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) =>
      setTimeout(() => cb(performance.now()), 16)
    );
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) =>
      clearTimeout(id)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize with 0 hold progress", () => {
    const { result } = renderHook(() => useHoldToConfirm(onConfirmMock));
    expect(result.current.holdProgress).toBe(0);
  });

  it("should update progress when startHolding is called", () => {
    const { result } = renderHook(() => useHoldToConfirm(onConfirmMock, 2000));

    act(() => {
      // Simulate left mouse click
      result.current.startHolding({ button: 0 });
    });

    // Advance time by 1000ms (50% of 2000ms duration)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.holdProgress).toBeGreaterThan(0);
    expect(result.current.holdProgress).toBeLessThan(100);
  });

  it("should ignore non-left clicks", () => {
    const { result } = renderHook(() => useHoldToConfirm(onConfirmMock, 2000));

    act(() => {
      // Simulate right mouse click
      result.current.startHolding({ button: 2 });
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.holdProgress).toBe(0);
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it("should reset progress when cancelHolding is called", () => {
    const { result } = renderHook(() => useHoldToConfirm(onConfirmMock, 2000));

    act(() => {
      result.current.startHolding({ button: 0 });
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.holdProgress).toBeGreaterThan(0);

    act(() => {
      result.current.cancelHolding();
    });

    expect(result.current.holdProgress).toBe(0);
  });

  it("should call onConfirm when duration is reached", () => {
    const { result } = renderHook(() => useHoldToConfirm(onConfirmMock, 2000));

    act(() => {
      result.current.startHolding({ button: 0 });
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.holdProgress).toBe(0); // Progress is reset after onConfirm
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it("should cleanup animation frame on unmount", () => {
    const { result, unmount } = renderHook(() => useHoldToConfirm(onConfirmMock));
    const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");

    act(() => {
      result.current.startHolding({ button: 0 });
    });

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
