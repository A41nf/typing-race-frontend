// ─────────────────────────────────────────────────────────
// components/Race.jsx — Server-synced race with live leaderboard
// ─────────────────────────────────────────────────────────

import React, { useRef, useEffect, useMemo } from "react";
import { StatCard, ProgressBar } from "./UI.jsx";

// ── Icons (inline) ──
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const KeyboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="M7 16h10" />
  </svg>
);
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RaceScreen({
  player,
  text,
  typed,
  onChange,
  wpm,
  accuracy,
  progress,
  score,
  elapsed,
  maxDuration,
  liveProgress,
  roomPlayers,
}) {
  const inputRef = useRef(null);
  const currentId = player.id || player.playerId;

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Remaining time
  const remaining = Math.max(0, maxDuration - elapsed);
  const isFinished = typed.length >= text.length;

  // Build char map for display
  const charMap = useMemo(() => {
    const chars = [];
    for (let i = 0; i < text.length; i++) {
      if (i < typed.length) {
        chars.push({
          char: text[i],
          status: typed[i] === text[i] ? "correct" : "wrong",
        });
      } else if (i === typed.length) {
        chars.push({ char: text[i], status: "current" });
      } else {
        chars.push({ char: text[i], status: "pending" });
      }
    }
    return chars;
  }, [text, typed]);

  // Build leaderboard from liveProgress + roomPlayers
  const leaderboard = useMemo(() => {
    const entries = roomPlayers.map((p) => {
      if (p.playerId === currentId) {
        return { ...p, progress, wpm, isMe: true };
      }
      const lp = liveProgress[p.playerId] || {};
      return {
        ...p,
        progress: lp.progress || 0,
        wpm: lp.wpm || 0,
        isMe: false,
      };
    });
    return entries.sort((a, b) => b.progress - a.progress);
  }, [roomPlayers, liveProgress, currentId, progress, wpm]);

  return (
    <div className="min-h-screen flex flex-col p-3 md:p-6 screen-enter">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 glass rounded-xl px-4 py-2">
          <ClockIcon />
          <span className={`text-lg font-bold font-mono tabular-nums
            ${remaining < 15 ? "text-rose-400 animate-pulse" : "text-white"}`}>
            {formatTime(remaining)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{player.avatar}</span>
          <span className="text-sm font-semibold text-white/80">{player.name}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <StatCard icon={<ZapIcon />} label="كلمة/دقيقة" value={wpm} color="brand" />
        <StatCard icon={<TargetIcon />} label="الدقة" value={`${accuracy}%`} color="emerald" />
        <StatCard icon={<StarIcon />} label="النتيجة" value={score} color="gold" />
        <StatCard icon={<KeyboardIcon />} label="التقدم" value={`${progress}%`} color="rose" />
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-4">
        {/* Text + Input */}
        <div className="flex-1 flex flex-col">
          {/* Character display */}
          <div className="glass-strong rounded-2xl p-5 md:p-6 mb-3 flex-1
                          min-h-[180px] max-h-[280px] overflow-y-auto">
            <div className="text-xl md:text-2xl leading-[2.2] font-medium
                            tracking-wide text-right selection:bg-brand-500/30">
              {charMap.map((c, i) => (
                <span
                  key={i}
                  className={`transition-colors duration-100
                    ${c.status === "correct" ? "char-correct" : ""}
                    ${c.status === "wrong"   ? "char-wrong"   : ""}
                    ${c.status === "current" ? "char-current" : ""}
                    ${c.status === "pending" ? "char-pending" : ""}`}
                >
                  {c.char}
                </span>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="glass-strong rounded-2xl p-1 mb-3 animate-glow"
               style={{ animationPlayState: isFinished ? "paused" : "running" }}>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => onChange(e.target.value)}
              disabled={isFinished}
              placeholder="ابدأ الكتابة هنا..."
              className="race-input w-full bg-transparent rounded-xl py-4 px-5
                         text-lg text-white placeholder:text-white/20
                         disabled:opacity-50"
              dir="rtl"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          <ProgressBar
            value={typed.length}
            max={text.length}
            label={`${typed.length} / ${text.length} حرف`}
          />
        </div>

        {/* Desktop leaderboard (live from server) */}
        <div className="hidden md:block w-56 glass-strong rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gold-400"><TrophyIcon /></span>
            <span className="text-sm font-bold text-white/70">الترتيب المباشر</span>
          </div>
          <div className="space-y-2">
            {leaderboard.map((p, i) => (
              <div key={p.playerId}
                className={`flex items-center gap-2 p-2 rounded-lg
                  transition-all duration-300
                  ${p.isMe ? "bg-brand-500/15" : "bg-white/[0.03]"}`}>
                <span className={`text-xs font-bold w-5 text-center
                  ${i === 0 ? "text-gold-400" : i === 1 ? "text-slate-300"
                   : i === 2 ? "text-amber-600" : "text-white/30"}`}>
                  {i + 1}
                </span>
                <span className="text-base">{p.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">
                    {p.name?.split(" ")[0]}
                  </p>
                  <div className="h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500
                      ${p.isMe ? "bg-brand-400" : "bg-white/20"}`}
                      style={{ width: `${p.progress}%` }} />
                  </div>
                </div>
                <span className="text-[10px] text-white/30 font-mono">
                  {Math.round(p.progress)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile leaderboard */}
      <div className="md:hidden mt-3 glass-strong rounded-2xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3.5 h-3.5 text-gold-400"><TrophyIcon /></span>
          <span className="text-xs font-bold text-white/60">الترتيب</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {leaderboard.map((p, i) => (
            <div key={p.playerId}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg
                text-xs whitespace-nowrap
                ${p.isMe ? "bg-brand-500/15 text-brand-300"
                         : "bg-white/5 text-white/50"}`}>
              <span className={`font-bold ${i === 0 ? "text-gold-400" : ""}`}>
                {i + 1}
              </span>
              <span>{p.avatar}</span>
              <span>{p.name?.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Finished overlay */}
      {isFinished && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm
                        flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center animate-bounce-in">
            <div className="text-6xl mb-4">🏁</div>
            <h2 className="text-3xl font-bold text-white mb-2">أحسنت!</h2>
            <p className="text-white/50">في انتظار باقي اللاعبين...</p>
          </div>
        </div>
      )}
    </div>
  );
}
