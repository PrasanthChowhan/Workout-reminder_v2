import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('tauri.js openUrl', () => {
  let originalWindowOpen;

  beforeEach(() => {
    vi.resetModules();
    originalWindowOpen = window.open;
    window.open = vi.fn();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    window.open = originalWindowOpen;
    delete window.__TAURI__;
    vi.restoreAllMocks();
  });

  describe('when not in Tauri (isTauri = false)', () => {
    it('should return immediately if url is empty or N/A', async () => {
      const { openUrl } = await import('./tauri.js');
      await openUrl('');
      await openUrl('N/A');
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should call window.open when url is provided', async () => {
      const { openUrl } = await import('./tauri.js');
      await openUrl('https://example.com');
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
    });
  });

  describe('when in Tauri (isTauri = true)', () => {
    it('should return immediately if url is empty or N/A', async () => {
      window.__TAURI__ = {
        core: {
          invoke: vi.fn()
        }
      };
      const { openUrl } = await import('./tauri.js');
      await openUrl('');
      await openUrl('N/A');
      expect(window.__TAURI__.core.invoke).not.toHaveBeenCalled();
    });

    it('should call invoke open_external_url', async () => {
      const mockInvoke = vi.fn().mockResolvedValue(true);
      window.__TAURI__ = {
        core: {
          invoke: mockInvoke
        }
      };

      const { openUrl } = await import('./tauri.js');
      await openUrl('https://example.com');

      expect(mockInvoke).toHaveBeenCalledWith('open_external_url', { url: 'https://example.com' });
      expect(window.open).not.toHaveBeenCalled();
    });

    it('should catch error, console.error it, and fallback to window.open if invoke fails', async () => {
      const error = new Error('Tauri failed');
      const mockInvoke = vi.fn().mockRejectedValue(error);
      window.__TAURI__ = {
        core: {
          invoke: mockInvoke
        }
      };

      const { openUrl } = await import('./tauri.js');
      await openUrl('https://example.com');

      expect(console.error).toHaveBeenCalledWith(
        `Failed to open URL via Tauri:`,
        error
      );
      expect(window.open).toHaveBeenCalledWith('https://example.com', '_blank');
    });
  });
});
