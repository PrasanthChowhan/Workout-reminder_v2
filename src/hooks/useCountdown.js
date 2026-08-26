import { useState, useEffect } from "react";

export function useCountdown(initialValue) {
  const [countdown, setCountdown] = useState(initialValue);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => {
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
  }, [countdown]);

  return [countdown, setCountdown];
}
