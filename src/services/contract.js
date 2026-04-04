// ─────────────────────────────────────────────────────────
// shared/contract.js — Single source of truth for
// frontend ↔ backend communication
// ─────────────────────────────────────────────────────────

// ── API Base ──
const query = new URLSearchParams(window.location.search);
const savedApiOrigin = localStorage.getItem("typingRaceApiOrigin");
const configuredApiOrigin = query.get("api") || savedApiOrigin;
const DEFAULT_PRODUCTION_API_ORIGIN = "https://typing-race-backend-buvz.onrender.com";
const API_ORIGIN = configuredApiOrigin || (window.location.hostname === "localhost"
  ? "http://localhost:3001"
  : DEFAULT_PRODUCTION_API_ORIGIN);
if (query.get("api")) localStorage.setItem("typingRaceApiOrigin", query.get("api"));

export const API_BASE = `${API_ORIGIN}/api`;
export const SOCKET_URL = `${API_ORIGIN}/race`;

// ── REST Endpoints ──
export const API = {
  HEALTH:           `${API_BASE}/health`,
  AUTH_LOGIN:       `${API_BASE}/auth/login`,
  PLAYERS:          `${API_BASE}/players`,
  PLAYER:           (id) => `${API_BASE}/players/${id}`,
  RESULTS:          `${API_BASE}/results`,
  MY_RESULTS:       `${API_BASE}/results/me`,
  PLAYER_RESULTS:   (id) => `${API_BASE}/results/player/${id}`,
  LEADERBOARD:      `${API_BASE}/leaderboard`,
  LEADERBOARD_RECENT: `${API_BASE}/leaderboard/recent`,
  PLAYER_RANK:      (id) => `${API_BASE}/leaderboard/player/${id}/rank`,
  TOURNAMENTS:      `${API_BASE}/tournaments`,
  TOURNAMENT:       (id) => `${API_BASE}/tournaments/${id}`,
  TOURNAMENT_ROUND: (id) => `${API_BASE}/tournaments/${id}/current-round`,
};

// ── Socket Events (Client → Server) ──
export const EMIT = {
  JOIN_ROOM:       "join_room",
  LEAVE_ROOM:      "leave_room",
  PLAYER_READY:    "player_ready",
  PLAYER_PROGRESS: "player_progress",
  PLAYER_FINISH:   "player_finish",
};

// ── Socket Events (Server → Client) ──
export const ON = {
  ROOM_JOINED:         "room_joined",
  ROOM_UPDATE:         "room_update",
  PLAYER_LEFT:         "player_left",
  PLAYER_READY:        "player_ready",
  ALL_READY:           "all_ready",
  COUNTDOWN_TICK:      "countdown_tick",
  RACE_START:          "race_start",
  PLAYER_PROGRESS:     "player_progress",
  PLAYER_FINISH:       "player_finish",
  RACE_END:            "race_end",
  ERROR:               "error",
};

// ── Screen States ──
export const SCREEN = {
  DASHBOARD: "dashboard",
  LOBBY:     "lobby",
  COUNTDOWN: "countdown",
  RACE:      "race",
  RESULTS:   "results",
};
