// ─────────────────────────────────────────────────────────
// components/Lobby.jsx — Real-time player list from Socket
// ─────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import { SchoolHeader } from "./UI.jsx";

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
       strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default function LobbyScreen({ player, players, onStart }) {
  const [myReady, setMyReady] = useState(false);

  const currentId = player.id || player.playerId;

  // Check if we're already ready (from re-render)
  const meInList = players.find(
    (p) => p.playerId === currentId
  );
  const isReady = myReady || (meInList?.ready ?? false);
  const allReady = players.length >= 2 && players.every((p) => p.ready);

  const handleReady = () => {
    setMyReady(true);
    onStart(); // calls race.setReady() → emits to server
  };

  // Screen transitions to COUNTDOWN automatically via useRace
  // when server emits race_start (skipping countdown screen if we prefer)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 screen-enter">
      <div className="w-full max-w-lg">
        <SchoolHeader subtitle="قاعة الانتظار" />

        <div className="glass-strong rounded-3xl p-6 animate-bounce-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20
                              flex items-center justify-center text-emerald-400">
                <UsersIcon />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">اللاعبون</h2>
                <p className="text-xs text-white/40">{players.length} مشارك</p>
              </div>
            </div>

            {allReady && (
              <div className="text-sm font-bold text-brand-300 animate-fade-in">
                بانتظار بدء المشرف
              </div>
            )}
          </div>

          {/* Player rows (from server via Socket) */}
          <div className="space-y-2 mb-6">
            {players.map((p, i) => {
              const isMe = p.playerId === currentId;

              return (
                <div
                  key={p.socketId || p.playerId}
                  className={`flex items-center gap-3 p-3 rounded-xl border
                    transition-all duration-300
                    ${isMe
                      ? "bg-brand-500/10 border-brand-500/20"
                      : "bg-white/[0.03] border-white/5"}
                    ${p.ready ? "animate-fade-in" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="text-2xl">{p.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {p.name}
                      {isMe && (
                        <span className="text-brand-400 text-xs mr-2">(أنت)</span>
                      )}
                    </p>
                    <p className="text-xs text-white/30">{p.playerId}</p>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg
                    text-xs font-bold transition-all duration-300
                    ${p.ready
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/5 text-white/30 border border-white/5"}`}
                  >
                    {p.ready && <CheckIcon />}
                    {p.ready ? "جاهز" : "ينتظر..."}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ready button */}
          {!isReady && players.length >= 2 && (
            <button
              onClick={handleReady}
              className="w-full py-3.5 rounded-xl bg-gradient-to-l
                         from-emerald-500 to-emerald-600 hover:from-emerald-400
                         hover:to-emerald-500 text-white font-bold
                         transition-all duration-200 shadow-lg
                         shadow-emerald-500/20 active:scale-[0.98]
                         flex items-center justify-center gap-2 animate-slide-up"
            >
              <CheckIcon /> أنا جاهز!
            </button>
          )}

          {isReady && !allReady && (
            <div className="text-center text-emerald-400 text-sm
                            font-medium animate-pulse">
              ⏳ في انتظار باقي اللاعبين...
            </div>
          )}

          {isReady && allReady && (
            <div className="text-center text-brand-300 text-sm font-medium animate-pulse">
              ⏳ الجميع جاهز، بانتظار المشرف لبدء العد التنازلي...
            </div>
          )}

          {players.length < 2 && (
            <div className="text-center text-white/30 text-sm">
              ⏳ في انتظار لاعبين آخرين...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
