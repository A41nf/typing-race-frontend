import { useState, useCallback, useRef, useEffect } from "react";
import { useSocket } from "./useSocket.js";
import { EMIT, ON, SCREEN } from "../services/contract.js";

export function useRace() {
  const [screen, setScreen] = useState(SCREEN.LANDING);
  const [mode, setMode] = useState(null);
  const [adminToken, setAdminToken] = useState("");
  const [player, setPlayer] = useState(null);
  const [authHeaders, setAuthHeaders] = useState(null);

  const [roomId, setRoomId] = useState(null);
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

  const { connected, connect, disconnect, emit, on } = useSocket();

  const typedRef = useRef("");
  const correctRef = useRef(0);
  const totalKeysRef = useRef(0);
  const startTimeRef = useRef(null);

  const selectMode = useCallback((nextMode) => {
    setMode(nextMode);
    setScreen(nextMode === "admin" ? SCREEN.ADMIN_LOGIN : SCREEN.PLAYER_LOGIN);
  }, []);

  const goHome = useCallback(() => {
    disconnect();
    setMode(null);
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
            finished: true,
            ...data.stats,
          },
        }));
      })
    );

    cleanups.push(
      on(ON.RACE_END, (data) => {
        setStandings(data.standings || []);
        setRaceResults(data);
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
    emit(EMIT.ADMIN_START_RACE, { adminToken }, () => {});
  }, [emit, adminToken]);

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
        typed: typedRef.current,
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
    restart,
    connected,
  };
}
