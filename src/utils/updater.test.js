import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isVersionSkipped, skipVersion } from './updater';

describe('updater.js', () => {
  const SKIPPED_VERSION_KEY = "kodon_skipped_update_version";

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isVersionSkipped', () => {
    it('returns true when the stored version matches the given version', () => {
      localStorage.setItem(SKIPPED_VERSION_KEY, '1.2.3');
      expect(isVersionSkipped('1.2.3')).toBe(true);
    });

    it('returns false when the stored version does not match the given version', () => {
      localStorage.setItem(SKIPPED_VERSION_KEY, '1.2.2');
      expect(isVersionSkipped('1.2.3')).toBe(false);
    });

    it('returns false when nothing is stored in localStorage', () => {
      expect(isVersionSkipped('1.2.3')).toBe(false);
    });

    it('returns false when localStorage.getItem throws an error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage is disabled');
      });
      expect(isVersionSkipped('1.2.3')).toBe(false);
    });
  });

  describe('skipVersion', () => {
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
      expect(() => skipVersion(version)).not.toThrow();

      expect(setItemSpy).toHaveBeenCalledWith(SKIPPED_VERSION_KEY, version);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to save skipped version to localStorage",
        error
      );
    });
  });
});
