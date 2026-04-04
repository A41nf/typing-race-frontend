// ─────────────────────────────────────────────────────────
// components/Results.jsx — Final standings from server
// ─────────────────────────────────────────────────────────

import React from "react";
import { SchoolHeader, StatCard } from "./UI.jsx";

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
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const MEDALS = ["🥇", "🥈", "🥉"];

export default function ResultsScreen({
  player,
  results,
  standings,
  onRestart,
  onLogout,
}) {
  const currentId = player.id || player.playerId;
  const myRank = standings.findIndex((s) => s.playerId === currentId) + 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 screen-enter">
      <div className="w-full max-w-lg">
        <SchoolHeader subtitle="النتائج النهائية" />

        {/* My result */}
        <div className="glass-strong rounded-3xl p-6 mb-4 animate-bounce-in">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">
              {myRank > 0 && myRank <= 3 ? MEDALS[myRank - 1] : "🎯"}
            </div>
            <h2 className="text-2xl font-bold text-white">{player.name}</h2>
            <p className="text-sm text-white/40 mt-1">
              {myRank === 1
                ? "🎉 مبروك! المركز الأول"
                : myRank > 0
                ? `المركز ${myRank} من ${standings.length}`
                : "أحسنت!"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <StatCard icon={<ZapIcon />} label="كلمة في الدقيقة"
                      value={results.wpm} color="brand" />
            <StatCard icon={<TargetIcon />} label="الدقة"
                      value={`${results.accuracy}%`} color="emerald" />
            <StatCard icon={<StarIcon />} label="النتيجة"
                      value={results.score} color="gold" />
            <StatCard icon={<ClockIcon />} label="الوقت"
                      value={`${Math.round(results.time)}ث`} color="rose" />
          </div>

          {/* Performance bar */}
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>الأداء</span>
              <span>{results.wpm} كلمة/دقيقة</span>
            </div>
            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-l from-emerald-400
                              to-brand-400 rounded-full transition-all
                              duration-1000 progress-glow"
                style={{ width: `${Math.min((results.wpm / 60) * 100, 100)}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-white/20 mt-1">
              <span>0</span><span>30</span><span>60+</span>
            </div>
          </div>
        </div>

        {/* Full leaderboard (from server standings) */}
        <div className="glass-strong rounded-2xl p-4 mb-4 animate-slide-up"
             style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gold-400"><TrophyIcon /></span>
            <span className="text-sm font-bold text-white/70">الترتيب النهائي</span>
          </div>
          <div className="space-y-2">
            {standings.map((s, i) => {
              const isMe = s.playerId === currentId;
              return (
                <div key={s.playerId}
                  className={`flex items-center gap-3 p-3 rounded-xl
                    transition-all duration-300
                    ${isMe
                      ? "bg-brand-500/15 border border-brand-500/20"
                      : "bg-white/[0.03]"}
                    ${i < 3 ? "animate-slide-up" : ""}`}
                  style={{ animationDelay: `${300 + i * 100}ms` }}>

                  <span className={`text-xl font-black w-8 text-center
                    ${i === 0 ? "text-gold-400 medal-gold"
                     : i === 1 ? "text-slate-300 medal-silver"
                     : i === 2 ? "text-amber-600 medal-bronze"
                     : "text-white/30"}`}>
                    {i < 3 ? MEDALS[i] : i + 1}
                  </span>

                  <span className="text-xl">{s.avatar}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {s.name}
                      {isMe && <span className="text-brand-400 text-xs mr-1">(أنت)</span>}
                    </p>
                    <p className="text-xs text-white/30">{s.school}</p>
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-bold text-white">{s.stats?.score || s.score || 0}</p>
                    <p className="text-[10px] text-white/30" dir="ltr">
                      {s.stats?.wpm || s.wpm || 0} WPM · {s.stats?.accuracy || s.accuracy || 0}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "800ms" }}>
          <button onClick={onRestart}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-l
                       from-brand-500 to-brand-600 hover:from-brand-400
                       hover:to-brand-500 text-white font-bold
                       transition-all duration-200 shadow-lg
                       shadow-brand-500/20 active:scale-[0.98]
                       flex items-center justify-center gap-2">
            <RefreshIcon /> سباق جديد
          </button>
          <button onClick={onLogout}
            className="py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10
                       border border-white/10 text-white/60 hover:text-white
                       font-bold transition-all duration-200 active:scale-[0.98]">
            خروج
          </button>
        </div>
      </div>
    </div>
  );
}
