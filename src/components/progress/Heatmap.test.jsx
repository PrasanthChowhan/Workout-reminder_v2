import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Heatmap from "./Heatmap";

describe("Heatmap", () => {
  const currentYear = 2024;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(currentYear, 5, 15)); // June 15, 2024
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps valid sparse data correctly", () => {
    const data = [
      { date: `${currentYear}-01-05`, count: 3 },
      { date: `${currentYear}-05-20`, count: 8 },
    ];
    render(<Heatmap data={data} />);

    // Check that specific date tiles have correct counts
    const tiles1 = screen.getAllByTitle(`${currentYear}-01-05: 3 activities`);
    expect(tiles1.length).toBeGreaterThan(0);

    const tiles2 = screen.getAllByTitle(`${currentYear}-05-20: 8 activities`);
    expect(tiles2.length).toBeGreaterThan(0);

    // A date without data should have 0 activities
    const tilesEmpty = screen.getAllByTitle(`${currentYear}-02-10: 0 activities`);
    expect(tilesEmpty.length).toBeGreaterThan(0);
  });

  it("handles empty arrays", () => {
    render(<Heatmap data={[]} />);
    const tilesEmpty = screen.getAllByTitle(`${currentYear}-03-15: 0 activities`);
    expect(tilesEmpty.length).toBeGreaterThan(0);
  });

  it("handles null data without crashing", () => {
    render(<Heatmap data={null} />);
    const tilesEmpty = screen.getAllByTitle(`${currentYear}-04-10: 0 activities`);
    expect(tilesEmpty.length).toBeGreaterThan(0);
  });

  it("handles undefined data without crashing", () => {
    render(<Heatmap data={undefined} />);
    const tilesEmpty = screen.getAllByTitle(`${currentYear}-05-12: 0 activities`);
    expect(tilesEmpty.length).toBeGreaterThan(0);
  });

  it("handles non-array object data without crashing", () => {
    render(<Heatmap data={{ "2024-01-01": 5 }} />);
    const tilesEmpty = screen.getAllByTitle(`${currentYear}-01-01: 0 activities`);
    expect(tilesEmpty.length).toBeGreaterThan(0);
  });
});
