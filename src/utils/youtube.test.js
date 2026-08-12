import { test, describe } from 'node:test';
import assert from 'node:assert';
import { getYoutubeStart } from './youtube.js';

describe('getYoutubeStart', () => {
  test('returns null for empty or null input', () => {
    assert.strictEqual(getYoutubeStart(null), null);
    assert.strictEqual(getYoutubeStart(''), null);
    assert.strictEqual(getYoutubeStart(undefined), null);
  });

  test('returns null if no start or t parameter is present', () => {
    assert.strictEqual(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), null);
    assert.strictEqual(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ'), null);
    assert.strictEqual(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&abc=123'), null);
  });

  test('extracts simple seconds without s suffix', () => {
    assert.strictEqual(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45'), 45);
    assert.strictEqual(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ?t=120'), 120);
    assert.strictEqual(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&start=15'), 15);
  });

  test('extracts simple seconds with s suffix', () => {
    assert.strictEqual(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s'), 45);
    assert.strictEqual(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ?t=120s'), 120);
    assert.strictEqual(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&start=15s'), 15);
  });

  test('extracts formatted times (h/m/s)', () => {
    assert.strictEqual(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1m30s'), 90);
    assert.strictEqual(getYoutubeStart('https://youtu.be/dQw4w9WgXcQ?t=1h2m3s'), 3723);
    assert.strictEqual(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=2m'), 120);
    assert.strictEqual(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=3h'), 10800);
    assert.strictEqual(getYoutubeStart('https://youtube.com/watch?v=dQw4w9WgXcQ&t=1h30s'), 3630);
  });

  test('handles parameter at different positions', () => {
    assert.strictEqual(getYoutubeStart('https://www.youtube.com/watch?t=45&v=dQw4w9WgXcQ'), 45);
    assert.strictEqual(getYoutubeStart('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45&index=1'), 45);
  });
});
