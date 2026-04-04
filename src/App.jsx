// ─────────────────────────────────────────────────────────
// src/App.jsx — Fully integrated orchestrator
// ─────────────────────────────────────────────────────────
//
// Data flow:
//
//   useRace() ←──→ Socket.io ←──→ Server
//     │                              │
//     ├── screen (state machine)     ├── RaceRoom
//     ├── player (auth)              ├── MongoDB
//     ├── roomPlayers (real-time)    └── Tournament logic
//     ├── liveProgress (per-player)
//     └── standings (final)
//
// ─────────────────────────────────────────────────────────

import React from "react";
import { useRace } from "./hooks/useRace.js";
import { SCREEN } from "./services/contract.js";
import DashboardScreen from "./components/Dashboard.jsx";
import AdminLogin from "./components/AdminLogin.jsx";
import AdminPanel from "./components/AdminPanel.jsx";
import PlayerLogin from "./components/PlayerLogin.jsx";
import LobbyScreen from "./components/Lobby.jsx";
import CountdownScreen from "./components/Countdown.jsx";
import RaceScreen from "./components/Race.jsx";
import ResultsScreen from "./components/Results.jsx";
import { BGDecor } from "./components/UI.jsx";

export default function App() {
  const race = useRace();

  return (
    <div className="font-cairo relative min-h-screen">
      <BGDecor />
      <div className="relative z-10">
        {race.screen === SCREEN.LANDING && (
          <DashboardScreen onSelectMode={race.selectMode} />
        )}

        {race.screen === SCREEN.ADMIN_LOGIN && (
          <AdminLogin
            onSuccess={race.loginAdmin}
            onBack={race.goHome}
          />
        )}

        {race.screen === SCREEN.PLAYER_LOGIN && (
          <PlayerLogin
            onLogin={race.login}
            onBack={race.goHome}
          />
        )}

        {race.screen === SCREEN.ADMIN_PANEL && (
          <AdminPanel
            adminToken={race.adminToken}
            connectedPlayers={race.roomPlayers}
            liveProgress={race.liveProgress}
            onConnectAdmin={race.connectAdmin}
            onStartRace={race.startRace}
            onBack={race.goHome}
          />
        )}

        {race.screen === SCREEN.LOBBY && (
          <LobbyScreen
            player={race.player}
            players={race.roomPlayers}
            onStart={race.setReady}
          />
        )}

        {race.screen === SCREEN.COUNTDOWN && (
          <CountdownScreen
            value={race.countdownValue}
            onComplete={() => {}}
          />
        )}

        {race.screen === SCREEN.RACE && (
          <RaceScreen
            player={race.player}
            text={race.raceText}
            typed={race.typed}
            onChange={race.handleTyping}
            wpm={race.wpm}
            accuracy={race.accuracy}
            progress={race.progress}
            score={race.score}
            elapsed={race.elapsed}
            maxDuration={race.maxDuration}
            liveProgress={race.liveProgress}
            roomPlayers={race.roomPlayers}
          />
        )}

        {race.screen === SCREEN.RESULTS && (
          <ResultsScreen
            player={race.player}
            results={{
              wpm: race.wpm,
              accuracy: race.accuracy,
              score: race.score,
              time: race.elapsed,
              correctChars: race.correctChars,
              totalKeys: race.totalKeys,
            }}
            standings={race.standings}
            onRestart={race.restart}
            onLogout={race.goHome}
          />
        )}

        {/* Connection indicator */}
        {!race.connected && ![SCREEN.LANDING, SCREEN.ADMIN_LOGIN, SCREEN.PLAYER_LOGIN].includes(race.screen) && (
          <div className="fixed top-4 left-4 z-50 bg-rose-500/20 border
                          border-rose-500/30 rounded-xl px-4 py-2 text-sm
                          text-rose-400 animate-pulse">
            ⚠️ جاري إعادة الاتصال...
          </div>
        )}
      </div>
    </div>
  );
}
