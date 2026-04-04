import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "./useSocket.js";
import { EMIT, ON, SCREEN } from "../services/contract.js";

const STORAGE_KEY = "typing_race_session";

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useRace() {
  const [screen, setScreen] = useState(() => {
    const s = loadSession();
    if (!s?.mode) return SCREEN.LANDING;
    // Player mid-race screens → restore to lobby on refresh
    if (s.mode === "player" && [SCREEN.COUNTDOWN, SCREEN.RACE, SCREEN.RESULTS].includes(s.screen)) {
      return SCREEN.LOBBY;
    }
    return s.screen || SCREEN.LANDING;
  });
  const [mode, setMode] = useState(() => loadSession()?.mode || null);
  const [adminToken, setAdminToken] = useState(() => loadSession()?.adminToken || "");
  const [player, setPlayer] = useState(() => loadSession()?.player || null);
  const [authHeaders, setAuthHeaders] = useState(() => loadSession()?.authHeaders || null);

  const [roomId, setRoomId] = useState(() => loadSession()?.roomId || null);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [roomStatus, setRoomStatus] = useState("waiting");

  const [raceText, setRaceText] = useState("");
  const [raceTextId, setRaceTextId] = useState(null);
  const [maxDuration, setMaxDuration] = useState(120);
  const [startedAt, setStartedAt] = useState(null);
  const [countdownValue, setCountdownValue] = useState(null);

  const [liveProgress, setLiveProgress] = useState({});
  const [raceResults, setRaceResults] = useState(null);
  const [standings, setStandings] = useState([]);
  const [adminStandings, setAdminStandings] = useState([]);
  const [raceActive, setRaceActive] = useState(false);

  const { connected, connect, disconnect, emit, on } = useSocket();

  // Persist session to localStorage so refresh restores the correct page
  useEffect(() => {
    if (!mode) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, screen, adminToken, player, authHeaders, roomId }));
    } catch {
      // ignore storage quota errors
    }
  }, [mode, screen, adminToken, player, authHeaders, roomId]);

  const typedRef = useRef("");
  const correctRef = useRef(0);
  const totalKeysRef = useRef(0);
  const startTimeRef = useRef(null);

  const selectMode = useCallback((nextMode) => {
    setMode(nextMode);
    setScreen(nextMode === "admin" ? SCREEN.ADMIN_LOGIN : SCREEN.PLAYER_LOGIN);
  }, []);

  const goHome = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    disconnect();
    setMode(null);
    setRaceActive(false);
    setAdminToken("");
    setPlayer(null);
    setAuthHeaders(null);
    setRoomId(null);
    setRoomPlayers([]);
    setRoomStatus("waiting");
    setRaceText("");
    setRaceTextId(null);
    setMaxDuration(120);
    setStartedAt(null);
    setCountdownValue(null);
    setLiveProgress({});
    setRaceResults(null);
    setStandings([]);
    setAdminStandings([]);
    typedRef.current = "";
    correctRef.current = 0;
    totalKeysRef.current = 0;
    startTimeRef.current = null;
    setScreen(SCREEN.LANDING);
  }, [disconnect]);

  const login = useCallback((playerData, headers) => {
    setMode("player");
    setPlayer(playerData);
    setAuthHeaders(headers);
    setScreen(SCREEN.LOBBY);
  }, []);

  const loginAdmin = useCallback((token) => {
    setMode("admin");
    setAdminToken(token);
    setScreen(SCREEN.ADMIN_PANEL);
  }, []);

  const joinLobby = useCallback(
    (targetRoomId = null) => {
      if (!player) return;

      const socket = connect();
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
            if (ack?.error) return;
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

  const connectAdmin = useCallback(() => {
    if (!adminToken) return;

    const socket = connect();
    const doConnect = () => {
      emit(EMIT.ADMIN_CONNECT, { token: adminToken }, (ack) => {
        if (ack?.error) return;
        setRoomId(ack.roomId || null);
        setRoomPlayers(ack.players || []);
        setRoomStatus(ack.status || "waiting");
        setLiveProgress({});
        setAdminStandings([]);
      });
    };

    if (socket.connected) {
      doConnect();
    } else {
      socket.once("connect", doConnect);
    }
  }, [adminToken, connect, emit]);

  useEffect(() => {
    if (mode === "player" && player) {
      joinLobby(roomId);
    }
  }, [mode, player]);

  // Restore admin socket connection on refresh
  useEffect(() => {
    if (mode === "admin" && adminToken) {
      connectAdmin();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!connected) return;

    const cleanups = [];

    cleanups.push(
      on(ON.ROOM_UPDATE, (data) => {
        setRoomPlayers(data.players || []);
        setRoomStatus(data.status || "waiting");
      })
    );

    cleanups.push(
      on(ON.PLAYER_READY, (data) => {
        setRoomPlayers(data.players || []);
      })
    );

    cleanups.push(
      on(ON.ADMIN_PLAYER_JOINED, (data) => {
        setRoomPlayers(data.players || []);
        setRoomStatus(data.status || "waiting");
      })
    );

    cleanups.push(
      on(ON.ADMIN_PLAYER_READY, (data) => {
        setRoomPlayers(data.players || []);
        setRoomStatus(data.status || "waiting");
      })
    );

    cleanups.push(
      on(ON.ALL_READY, () => {
        if (mode === "player") {
          setScreen(SCREEN.LOBBY);
        }
      })
    );

    cleanups.push(
      on(ON.COUNTDOWN_TICK, (data) => {
        setCountdownValue(data.value);
        if (mode === "player") {
          setScreen(SCREEN.COUNTDOWN);
        }
      })
    );

    cleanups.push(
      on(ON.RACE_START, (data) => {
        setRaceText(data.text);
        setRaceTextId(data.textId);
        setMaxDuration(data.maxDuration);
        setStartedAt(data.startedAt);
        setRoomPlayers(data.players || []);

        typedRef.current = "";
        correctRef.current = 0;
        totalKeysRef.current = 0;
        startTimeRef.current = null;
        setLiveProgress({});
        setAdminStandings([]);
        setRaceActive(true);

        if (mode === "player") {
          setScreen(SCREEN.RACE);
        }
      })
    );

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

    cleanups.push(
      on(ON.PLAYER_FINISH, (data) => {
        setLiveProgress((prev) => ({
          ...prev,
          [data.playerId]: {
            ...(prev[data.playerId] || {}),
            progress: 100,
            wpm: data.stats?.wpm ?? prev[data.playerId]?.wpm ?? 0,
            accuracy: data.stats?.accuracy ?? prev[data.playerId]?.accuracy ?? 0,
            score: data.stats?.score ?? prev[data.playerId]?.score ?? 0,
            finished: true,
          },
        }));
      })
    );

    cleanups.push(
      on(ON.RACE_END, (data) => {
        setStandings(data.standings || []);
        setAdminStandings(data.standings || []);
        setRaceResults(data);
        setRaceActive(false);
        if (mode === "player") {
          setScreen(SCREEN.RESULTS);
        }
      })
    );

    cleanups.push(
      on(ON.PLAYER_LEFT, (data) => {
        setRoomPlayers(data.players || []);
      })
    );

    cleanups.push(on(ON.ERROR, () => {}));

    return () => cleanups.forEach((fn) => fn());
  }, [connected, on, mode]);

  const setReady = useCallback(() => {
    emit(EMIT.PLAYER_READY, {}, () => {});
  }, [emit]);

  const startRace = useCallback(() => {
    setAdminStandings([]);
    setLiveProgress({});
    emit(EMIT.ADMIN_START_RACE, { adminToken }, () => {});
  }, [emit, adminToken]);

  const newRace = useCallback(() => {
    setAdminStandings([]);
    setLiveProgress({});
  }, []);

  const handleTyping = useCallback(
    (newTyped) => {
      if (!raceText) return;

      const prevLen = typedRef.current.length;
      const newLen = newTyped.length;

      if (!startTimeRef.current && newLen > 0) {
        startTimeRef.current = Date.now();
      }

      if (newLen > prevLen) {
        const newChar = newTyped[newLen - 1];
        totalKeysRef.current += 1;
        if (newChar === raceText[newLen - 1]) {
          correctRef.current += 1;
        }
        typedRef.current = newTyped;
      } else if (newLen < prevLen) {
        typedRef.current = newTyped;
      }

      const elapsed = startTimeRef.current
        ? (Date.now() - startTimeRef.current) / 1000
        : 0;

      emit(EMIT.PLAYER_PROGRESS, {
        typed: typedRef.current.length,
        correctChars: correctRef.current,
        totalKeystrokes: totalKeysRef.current,
        elapsed,
      });

      if (typedRef.current.length >= raceText.length) {
        const wpm =
          elapsed > 0 ? Math.round((correctRef.current / 5 / elapsed) * 60) : 0;
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

  const typed = typedRef.current;
  const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
  const correctChars = correctRef.current;
  const totalKeys = totalKeysRef.current;
  const wpm = elapsed > 0 ? Math.round((correctChars / 5 / elapsed) * 60) : 0;
  const accuracy = totalKeys > 0 ? Math.round((correctChars / totalKeys) * 100) : 100;
  const progress = raceText
    ? Math.min(Math.round((typed.length / raceText.length) * 100), 100)
    : 0;
  const score = Math.round(wpm * (accuracy / 100) * 10);

  const restart = useCallback(() => {
    setRaceText("");
    setRaceTextId(null);
    setRaceResults(null);
    setStandings([]);
    setAdminStandings([]);
    setLiveProgress({});
    setCountdownValue(null);
    typedRef.current = "";
    correctRef.current = 0;
    totalKeysRef.current = 0;
    startTimeRef.current = null;
    joinLobby(roomId);
  }, [roomId, joinLobby]);

  return {
    screen,
    mode,
    adminToken,
    player,
    authHeaders,
    login,
    loginAdmin,
    goHome,
    selectMode,
    roomId,
    roomPlayers,
    roomStatus,
    joinLobby,
    connectAdmin,
    setReady,
    startRace,
    raceText,
    raceTextId,
    maxDuration,
    startedAt,
    countdownValue,
    typed,
    handleTyping,
    wpm,
    accuracy,
    progress,
    score,
    elapsed,
    correctChars,
    totalKeys,
    liveProgress,
    raceResults,
    standings,
    adminStandings,
    raceActive,
    newRace,
    restart,
    connected,
  };
}
