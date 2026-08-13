import React, { useEffect, useState } from "react";
import { invoke } from "../utils/tauri";
import Heatmap from "../components/progress/Heatmap";
import StatCounters from "../components/progress/StatCounters";
import StreakCard from "../components/progress/StreakCard";
import FSRSBreakdown from "../components/progress/FSRSBreakdown";
import ExerciseHistory from "../components/progress/ExerciseHistory";
import HabitHistory from "../components/progress/HabitHistory";
import styles from "./Progress.module.css";

export default function Progress() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await invoke("get_statistics");
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load statistics:", err);
      setError("Failed to load progress data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Computing statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchStats}>Retry</button>
      </div>
    );
  }

  const { counters, heatmap, fsrsBreakdown, recentExercises, recentCheckins } = stats || {};

  // Check if user has zero activities recorded
  const hasNoActivity = !counters || (
    counters.totalSessions === 0 &&
    counters.totalNotesRecalled === 0 &&
    (!recentExercises || recentExercises.length === 0) &&
    (!recentCheckins || recentCheckins.length === 0)
  );

  if (hasNoActivity) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIllustration}>📊</div>
        <h2 className={styles.emptyTitle}>Build Your Habits</h2>
        <p className={styles.emptyText}>
          Your daily heatmap, recall consistency streaks, and exercise history will appear here once you complete break sessions.
        </p>
        <div className={styles.emptyTip}>
          💡 Tip: Stretches and active recall questions occur when you click "Done Session" during breaks.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>Consistency Tracker</h2>
        <p className={styles.subtitle}>Track your physical resets and active recall progress.</p>
      </header>

      <div className={styles.grid}>
        {/* Top summary cards */}
        <div className={styles.topRow}>
          <div className={styles.statBox}>
            <StatCounters counters={counters} />
          </div>
          <div className={styles.streakBox}>
            <StreakCard counters={counters} />
          </div>
        </div>

        {/* Heatmap takes full width */}
        <div className={styles.heatmapBox}>
          <Heatmap data={heatmap} />
        </div>

        {/* FSRS Breakdown and History side-by-side */}
        <div className={styles.bottomRow}>
          <div className={styles.halfBox}>
            <FSRSBreakdown breakdown={fsrsBreakdown} />
          </div>
          <div className={styles.halfBox}>
            <ExerciseHistory exercises={recentExercises} />
          </div>
          <div className={styles.halfBox}>
            <HabitHistory checkins={recentCheckins} />
          </div>
        </div>
      </div>
    </div>
  );
}
