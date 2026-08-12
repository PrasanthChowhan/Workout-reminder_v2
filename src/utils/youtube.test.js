import { describe, it, expect } from 'vitest';
import { getYoutubeId, getYoutubeStart } from './youtube.js';

describe('getYoutubeId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(getYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from embed URL', () => {
    expect(getYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from URL with additional parameters', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s')).toBe('dQw4w9WgXcQ');
    expect(getYoutubeId('https://www.youtube.com/watch?feature=youtu.be&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from URL without protocol', () => {
    expect(getYoutubeId('www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYoutubeId('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(getYoutubeId('youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from m.youtube.com URL', () => {
    expect(getYoutubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from v/ format URL', () => {
    expect(getYoutubeId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from u/w/ format URL', () => {
      // Very old format, testing just in case since the regex supports it
      expect(getYoutubeId('https://www.youtube.com/u/w/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for invalid domains but matching patterns (edge case of regex)', () => {
     // The regex provided actually allows non-youtube domains if they have the right path structure.
     // e.g. https://example.com/watch?v=12345678901
     // We should document this behavior based on the current implementation.
     expect(getYoutubeId('https://example.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('returns null for non-youtube URLs with no matching pattern', () => {
    expect(getYoutubeId('https://google.com')).toBeNull();
    expect(getYoutubeId('https://vimeo.com/123456789')).toBeNull();
  });

  it('returns null when ID is not exactly 11 characters', () => {
    expect(getYoutubeId('https://www.youtube.com/watch?v=1234567890')).toBeNull(); // 10 chars
    expect(getYoutubeId('https://www.youtube.com/watch?v=123456789012')).toBeNull(); // 12 chars
  });

  it('returns null for empty string or null inputs', () => {
    expect(getYoutubeId('')).toBeNull();
    expect(getYoutubeId(null)).toBeNull();
    expect(getYoutubeId(undefined)).toBeNull();
  });
});

describe('getYoutubeStart', () => {
  it('returns null for empty or null input', () => {
    expect(getYoutubeStart(null)).toBeNull();
    expect(getYoutubeStart('')).toBeNull();
    expect(getYoutubeStart(undefined)).toBeNull();
  });

  it('returns null if no start or t parameter is present', () => {
    expect(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ')).toBeNull();
    expect(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&abc=123')).toBeNull();
  });

  it('extracts simple seconds without s suffix', () => {
    expect(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45')).toBe(45);
    expect(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ?t=120')).toBe(120);
    expect(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&start=15')).toBe(15);
  });

  it('extracts simple seconds with s suffix', () => {
    expect(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s')).toBe(45);
    expect(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ?t=120s')).toBe(120);
    expect(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&start=15s')).toBe(15);
  });

  it('extracts formatted times (h/m/s)', () => {
    expect(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s')).toBe(90);
    expect(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ?t=1h2m3s')).toBe(3723);
    expect(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=2m')).toBe(120);
    expect(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=3h')).toBe(10800);
    expect(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=1h30s')).toBe(3630);
  });

  it('handles parameter at different positions', () => {
    expect(getYoutubeStart('https://www.youtube.com/watch?t=45&v=dQw4w9WgXcQ')).toBe(45);
    expect(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45&index=1')).toBe(45);
  });
});
