import { describe, it, expect } from 'vitest';
import { formatTime } from './time';

describe('formatTime', () => {
  // Happy paths
  it('formats exactly 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats less than a minute correctly', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(59)).toBe('00:59');
  });

  it('formats exactly one minute as "01:00"', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats multiple minutes and seconds correctly', () => {
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats exactly one hour (3600 seconds) as "60:00"', () => {
    expect(formatTime(3600)).toBe('60:00');
  });

  it('formats times longer than an hour correctly', () => {
    expect(formatTime(3665)).toBe('61:05');
  });

  // Edge cases and error conditions
  it('returns "00:00" for negative numbers', () => {
    expect(formatTime(-1)).toBe('00:00');
    expect(formatTime(-60)).toBe('00:00');
  });

  it('returns "00:00" for non-number inputs', () => {
    expect(formatTime('60')).toBe('00:00');
    expect(formatTime(null)).toBe('00:00');
    expect(formatTime(undefined)).toBe('00:00');
    expect(formatTime({})).toBe('00:00');
    expect(formatTime([])).toBe('00:00');
  });

  it('returns "00:00" for NaN', () => {
    expect(formatTime(NaN)).toBe('00:00');
  });
});
