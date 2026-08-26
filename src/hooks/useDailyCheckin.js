import { useState, useEffect } from "react";
import { invoke } from "../utils/tauri";

export function useDailyCheckin() {
  const [dailyCheckin, setDailyCheckin] = useState({
    enabled: false,
    answeredToday: false,
    question: ""
  });

  const checkDailyQuestion = async () => {
    try {
      const status = await invoke("check_daily_question_status");
      setDailyCheckin(status);
    } catch (e) {
      console.error("Failed to check daily question status", e);
    }
  };

  useEffect(() => {
    const handleFocus = () => {
      checkDailyQuestion();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, []);

  return { dailyCheckin, setDailyCheckin, checkDailyQuestion };
}
