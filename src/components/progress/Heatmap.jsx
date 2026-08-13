import React, { useMemo } from "react";
import styles from "./Heatmap.module.css";

export default function Heatmap({ data }) {
  // Map sparse backend array to a lookup dictionary
  const activityMap = useMemo(() => {
    const map = {};
    if (Array.isArray(data)) {
      data.forEach((item) => {
        map[item.date] = item.count;
      });
    }
    return map;
  }, [data]);

  // Generate the dates for the current calendar year
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const jan1 = new Date(currentYear, 0, 1); // January 1st of current year

    // Pad back to Sunday so the grid columns align correctly
    const startDate = new Date(jan1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(currentYear, 11, 31); // December 31st
    // Pad forward to Saturday so the last column is full
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const dateVal = String(currentDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${dateVal}`;

      result.push({
        date: dateString,
        dayOfWeek: currentDate.getDay(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        count: activityMap[dateString] || 0,
        isFuture: currentDate > today,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return result;
  }, [activityMap]);

  // Group days into weeks (columns)
  const weeks = useMemo(() => {
    const cols = [];
    let currentWeek = [];
    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });
    return cols;
  }, [days]);

  const getColorClass = (count, isFuture, isOtherYear) => {
    if (isOtherYear) return styles.dayFuture; // dim the Dec 2025 padding cells
    if (isFuture) return styles.dayFuture;
    if (count === 0) return styles.day0;
    if (count <= 2) return styles.day1;
    if (count <= 5) return styles.day2;
    if (count <= 9) return styles.day3;
    return styles.day4;
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const CELL_SIZE = 10; // px
  const CELL_GAP = 3;  // px
  const COL_WIDTH = CELL_SIZE + CELL_GAP;

  // Find which column index corresponds to Jan 1 of the current year
  const currentYear = new Date().getFullYear();
  const jan1ColIndex = useMemo(() => {
    for (let wi = 0; wi < weeks.length; wi++) {
      const week = weeks[wi];
      if (week.some(d => d.year === currentYear && d.month === 0)) return wi;
    }
    return 0;
  }, [weeks, currentYear]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      // Only consider days that belong to the current year
      const firstCurrentYearDay = week.find(d => d.year === currentYear);
      if (!firstCurrentYearDay) return;

      const m = firstCurrentYearDay.month;
      if (m !== lastMonth) {
        // Pixel offset is relative to jan1ColIndex so Jan label is at x=0
        labels.push({
          text: monthNames[m],
          offsetPx: (weekIndex - jan1ColIndex) * COL_WIDTH,
        });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks, jan1ColIndex, currentYear]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Activity Heatmap — {currentYear}</h3>
      <div className={styles.scrollWrapper}>
        <div className={styles.heatmapGrid}>
          <div className={styles.monthsRow}>
            <div className={styles.dayLabelSpacer}></div>
            <div className={styles.monthsContainer}>
              {monthLabels.map((label, i) => (
                <span
                  key={i}
                  className={styles.monthLabel}
                  style={{ left: `${label.offsetPx}px` }}
                >
                  {label.text}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.gridAndLabels}>
            <div className={styles.dayLabels}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <span key={d} className={styles.dayLabelRow}>
                  {d === "Mon" || d === "Wed" || d === "Fri" ? d : ""}
                </span>
              ))}
            </div>

            <div className={styles.weeksContainer}>
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className={styles.weekColumn}>
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      className={`${styles.daySquare} ${getColorClass(day.count, day.isFuture, day.year !== currentYear)}`}
                      title={day.year === currentYear ? `${day.date}: ${day.count} activities` : ""}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.legend}>
        <span>Less</span>
        <div className={`${styles.legendSquare} ${styles.day0}`}></div>
        <div className={`${styles.legendSquare} ${styles.day1}`}></div>
        <div className={`${styles.legendSquare} ${styles.day2}`}></div>
        <div className={`${styles.legendSquare} ${styles.day3}`}></div>
        <div className={`${styles.legendSquare} ${styles.day4}`}></div>
        <span>More</span>
      </div>
    </div>
  );
}
