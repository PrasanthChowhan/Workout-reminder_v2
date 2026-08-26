import { renderHook, act } from "@testing-library/react";
import { expect, test, vi, beforeEach } from "vitest";
import { useAppToasts } from "./useAppToasts";

beforeEach(() => {
  vi.useFakeTimers();
});

test("initializes with empty toasts", () => {
  const { result } = renderHook(() => useAppToasts());
  expect(result.current.toasts).toEqual([]);
});

test("adds toast on app-toast event and removes it after timeout", () => {
  const { result } = renderHook(() => useAppToasts());

  act(() => {
    window.dispatchEvent(
      new CustomEvent("app-toast", {
        detail: { message: "Test Message", type: "success" },
      })
    );
  });

  expect(result.current.toasts.length).toBe(1);
  expect(result.current.toasts[0].message).toBe("Test Message");
  expect(result.current.toasts[0].type).toBe("success");

  act(() => {
    vi.advanceTimersByTime(4000);
  });

  expect(result.current.toasts.length).toBe(0);
});

test("removeToast removes the toast immediately", () => {
  const { result } = renderHook(() => useAppToasts());

  act(() => {
    window.dispatchEvent(
      new CustomEvent("app-toast", {
        detail: { message: "Test Message", type: "success" },
      })
    );
  });

  expect(result.current.toasts.length).toBe(1);
  const toastId = result.current.toasts[0].id;

  act(() => {
    result.current.removeToast(toastId);
  });

  expect(result.current.toasts.length).toBe(0);
});
