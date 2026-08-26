import { useState, useEffect } from "react";

export function useBreakTimer(initialDuration = 300) {
  const [breakCountdown, setBreakCountdown] = useState(initialDuration);

  // Countdown timer interval
  useEffect(() => {
    let interval;
    if (breakCountdown > 0) {
      interval = setInterval(() => {
        setBreakCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [breakCountdown]);

  return { breakCountdown, setBreakCountdown };
}
