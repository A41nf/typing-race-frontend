// ─────────────────────────────────────────────────────────
// utils/score.js — WPM, accuracy, progress, score
// ─────────────────────────────────────────────────────────

const CHARS_PER_WORD = 5;

/**
 * Words Per Minute
 * Standard formula: (correctChars / 5) / minutes
 */
export function calcWPM(correctChars, elapsedSeconds) {
  if (elapsedSeconds <= 0) return 0;
  const words = correctChars / CHARS_PER_WORD;
  const minutes = elapsedSeconds / 60;
  return Math.round(words / minutes);
}

/**
 * Accuracy percentage
 * correct / total keystrokes * 100
 */
export function calcAccuracy(correctChars, totalKeystrokes) {
  if (totalKeystrokes <= 0) return 100;
  return Math.round((correctChars / totalKeystrokes) * 100);
}

/**
 * Progress percentage 0–100
 */
export function calcProgress(typedLength, targetLength) {
  if (targetLength <= 0) return 0;
  return Math.min(Math.round((typedLength / targetLength) * 100), 100);
}

/**
 * Composite score
 * WPM × accuracy weight × 10
 */
export function calcScore(wpm, accuracy) {
  return Math.round(wpm * (accuracy / 100) * 10);
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
