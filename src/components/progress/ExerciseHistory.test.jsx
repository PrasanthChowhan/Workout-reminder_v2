import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import ExerciseHistory from './ExerciseHistory';

describe('ExerciseHistory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state when exercises is empty', () => {
    render(<ExerciseHistory exercises={[]} />);
    expect(screen.getByText('No recent exercises recorded.')).toBeInTheDocument();
  });

  it('formats valid timestamps correctly', () => {
    const mockToLocaleDateString = vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Oct 27, 10:30 AM');

    const exercises = [
      { exerciseId: 'Pushups', completedAt: '2023-10-27T10:30:00Z' }
    ];
    render(<ExerciseHistory exercises={exercises} />);

    expect(mockToLocaleDateString).toHaveBeenCalledWith(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    expect(screen.getByText('Oct 27, 10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('Pushups')).toBeInTheDocument();
  });

  it('renders "Unknown" for invalid timestamps (catch path)', () => {
    const exercises = [
      { exerciseId: 'Squats', completedAt: 'invalid-date' }
    ];
    // To explicitly test the catch path, we can mock toLocaleDateString to throw
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockImplementation(() => {
      throw new Error('Mock error');
    });

    render(<ExerciseHistory exercises={exercises} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Squats')).toBeInTheDocument();
  });
});
