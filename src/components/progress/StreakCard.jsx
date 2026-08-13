import React from "react";
import styles from "./StreakCard.module.css";

export default function StreakCard({ counters }) {
  const { currentStreak = 0, longestStreak = 0 } = counters || {};

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Consistency Streak</h3>
        <div className={styles.streakFlame}>🔥</div>
      </div>
      <div className={styles.streakRow}>
        <div className={styles.streakColumn}>
          <div className={styles.label}>Current Streak</div>
          <div className={`${styles.value} ${styles.current}`}>{currentStreak} <span className={styles.days}>days</span></div>
        </div>
        <div className={styles.divider}></div>
        <div className={styles.streakColumn}>
          <div className={styles.label}>Longest Streak</div>
          <div className={styles.value}>{longestStreak} <span className={styles.days}>days</span></div>
        </div>
      </div>
    </div>
  );
}
