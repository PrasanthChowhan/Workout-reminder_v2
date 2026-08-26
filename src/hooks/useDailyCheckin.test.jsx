import { renderHook, act } from "@testing-library/react";
import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { useDailyCheckin } from "./useDailyCheckin";
import { invoke } from "../utils/tauri";

vi.mock("../utils/tauri", () => ({
  invoke: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("initializes with default values", () => {
  const { result } = renderHook(() => useDailyCheckin());
  expect(result.current.dailyCheckin).toEqual({
    enabled: false,
    answeredToday: false,
    question: "",
  });
});

test("checkDailyQuestion calls invoke and updates state", async () => {
  const mockResponse = {
    enabled: true,
    answeredToday: false,
    question: "How are you feeling?",
  };
  invoke.mockResolvedValueOnce(mockResponse);

  const { result } = renderHook(() => useDailyCheckin());

  await act(async () => {
    await result.current.checkDailyQuestion();
  });

  expect(invoke).toHaveBeenCalledWith("check_daily_question_status");
  expect(result.current.dailyCheckin).toEqual(mockResponse);
});

test("adds event listeners on mount", () => {
  const addEventListenerSpy = vi.spyOn(window, "addEventListener");
  const documentAddEventListenerSpy = vi.spyOn(document, "addEventListener");

  renderHook(() => useDailyCheckin());

  expect(addEventListenerSpy).toHaveBeenCalledWith(
    "focus",
    expect.any(Function)
  );
  expect(documentAddEventListenerSpy).toHaveBeenCalledWith(
    "visibilitychange",
    expect.any(Function)
  );
});

test("removes event listeners on unmount", () => {
  const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  const documentRemoveEventListenerSpy = vi.spyOn(
    document,
    "removeEventListener"
  );

  const { unmount } = renderHook(() => useDailyCheckin());

  unmount();

  expect(removeEventListenerSpy).toHaveBeenCalledWith(
    "focus",
    expect.any(Function)
  );
  expect(documentRemoveEventListenerSpy).toHaveBeenCalledWith(
    "visibilitychange",
    expect.any(Function)
  );
});
