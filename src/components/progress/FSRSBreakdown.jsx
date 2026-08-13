import React from "react";
import styles from "./FSRSBreakdown.module.css";

export default function FSRSBreakdown({ breakdown }) {
  const { again = 0, hard = 0, good = 0, easy = 0 } = breakdown || {};
  const total = again + hard + good + easy;

  const grades = [
    { label: "Again", count: again, color: "#ffb4ab" },
    { label: "Hard", count: hard, color: "#ff7a45" },
    { label: "Good", count: good, color: "#ffb59a" },
    { label: "Easy", count: easy, color: "#00e639" },
  ];

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>FSRS Review Distribution</h3>
      <div className={styles.list}>
        {grades.map((grade) => {
          const percentage = total > 0 ? (grade.count / total) * 100 : 0;
          return (
            <div key={grade.label} className={styles.row}>
              <div className={styles.info}>
                <span className={styles.label}>{grade.label}</span>
                <span className={styles.count} style={{ color: grade.color }}>
                  {grade.count} <span className={styles.pct}>({percentage.toFixed(0)}%)</span>
                </span>
              </div>
              <div className={styles.barBg}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: grade.color,
                    boxShadow: `0 0 6px ${grade.color}44`,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
