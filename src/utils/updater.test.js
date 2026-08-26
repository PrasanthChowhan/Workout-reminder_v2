import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isVersionSkipped } from './updater';

describe('isVersionSkipped', () => {
  const SKIPPED_VERSION_KEY = "kodon_skipped_update_version";

  beforeEach(() => {
    // Clear localStorage before each test to ensure a clean state
    localStorage.clear();
    // Restore any mocks
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

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
    // Mock localStorage.getItem to throw an error
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage is disabled');
    });

    expect(isVersionSkipped('1.2.3')).toBe(false);
  });
});
