// ─────────────────────────────────────────────────────────
// components/Countdown.jsx — Server-driven countdown
// ─────────────────────────────────────────────────────────
//
// Receives `value` from server via useRace hook.
// When value changes to "إبدأ!", shows go animation.
// Transitions to Race screen automatically via race_start event.
// ─────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";

export default function CountdownScreen({ value }) {
  const [displayValue, setDisplayValue] = useState(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (value === null) return;

    // Trigger re-animation on new value
    setKey((k) => k + 1);

    if (value === "3" || value === "2" || value === "1") {
      setDisplayValue({ type: "number", value });
    } else {
      // "إبدأ!" or similar
      setDisplayValue({ type: "go", value });
    }
  }, [value]);

  if (!displayValue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
        <p className="text-white/20 animate-pulse">جاري التحضير...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
      <div className="text-center">
        {/* Pulsing rings */}
        <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2
                          border-brand-500/10 animate-ping"
               style={{ animationDuration: "2s" }} />
          <div className="absolute inset-4 rounded-full border
                          border-brand-500/5" />
          <div className="absolute inset-8 rounded-full border
                          border-brand-500/5" />

          {displayValue.type === "number" && (
            <div key={key} className="count-number animate-count-pop">
              {displayValue.value}
            </div>
          )}

          {displayValue.type === "go" && (
            <div key={key} className="animate-count-pop">
              <div className="text-5xl md:text-6xl font-black
                              bg-gradient-to-r from-emerald-400 to-brand-400
                              bg-clip-text text-transparent animate-bounce-in">
                {displayValue.value}
              </div>
            </div>
          )}
        </div>

        <p className="text-white/20 text-sm mt-4 animate-pulse">استعد...</p>
      </div>
    </div>
  );
}
