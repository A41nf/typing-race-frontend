// ─────────────────────────────────────────────────────────
// components/UI.jsx — Shared presentational components
// ─────────────────────────────────────────────────────────

import React from "react";

// ── Stat Card ──
const COLOR_MAP = {
  brand:   "from-brand-500/15 to-brand-600/5 border-brand-500/20 text-brand-400",
  emerald: "from-emerald-500/15 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
  gold:    "from-gold-500/15 to-gold-600/5 border-gold-500/20 text-gold-400",
  rose:    "from-rose-500/15 to-rose-600/5 border-rose-500/20 text-rose-400",
};

export function StatCard({ icon, label, value, color = "brand", className = "" }) {
  return (
    <div className={`bg-gradient-to-br ${COLOR_MAP[color]} border rounded-2xl p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-4 h-4 opacity-70">{icon}</span>
        <span className="text-xs text-white/50 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

// ── School Branding Header ──
export function SchoolHeader({ subtitle }) {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                      bg-gradient-to-br from-brand-500/20 to-brand-700/20
                      border border-brand-500/20 mb-4">
        <span className="text-3xl">🏫</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r
                     from-white via-white to-white/70 bg-clip-text text-transparent
                     leading-relaxed">
        مدرسة شمس المعارف للتعليم الأساسي
      </h1>
      <p className="text-white/40 text-sm mt-1 font-light">(1 - 4)</p>
      {subtitle && (
        <p className="text-brand-400 text-sm mt-2 font-medium">{subtitle}</p>
      )}
    </div>
  );
}

// ── Progress Bar ──
export function ProgressBar({ value, max = 100, label, showLabel = true }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="glass rounded-xl p-3">
      {showLabel && (
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>{label || "التقدم"}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-l from-brand-500 to-brand-400
                     rounded-full transition-all duration-300 progress-glow"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Background decoration ──
export function BGDecor() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-600/10
                      rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-500/8
                      rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.02]">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
