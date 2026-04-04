import React from "react";
import { SchoolHeader } from "./UI.jsx";

function EntryCard({ title, description, icon, colorClasses, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`glass-strong w-full rounded-3xl border p-6 text-right transition-all duration-200 hover:-translate-y-1 hover:bg-white/10 ${colorClasses}`}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="text-4xl">{icon}</div>
        <div className="rounded-2xl bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
          دخول
        </div>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">{title}</h2>
      <p className="text-sm leading-7 text-white/55">{description}</p>
    </button>
  );
}

export default function DashboardScreen({ onSelectMode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 screen-enter">
      <div className="w-full max-w-5xl">
        <SchoolHeader subtitle="إعداد: أ. نصره الراشدية" />

        <div className="grid gap-5 md:grid-cols-2">
          <EntryCard
            title="دخول المشرف"
            description="إعداد اللاعبين، متابعة المتصلين مباشرة، وبدء العد التنازلي عند الجاهزية."
            icon="🛡️"
            colorClasses="border-brand-500/20"
            onClick={() => onSelectMode("admin")}
          />

          <EntryCard
            title="دخول اللاعب"
            description="تسجيل الدخول برقم اللاعب والرمز السري ثم الانتظار في اللوبي حتى يبدأ السباق."
            icon="⌨️"
            colorClasses="border-emerald-500/20"
            onClick={() => onSelectMode("player")}
          />
        </div>
      </div>
    </div>
  );
}
