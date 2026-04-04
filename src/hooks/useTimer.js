// ─────────────────────────────────────────────────────────
// hooks/useTimer.js — Elapsed-time counter with start/stop/reset
// ─────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Manages a high-resolution elapsed-time counter.
 *
 * @param {number} maxSeconds — hard cap; timer stops when reached
 * @returns {{
 *   elapsed: number,       // seconds (float)
 *   remaining: number,     // seconds left until maxSeconds
 *   isRunning: boolean,
 *   isExpired: boolean,
 *   start: () => void,
 *   stop: () => void,
 *   reset: () => void
 * }}
 */
export function useTimer(maxSeconds = 120) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    const secs = (now - startTimeRef.current) / 1000;

    if (secs >= maxSeconds) {
      setElapsed(maxSeconds);
      setIsRunning(false);
      cancelAnimationFrame(rafRef.current);
      return;
    }

    setElapsed(secs);
    rafRef.current = requestAnimationFrame(tick);
  }, [maxSeconds]);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = Date.now() - elapsed * 1000;
    setIsRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [isRunning, elapsed, tick]);

  const stop = useCallback(() => {
    setIsRunning(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    setElapsed(0);
    setIsRunning(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return {
    elapsed,
    remaining: Math.max(0, maxSeconds - elapsed),
    isRunning,
    isExpired: elapsed >= maxSeconds,
    start,
    stop,
    reset,
  };
}
