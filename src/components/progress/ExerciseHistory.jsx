import React from "react";
import styles from "./ExerciseHistory.module.css";

export default function ExerciseHistory({ exercises }) {
  const formatTimestamp = (ts) => {
    try {
      const date = new Date(ts);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Unknown";
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Recent Exercises</h3>
      <div className={styles.scrollContainer}>
        {Array.isArray(exercises) && exercises.length > 0 ? (
          <ul className={styles.list}>
            {exercises.map((item, index) => (
              <li key={index} className={styles.item}>
                <div className={styles.indicator}></div>
                <div className={styles.content}>
                  <span className={styles.exerciseName}>{item.exerciseId}</span>
                  <span className={styles.time}>{formatTimestamp(item.completedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p>No recent exercises recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
