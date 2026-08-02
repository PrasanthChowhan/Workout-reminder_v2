import { useState, useRef, useEffect } from "react";

/**
 * A custom React hook to manage 2-second hold-to-confirm interactions.
 * Cleans up animation frame registrations on unmount to prevent state updates on unmounted elements.
 * 
 * @param {function} onConfirm Callback when hold duration is successfully met.
 * @param {number} [durationMs=2000] Duration threshold in milliseconds.
 * @returns {{holdProgress: number, startHolding: function, cancelHolding: function}}
 */
export function useHoldToConfirm(onConfirm, durationMs = 2000) {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdAnimRef = useRef(null);
  const holdStartRef = useRef(null);

  const startHolding = (e) => {
    // Left-click only for mouse events, ignore other mouse buttons
    if (e && e.button !== undefined && e.button !== 0) return;
    
    holdStartRef.current = Date.now();
    setHoldProgress(0);

    const tick = () => {
      if (!holdStartRef.current) return;
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / durationMs) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        onConfirm();
        cancelHolding();
      } else {
        holdAnimRef.current = requestAnimationFrame(tick);
      }
    };

    holdAnimRef.current = requestAnimationFrame(tick);
  };

  const cancelHolding = () => {
    holdStartRef.current = null;
    if (holdAnimRef.current) {
      cancelAnimationFrame(holdAnimRef.current);
      holdAnimRef.current = null;
    }
    setHoldProgress(0);
  };

  // Perform cleanup of requestAnimationFrame on component unmount
  useEffect(() => {
    return () => {
      if (holdAnimRef.current) {
        cancelAnimationFrame(holdAnimRef.current);
      }
    };
  }, []);

  return { holdProgress, startHolding, cancelHolding };
}
