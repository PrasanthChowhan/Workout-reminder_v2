import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { showToast, toast } from "./toast";

describe("Toast utility", () => {
  let dispatchEventSpy;

  beforeEach(() => {
    dispatchEventSpy = vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    dispatchEventSpy.mockRestore();
  });

  describe("showToast", () => {
    it("should dispatch 'app-toast' event with the given message and type", () => {
      const message = "Test error message";
      const type = "error";

      showToast(message, type);

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe("app-toast");
      expect(event.detail).toEqual({ message, type });
    });

    it("should use 'success' as the default type", () => {
      const message = "Test success message";

      showToast(message);

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ message, type: "success" });
    });
  });

  describe("toast object methods", () => {
    it("toast.success should dispatch a success toast", () => {
      toast.success("Success!");
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ message: "Success!", type: "success" });
    });

    it("toast.error should dispatch an error toast", () => {
      toast.error("Error!");
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ message: "Error!", type: "error" });
    });

    it("toast.info should dispatch an info toast", () => {
      toast.info("Info!");
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ message: "Info!", type: "info" });
    });

    it("toast.warning should dispatch a warning toast", () => {
      toast.warning("Warning!");
      const event = dispatchEventSpy.mock.calls[0][0];
      expect(event.detail).toEqual({ message: "Warning!", type: "warning" });
    });
  });
});
