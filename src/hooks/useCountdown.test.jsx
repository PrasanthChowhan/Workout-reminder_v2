import { renderHook, act } from "@testing-library/react";
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { useCountdown } from "./useCountdown";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("initializes with initial value", () => {
  const { result } = renderHook(() => useCountdown(300));
  expect(result.current[0]).toBe(300);
});

test("decrements countdown by 1 every second", () => {
  const { result } = renderHook(() => useCountdown(5));

  expect(result.current[0]).toBe(5);

  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(result.current[0]).toBe(4);

  act(() => {
    vi.advanceTimersByTime(3000);
  });
  expect(result.current[0]).toBe(1);
});

test("stops at 0", () => {
  const { result } = renderHook(() => useCountdown(2));

  act(() => {
    vi.advanceTimersByTime(3000);
  });

  expect(result.current[0]).toBe(0);
});

test("allows setting countdown manually", () => {
  const { result } = renderHook(() => useCountdown(300));

  act(() => {
    result.current[1](10);
  });

  expect(result.current[0]).toBe(10);
});
