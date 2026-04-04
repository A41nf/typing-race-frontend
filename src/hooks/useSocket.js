// ─────────────────────────────────────────────────────────
// src/hooks/useSocket.js — Socket.io client hook
// ─────────────────────────────────────────────────────────
//
// Manages:
//   - Connection lifecycle
//   - Room join/leave
//   - All event subscriptions
//   - Auto-cleanup on unmount
//
// Returns: { connected, connect, disconnect, emit, on }
// ─────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL, EMIT, ON } from "../services/contract.js";

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // ── Connect ──
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return socketRef.current;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("🔌 Socket error:", err.message);
    });

    socketRef.current = socket;
    return socket;
  }, []);

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
    }
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  // ── Generic emit (with optional ack callback) ──
  const emit = useCallback((event, data, ack) => {
    if (!socketRef.current?.connected) {
      console.warn("Socket not connected, cannot emit:", event);
      return;
    }
    if (ack) {
      socketRef.current.emit(event, data, ack);
    } else {
      socketRef.current.emit(event, data);
    }
  }, []);

  // ── Subscribe to event ──
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  // ── Unsubscribe from event ──
  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  return {
    socket: socketRef,
    connected,
    connect,
    disconnect,
    emit,
    on,
    off,
  };
}
