// ─────────────────────────────────────────────────────────
// components/Dashboard.jsx — Login via API
// ─────────────────────────────────────────────────────────

import React, { useState } from "react";
import { SchoolHeader } from "./UI.jsx";
import { login as apiLogin } from "../services/api.js";

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

// Quick-login presets
const QUICK_LOGIN = [
  { id: "P001", pin: "1234", name: "أحمد محمد",   avatar: "🧑‍🎓" },
  { id: "P002", pin: "5678", name: "سارة علي",     avatar: "👩‍🎓" },
  { id: "P003", pin: "9012", name: "يوسف حسن",     avatar: "🧑‍🎓" },
  { id: "P004", pin: "3456", name: "مريم خالد",    avatar: "👩‍🎓" },
  { id: "P005", pin: "7890", name: "عمر سعيد",     avatar: "🧑‍🎓" },
  { id: "P006", pin: "2468", name: "نور الدين",    avatar: "👩‍🎓" },
];

export default function DashboardScreen({ onLogin }) {
  const [playerId, setPlayerId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin(playerId.trim(), pin);
      // data = { success, player, headers }
      onLogin(data.player, data.headers);
    } catch (err) {
      setError(err.message || "خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (preset) => {
    setPlayerId(preset.id);
    setPin(preset.pin);
    setLoading(true);

    try {
      const data = await apiLogin(preset.id, preset.pin);
      onLogin(data.player, data.headers);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 screen-enter">
      <div className="w-full max-w-md">
        <SchoolHeader subtitle="إعداد: أ. نصره الراشدية" />

        <div className="glass-strong rounded-3xl p-8 animate-bounce-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20
                            flex items-center justify-center text-brand-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" className="w-5 h-5">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M7 16h10" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">سباق الكتابة</h2>
              <p className="text-xs text-white/40">سجل دخولك للمشاركة</p>
            </div>
          </div>

          {/* Player ID */}
          <div className="mb-4">
            <label className="block text-sm text-white/60 mb-2 font-medium">
              رقم اللاعب
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2
                              text-white/30"><UserIcon /></span>
              <input
                type="text"
                value={playerId}
                onChange={(e) => {
                  setPlayerId(e.target.value.toUpperCase());
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="مثال: P001"
                className="w-full bg-white/5 border border-white/10 rounded-xl
                           py-3 pr-10 pl-4 text-white placeholder:text-white/25
                           focus:border-brand-500/50 focus:bg-white/8
                           transition-all duration-200"
                dir="ltr"
              />
            </div>
          </div>

          {/* PIN */}
          <div className="mb-6">
            <label className="block text-sm text-white/60 mb-2 font-medium">
              الرمز السري
            </label>
            <div className="relative">
              <span className="absolute right-3 top-1/2 -translate-y-1/2
                              text-white/30"><LockIcon /></span>
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="****"
                maxLength={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl
                           py-3 pr-10 pl-4 text-white placeholder:text-white/25
                           focus:border-brand-500/50 focus:bg-white/8
                           transition-all duration-200 text-lg tracking-widest"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border
                            border-rose-500/20 text-rose-400 text-sm
                            text-center animate-fade-in">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={!playerId || !pin || loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-l
                       from-brand-500 to-brand-600 hover:from-brand-400
                       hover:to-brand-500 disabled:from-brand-500/30
                       disabled:to-brand-600/30 disabled:cursor-not-allowed
                       text-white font-bold transition-all duration-200
                       shadow-lg shadow-brand-500/20 hover:shadow-brand-500/30
                       active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white
                              rounded-full animate-spin" />
            ) : (
              <><PlayIcon /> دخول</>
            )}
          </button>
        </div>

        {/* Quick Login */}
        <div className="mt-6 glass rounded-2xl p-4">
          <p className="text-xs text-white/30 text-center mb-3">
            دخول سريع (للاختبار)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_LOGIN.map((p) => (
              <button
                key={p.id}
                onClick={() => quickLogin(p)}
                disabled={loading}
                className="flex flex-col items-center gap-1 p-2 rounded-xl
                           bg-white/5 hover:bg-white/10 border border-white/5
                           hover:border-white/10 transition-all duration-200
                           active:scale-95 disabled:opacity-50"
              >
                <span className="text-xl">{p.avatar}</span>
                <span className="text-xs text-white/60 font-medium truncate
                                 w-full text-center">
                  {p.name.split(" ")[0]}
                </span>
                <span className="text-[10px] text-white/25" dir="ltr">{p.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
