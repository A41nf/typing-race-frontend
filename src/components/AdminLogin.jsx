import React, { useState } from "react";
import { SchoolHeader } from "./UI.jsx";
import { adminLogin } from "../services/api.js";

export default function AdminLogin({ onSuccess, onBack }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const data = await adminLogin(password);
      onSuccess(data.token);
    } catch (err) {
      setError(err.message || "تعذر تسجيل دخول المشرف");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 screen-enter">
      <div className="w-full max-w-md">
        <SchoolHeader subtitle="دخول المشرف" />

        <div className="glass-strong rounded-3xl p-8">
          <label className="mb-2 block text-sm font-medium text-white/60">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
            placeholder="أدخل كلمة مرور المشرف"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-brand-500/50"
          />

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!password || loading}
              className="flex-1 rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "جاري التحقق..." : "دخول"}
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
