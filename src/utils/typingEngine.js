// ─────────────────────────────────────────────────────────
// utils/typingEngine.js — Character-level validation engine
// ─────────────────────────────────────────────────────────

/**
 * Core typing engine state for a single race.
 *
 * Rules enforced:
 *   1. No skipping — user cannot advance past a wrong character.
 *   2. Every keystroke is compared 1:1 against targetText.
 *   3. Backspace is allowed to correct mistakes before moving on.
 *
 * Character states returned per index:
 *   "pending"  — not yet reached
 *   "correct"  — matches target
 *   "wrong"    — does not match target
 *   "current"  — cursor position (next char to type)
 */

/**
 * Build the per-character status array from typed vs target.
 *
 * @param {string} typed       — what the user has typed so far
 * @param {string} targetText  — the race text
 * @returns {{ chars: Array<{ char: string, status: string }>, cursorIndex: number, correctCount: number, wrongCount: number }}
 */
export function buildCharMap(typed, targetText) {
  const chars = [];
  let correctCount = 0;
  let wrongCount = 0;

  for (let i = 0; i < targetText.length; i++) {
    const target = targetText[i];

    if (i < typed.length) {
      if (typed[i] === target) {
        chars.push({ char: target, status: "correct" });
        correctCount++;
      } else {
        chars.push({ char: target, status: "wrong" });
        wrongCount++;
      }
    } else if (i === typed.length) {
      chars.push({ char: target, status: "current" });
    } else {
      chars.push({ char: target, status: "pending" });
    }
  }

  return { chars, cursorIndex: typed.length, correctCount, wrongCount };
}

/**
 * Validate whether the user is allowed to type the next character.
 * Enforces the no-skip rule: the immediately preceding character
 * must be correct before the user can advance.
 *
 * @param {string} typed      — current typed string
 * @param {string} targetText — the race text
 * @returns {{ allowed: boolean, reason: string }}
 */
export function validateNextChar(typed, targetText) {
  // Race complete
  if (typed.length >= targetText.length) {
    return { allowed: false, reason: "complete" };
  }

  // First character — always allowed
  if (typed.length === 0) {
    return { allowed: true, reason: "first" };
  }

  // Check previous character
  const prevIndex = typed.length - 1;
  if (typed[prevIndex] !== targetText[prevIndex]) {
    return { allowed: false, reason: "previous_wrong" };
  }

  return { allowed: true, reason: "ok" };
}

/**
 * Process a keypress and return the new typed string.
 * Enforces no-skip: blocks forward movement if previous char is wrong.
 * Backspace is always allowed.
 *
 * @param {string} currentTyped — current typed string
 * @param {string} key          — the key pressed
 * @param {string} targetText   — the race text
 * @returns {{ nextTyped: string, blocked: boolean, event: string }}
 */
export function processKeypress(currentTyped, key, targetText) {
  // Backspace — always allowed, go back one character
  if (key === "Backspace" || key === "⌫") {
    if (currentTyped.length === 0) {
      return { nextTyped: currentTyped, blocked: false, event: "noop" };
    }
    return {
      nextTyped: currentTyped.slice(0, -1),
      blocked: false,
      event: "backspace",
    };
  }

  // Ignore non-printable keys
  if (key.length !== 1) {
    return { nextTyped: currentTyped, blocked: false, event: "ignored" };
  }

  // Check if race is complete
  if (currentTyped.length >= targetText.length) {
    return { nextTyped: currentTyped, blocked: false, event: "complete" };
  }

  // No-skip check: previous char must be correct
  if (currentTyped.length > 0) {
    const prevIndex = currentTyped.length - 1;
    if (currentTyped[prevIndex] !== targetText[prevIndex]) {
      // Only backspace can fix this — block forward typing
      return { nextTyped: currentTyped, blocked: true, event: "blocked" };
    }
  }

  // Accept the character
  const nextTyped = currentTyped + key;
  const isCorrect = key === targetText[currentTyped.length];

  return {
    nextTyped,
    blocked: false,
    event: isCorrect ? "correct" : "wrong",
  };
}
