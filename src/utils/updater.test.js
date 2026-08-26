import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { skipVersion } from './updater';

describe('updater.js - skipVersion', () => {
  const SKIPPED_VERSION_KEY = "kodon_skipped_update_version";

  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore mocks after each test
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should save the version to localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const version = '1.2.3';

    skipVersion(version);

    expect(setItemSpy).toHaveBeenCalledWith(SKIPPED_VERSION_KEY, version);
    expect(localStorage.getItem(SKIPPED_VERSION_KEY)).toBe(version);
  });

  it('should catch and log error if localStorage.setItem throws', () => {
    const error = new Error('Storage full');
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw error;
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const version = '1.2.3';

    // The function should not throw
    expect(() => skipVersion(version)).not.toThrow();

    expect(setItemSpy).toHaveBeenCalledWith(SKIPPED_VERSION_KEY, version);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to save skipped version to localStorage",
      error
    );
  });
});
