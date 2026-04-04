// ─────────────────────────────────────────────────────────
// src/services/api.js — REST API client
// ─────────────────────────────────────────────────────────

import { API } from "./contract.js";

/**
 * Thin fetch wrapper with JSON + error handling.
 */
async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.message || "حدث خطأ", data.error, res.status);
  }

  return data;
}

class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ── Auth ──

export async function login(playerId, pin) {
  return request(API.AUTH_LOGIN, {
    method: "POST",
    body: JSON.stringify({ id: playerId, pin }),
  });
}

// ── Players ──

export async function getPlayers() {
  return request(API.PLAYERS);
}

export async function getPlayer(id) {
  return request(API.PLAYER(id));
}

export async function updatePlayer(id, playerData, adminToken) {
  return request(API.PLAYER(id), {
    method: "PATCH",
    headers: {
      "X-Admin-Token": adminToken,
    },
    body: JSON.stringify(playerData),
  });
}

// ── Results ──

export async function submitResult(resultData, headers) {
  return request(API.RESULTS, {
    method: "POST",
    headers: {
      "X-Player-Id": headers.playerId,
      "X-Player-Pin": headers.playerPin,
    },
    body: JSON.stringify(resultData),
  });
}

export async function getMyResults(headers) {
  return request(API.MY_RESULTS, {
    headers: {
      "X-Player-Id": headers.playerId,
      "X-Player-Pin": headers.playerPin,
    },
  });
}

// ── Leaderboard ──

export async function getLeaderboard(sort = "score", limit = 20) {
  return request(`${API.LEADERBOARD}?sort=${sort}&limit=${limit}`);
}

export async function getPlayerRank(playerId) {
  return request(API.PLAYER_RANK(playerId));
}

// ── Tournament ──

export async function getTournament(id) {
  return request(API.TOURNAMENT(id));
}

export async function getCurrentRound(tournamentId) {
  return request(API.TOURNAMENT_ROUND(tournamentId));
}
