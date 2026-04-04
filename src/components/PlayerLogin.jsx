import React, { useState } from "react";
import { SchoolHeader } from "./UI.jsx";
import { login as apiLogin } from "../services/api.js";

export default function PlayerLogin({ onLogin, onBack }) {
  const [playerId, setPlayerId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setLoading(true);
    setError("");

    try {
      const data = await apiLogin(playerId.trim(), pin);
      onLogin(data.player, data.headers);
    } catch (err) {
      setError(err.message || "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 screen-enter">
      <div className="w-full max-w-md">
        <SchoolHeader subtitle="دخول اللاعب" />

        <div className="glass-strong rounded-3xl p-8">
          <label className="mb-2 block text-sm font-medium text-white/60">
            رقم اللاعب
          </label>
          <input
            type="text"
            value={playerId}
            onChange={(event) => {
              setPlayerId(event.target.value.toUpperCase());
              setError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleLogin()}
            placeholder="مثال: P001"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-brand-500/50"
            dir="ltr"
          />

          <label className="mb-2 mt-4 block text-sm font-medium text-white/60">
            الرمز السري
          </label>
          <input
            type="password"
            value={pin}
            onChange={(event) => {
              setPin(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleLogin()}
            placeholder="****"
            maxLength={4}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-lg tracking-widest text-white placeholder:text-white/25 focus:border-brand-500/50"
            dir="ltr"
          />

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleLogin}
              disabled={!playerId || !pin || loading}
              className="flex-1 rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "جاري الدخول..." : "دخول"}
            </button>
            <button
              onClick={onBack}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white/80"
            >
              رجوع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
