import React from "react";
import styles from "./StatCounters.module.css";

export default function StatCounters({ counters }) {
  const { totalSessions = 0, totalNotesRecalled = 0, activeDaysThisYear = 0 } = counters || {};

  return (
    <div className={styles.grid}>
      <div className={styles.card}>
        <div className={styles.valueContainer}>
          <span className={styles.value}>{totalSessions}</span>
          <div className={styles.badge}>Sessions</div>
        </div>
        <div className={styles.label}>Total break sessions completed</div>
      </div>
      
      <div className={styles.card}>
        <div className={styles.valueContainer}>
          <span className={styles.value}>{totalNotesRecalled}</span>
          <div className={styles.badge}>Cards</div>
        </div>
        <div className={styles.label}>Notes recalled in active recall</div>
      </div>

      <div className={styles.card}>
        <div className={styles.valueContainer}>
          <span className={styles.value}>{activeDaysThisYear}</span>
          <div className={styles.badge}>Days</div>
        </div>
        <div className={styles.label}>Active days in this calendar year</div>
      </div>
    </div>
  );
}
