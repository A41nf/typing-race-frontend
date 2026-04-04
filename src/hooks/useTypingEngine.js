// ─────────────────────────────────────────────────────────
// hooks/useTypingEngine.js — Core race typing hook
// ─────────────────────────────────────────────────────────
//
// State design:
// ┌─────────────────────────────────────────────────────────┐
// │  typed: string          — what the user has typed       │
// │  charMap: Array         — per-char status (correct/     │
// │                           wrong/current/pending)        │
// │  totalKeystrokes: int   — every forward keypress        │
// │  correctChars: int      — chars matching target          │
// │  wrongChars: int        — chars not matching target      │
// │  isBlocked: bool        — true when prev char is wrong  │
// │  isComplete: bool       — typed === targetText           │
// │  wpm: float             — live words-per-minute         │
// │  accuracy: float        — correct / total keystrokes    │
// │  progress: float        — 0–100%                        │
// └─────────────────────────────────────────────────────────┘
//
// Flow:
//   1. User types → processKeypress (enforces no-skip)
//   2. State updates → buildCharMap rebuilds per-char view
//   3. Metrics recalculated (WPM, accuracy, progress)
//   4. Components re-render from derived state
// ─────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from "react";
import { buildCharMap, processKeypress } from "../utils/typingEngine";
import { calcWPM, calcAccuracy, calcProgress, calcScore } from "../utils/score";

/**
 * @param {string} targetText — the text to type
 * @param {number} elapsed    — seconds from useTimer
 * @returns {object} typing state + handler
 */
export function useTypingEngine(targetText, elapsed) {
  const [typed, setTyped] = useState("");
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // ── Derived: character map ──
  const charMap = useMemo(
    () => buildCharMap(typed, targetText),
    [typed, targetText]
  );

  // ── Derived: metrics ──
  const correctChars = charMap.correctCount;
  const wrongChars = charMap.wrongCount;
  const isComplete = typed.length >= targetText.length;
  const wpm = calcWPM(correctChars, elapsed);
  const accuracy = calcAccuracy(correctChars, totalKeystrokes);
  const progress = calcProgress(typed.length, targetText.length);
  const score = calcScore(wpm, accuracy);

  // ── Key handler ──
  const handleKey = useCallback(
    (key) => {
      if (isComplete) return;

      const result = processKeypress(typed, key, targetText);

      // Blocked by no-skip rule
      if (result.blocked) {
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 300);
        return;
      }

      // Backspace
      if (result.event === "backspace") {
        setTyped(result.nextTyped);
        return;
      }

      // Forward character
      if (result.event === "correct" || result.event === "wrong") {
        setTyped(result.nextTyped);
        setTotalKeystrokes((prev) => prev + 1);
      }
    },
    [typed, targetText, isComplete]
  );

  // ── React to synthetic keydown events (for <input>) ──
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Backspace") {
        e.preventDefault(); // we handle it ourselves
        handleKey("Backspace");
      }
    },
    [handleKey]
  );

  // ── React to onChange (for <input>) ──
  const handleChange = useCallback(
    (e) => {
      const newValue = e.target.value;

      // Backspace detected via shorter string
      if (newValue.length < typed.length) {
        handleKey("Backspace");
        return;
      }

      // New character(s) — only process the last one added
      if (newValue.length > typed.length) {
        const newChar = newValue[newValue.length - 1];
        handleKey(newChar);
      }
    },
    [typed, handleKey]
  );

  // ── Reset ──
  const reset = useCallback(() => {
    setTyped("");
    setTotalKeystrokes(0);
    setIsBlocked(false);
  }, []);

  return {
    // State
    typed,
    charMap: charMap.chars,
    correctChars,
    wrongChars,
    totalKeystrokes,
    isBlocked,
    isComplete,

    // Metrics
    wpm,
    accuracy,
    progress,
    score,

    // Handlers
    handleKey,
    handleKeyDown,
    handleChange,
    reset,
  };
}
