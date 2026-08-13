import React from "react";
import styles from "./ExerciseHistory.module.css";

export default function HabitHistory({ checkins }) {
  const formatTimestamp = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Daily Check-ins</h3>
      <div className={styles.scrollContainer}>
        {Array.isArray(checkins) && checkins.length > 0 ? (
          <ul className={styles.list}>
            {checkins.map((item, index) => {
              const isYes = item.response?.toLowerCase() === "yes";
              return (
                <li key={index} className={styles.item}>
                  <div 
                    className={styles.indicator} 
                    style={{ 
                      backgroundColor: isYes ? "#10B981" : "#EF4444", 
                      boxShadow: isYes ? "0 0 6px #10B981" : "0 0 6px #EF4444" 
                    }}
                  ></div>
                  <div className={styles.content}>
                    <span className={styles.exerciseName}>
                      Answered {item.response?.toUpperCase()}
                    </span>
                    <span className={styles.time}>{formatTimestamp(item.localDate)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className={styles.empty}>
            <p>No check-in history recorded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
