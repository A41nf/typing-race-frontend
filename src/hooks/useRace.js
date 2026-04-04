// ─────────────────────────────────────────────────────────
// src/hooks/useRace.js — Race flow state machine (client)
// ─────────────────────────────────────────────────────────
//
// Manages the full race lifecycle on the client:
//   Dashboard → Lobby → Countdown → Race → Results
//
// Connects to Socket.io for real-time sync.
// ─────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "./useSocket.js";
import { EMIT, ON, SCREEN } from "../services/contract.js";

export function useRace() {
  // ── Screen state ──
  const [screen, setScreen] = useState(SCREEN.DASHBOARD);
  const [player, setPlayer] = useState(null);
  const [authHeaders, setAuthHeaders] = useState(null);

  // ── Room state ──
  const [roomId, setRoomId] = useState(null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [roomStatus, setRoomStatus] = useState("waiting");

  // ── Race state ──
  const [raceText, setRaceText] = useState("");
  const [raceTextId, setRaceTextId] = useState(null);
  const [maxDuration, setMaxDuration] = useState(120);
  const [startedAt, setStartedAt] = useState(null);
  const [countdownValue, setCountdownValue] = useState(null);

  // ── Live progress from other players ──
  const [liveProgress, setLiveProgress] = useState({});

  // ── Results ──
  const [raceResults, setRaceResults] = useState(null);
  const [standings, setStandings] = useState([]);

  // ── Socket ──
  const { connected, connect, disconnect, emit, on } = useSocket();

  // ── Typing state (refs to avoid stale closures in socket handlers) ──
  const typedRef = useRef("");
  const correctRef = useRef(0);
  const totalKeysRef = useRef(0);
  const startTimeRef = useRef(null);

  // ══════════════════════════════════════════════════════════
  //  1. LOGIN
  // ══════════════════════════════════════════════════════════

  const login = useCallback((playerData, headers) => {
    setPlayer(playerData);
    setAuthHeaders(headers);
    setScreen(SCREEN.LOBBY);
  }, []);

  // ══════════════════════════════════════════════════════════
  //  2. JOIN LOBBY
  // ══════════════════════════════════════════════════════════

  const joinLobby = useCallback(
    (targetRoomId = null) => {
      if (!player) return;

      // Connect socket
      const socket = connect();

      // Wait for connection then join
      const doJoin = () => {
        emit(
          EMIT.JOIN_ROOM,
          {
            playerId: player.id || player.playerId,
            playerName: player.name,
            school: player.school,
            avatar: player.avatar,
            roomId: targetRoomId,
          },
          (ack) => {
            if (ack?.error) {
              console.error("Join error:", ack.message);
              return;
            }
            console.log("✅ Joined room:", ack.roomId);
            setRoomId(ack.roomId);
            setRoomPlayers(ack.players || []);
            setRoomStatus(ack.status || "waiting");
          }
        );
      };

      if (socket.connected) {
        doJoin();
      } else {
        socket.once("connect", doJoin);
      }

      setScreen(SCREEN.LOBBY);
    },
    [player, connect, emit]
  );

  // ══════════════════════════════════════════════════════════
  //  3. SOCKET EVENT SUBSCRIPTIONS
  // ══════════════════════════════════════════════════════════

  useEffect(() => {
    if (!connected) return;

    const cleanups = [];

    // Room update (players joined/left/ready)
    cleanups.push(
      on(ON.ROOM_UPDATE, (data) => {
        setRoomPlayers(data.players || []);
        setRoomStatus(data.status);
      })
    );

    // Player ready
    cleanups.push(
      on(ON.PLAYER_READY, (data) => {
        setRoomPlayers(data.players || []);
      })
    );

    // All ready → transition to countdown screen
    cleanups.push(
      on(ON.ALL_READY, (_data) => {
        console.log("🏁 All ready!");
        setScreen(SCREEN.COUNTDOWN);
      })
    );

    // Countdown tick
    cleanups.push(
      on(ON.COUNTDOWN_TICK, (data) => {
        setCountdownValue(data.value);
      })
    );

    // Race start
    cleanups.push(
      on(ON.RACE_START, (data) => {
        console.log("🚀 Race started!");
        setRaceText(data.text);
        setRaceTextId(data.textId);
        setMaxDuration(data.maxDuration);
        setStartedAt(data.startedAt);
        setRoomPlayers(data.players || []);
        setScreen(SCREEN.RACE);

        // Reset typing state
        typedRef.current = "";
        correctRef.current = 0;
        totalKeysRef.current = 0;
        startTimeRef.current = null;
        setLiveProgress({});
      })
    );

    // Live progress from others
    cleanups.push(
      on(ON.PLAYER_PROGRESS, (data) => {
        setLiveProgress((prev) => ({
          ...prev,
          [data.playerId]: {
            progress: data.progress,
            wpm: data.wpm,
            accuracy: data.accuracy,
            score: data.score,
            finished: data.finished,
          },
        }));
      })
    );

    // Player finished
    cleanups.push(
      on(ON.PLAYER_FINISH, (data) => {
        setLiveProgress((prev) => ({
          ...prev,
          [data.playerId]: {
            ...(prev[data.playerId] || {}),
            finished: true,
            ...data.stats,
          },
        }));
      })
    );

    // Race end
    cleanups.push(
      on(ON.RACE_END, (data) => {
        console.log("🏁 Race ended!");
        setStandings(data.standings || []);
        setRaceResults(data);
        setScreen(SCREEN.RESULTS);
      })
    );

    // Player left
    cleanups.push(
      on(ON.PLAYER_LEFT, (data) => {
        setRoomPlayers(data.players || []);
      })
    );

    // Errors
    cleanups.push(
      on(ON.ERROR, (data) => {
        console.error("Socket error:", data.message);
      })
    );

    return () => cleanups.forEach((fn) => fn());
  }, [connected, on]);

  // ══════════════════════════════════════════════════════════
  //  4. PLAYER ACTIONS
  // ══════════════════════════════════════════════════════════

  const setReady = useCallback(() => {
    emit(EMIT.PLAYER_READY, {}, (ack) => {
      if (ack?.error) console.error("Ready error:", ack.message);
    });
  }, [emit]);

  // ══════════════════════════════════════════════════════════
  //  5. TYPING ENGINE (server-synced)
  // ══════════════════════════════════════════════════════════

  const handleTyping = useCallback(
    (newTyped) => {
      if (!raceText) return;

      const prevLen = typedRef.current.length;
      const newLen = newTyped.length;

      // Start timer on first keypress
      if (!startTimeRef.current && newLen > 0) {
        startTimeRef.current = Date.now();
      }

      // Determine what happened
      if (newLen > prevLen) {
        // Forward: new character(s)
        const newChar = newTyped[newLen - 1];
        totalKeysRef.current++;

        if (newChar === raceText[newLen - 1]) {
          correctRef.current++;
        }

        typedRef.current = newTyped;
      } else if (newLen < prevLen) {
        // Backspace
        typedRef.current = newTyped;
      }

      // Calculate elapsed
      const elapsed = startTimeRef.current
        ? (Date.now() - startTimeRef.current) / 1000
        : 0;

      // Emit progress to server
      emit(EMIT.PLAYER_PROGRESS, {
        typed: typedRef.current,
        correctChars: correctRef.current,
        totalKeystrokes: totalKeysRef.current,
        elapsed,
      });

      // Check if finished
      if (typedRef.current.length >= raceText.length) {
        const wpm =
          elapsed > 0
            ? Math.round((correctRef.current / 5 / elapsed) * 60)
            : 0;
        const accuracy =
          totalKeysRef.current > 0
            ? Math.round((correctRef.current / totalKeysRef.current) * 100)
            : 100;
        const score = Math.round(wpm * (accuracy / 100) * 10);

        emit(EMIT.PLAYER_FINISH, {
          wpm,
          accuracy,
          score,
          time: elapsed,
          correctChars: correctRef.current,
          totalKeystrokes: totalKeysRef.current,
        });
      }
    },
    [raceText, emit]
  );

  // ══════════════════════════════════════════════════════════
  //  6. COMPUTED VALUES
  // ══════════════════════════════════════════════════════════

  const typed = typedRef.current;
  const elapsed = startTimeRef.current
    ? (Date.now() - startTimeRef.current) / 1000
    : 0;
  const correctChars = correctRef.current;
  const totalKeys = totalKeysRef.current;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5 / elapsed) * 60) : 0;
  const accuracy =
    totalKeys > 0 ? Math.round((correctChars / totalKeys) * 100) : 100;
  const progress = raceText
    ? Math.min(Math.round((typed.length / raceText.length) * 100), 100)
    : 0;
  const score = Math.round(wpm * (accuracy / 100) * 10);

  // ══════════════════════════════════════════════════════════
  //  7. RESTART
  // ══════════════════════════════════════════════════════════

  const restart = useCallback(() => {
    setRaceText("");
    setRaceTextId(null);
    setRaceResults(null);
    setStandings([]);
    setLiveProgress({});
    setCountdownValue(null);
    typedRef.current = "";
    correctRef.current = 0;
    totalKeysRef.current = 0;
    startTimeRef.current = null;

    // Rejoin lobby
    joinLobby(roomId);
  }, [roomId, joinLobby]);

  const logout = useCallback(() => {
    disconnect();
    setPlayer(null);
    setAuthHeaders(null);
    setRoomId(null);
    setRoomPlayers([]);
    setScreen(SCREEN.DASHBOARD);
  }, [disconnect]);

  // ══════════════════════════════════════════════════════════
  //  RETURN
  // ══════════════════════════════════════════════════════════

  return {
    // Screen
    screen,

    // Auth
    player,
    authHeaders,
    login,
    logout,

    // Room
    roomId,
    roomPlayers,
    roomStatus,
    joinLobby,
    setReady,

    // Race
    raceText,
    raceTextId,
    maxDuration,
    startedAt,
    countdownValue,

    // Typing
    typed,
    handleTyping,
    wpm,
    accuracy,
    progress,
    score,
    elapsed,
    correctChars,
    totalKeys,

    // Live (other players)
    liveProgress,

    // Results
    raceResults,
    standings,
    restart,

    // Connection
    connected,
  };
}
