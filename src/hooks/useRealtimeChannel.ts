"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeConfig } from "@/lib/live-session";

/* ════════════════════════════════════════════════════════════════════
   REALTIME KANAL — ikki tomonlama broadcast (Ustoz pulti).

   `useLiveNudge` bilan bir protokol (Phoenix, `@supabase/supabase-js`
   siz), farqi — bu yerda xabar MAʼLUMOT tashiydi va mijoz oʻzi ham
   yuboradi: telefon buyruq beradi, Doska holat eʼlon qiladi.

   `self: false` — yuborgan oʻz xabarini qaytib olmaydi. Kanal ommaviy
   (`private: false`), himoya — mavzuning tasodifiyligi (128 bit) va u
   faqat imzolangan chipta orqali berilishi.

   Uzilsa — eksponensial qayta ulanish (30 s gacha). `connected`
   chaqiruvchiga «ulanmoqda…» holatini koʻrsatish uchun.
   ════════════════════════════════════════════════════════════════════ */

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

export function useRealtimeChannel(
  topic: string | null,
  config: RealtimeConfig | null,
  /** `reply` — shu kanalga javob yuborish (masalan, ulanganda holatni eʼlon qilish). */
  onMessage: (event: string, payload: unknown, reply: (event: string, payload: unknown) => boolean) => void,
): { connected: boolean; send: (event: string, payload: unknown) => boolean } {
  const [connected, setConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  });
  const sendRef = useRef<(event: string, payload: unknown) => boolean>(() => false);

  const base = config?.url;
  const key = config?.key;

  useEffect(() => {
    if (!topic || !base || !key) return;

    const url = `${base.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`;
    const channel = `realtime:${topic}`;
    let socket: WebSocket | null = null;
    let joined = false;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let backoff = 1000;
    let ref = 0;
    let closed = false;

    const raw = (msg: Record<string, unknown>) => {
      if (socket?.readyState !== WebSocket.OPEN) return false;
      socket.send(JSON.stringify({ ...msg, ref: String(++ref) }));
      return true;
    };

    sendRef.current = (event, payload) =>
      joined && raw({ topic: channel, event: "broadcast", join_ref: "1", payload: { type: "broadcast", event, payload } });

    const connect = () => {
      socket = new WebSocket(url);
      socket.onopen = () => {
        raw({
          topic: channel,
          event: "phx_join",
          join_ref: "1",
          payload: {
            config: { broadcast: { self: false, ack: false }, presence: { key: "" }, postgres_changes: [], private: false },
            access_token: key,
          },
        });
        heartbeat = setInterval(() => raw({ topic: "phoenix", event: "heartbeat", payload: {} }), HEARTBEAT_MS);
      };
      socket.onmessage = (e) => {
        let msg: { topic?: string; event?: string; payload?: { status?: string; event?: string; payload?: unknown } };
        try {
          msg = JSON.parse(String(e.data));
        } catch {
          return;
        }
        if (msg.topic !== channel) return;
        if (msg.event === "phx_reply" && msg.payload?.status === "ok" && !joined) {
          joined = true;
          backoff = 1000;
          setConnected(true);
          // Ulanish (yoki qayta ulanish) — chaqiruvchi holatni soʻrasin/eʼlon qilsin.
          onMessageRef.current("__joined", null, sendRef.current);
        } else if (msg.event === "broadcast" && typeof msg.payload?.event === "string") {
          onMessageRef.current(msg.payload.event, msg.payload.payload, sendRef.current);
        } else if (msg.event === "phx_error" || msg.event === "phx_close") {
          socket?.close();
        }
      };
      socket.onclose = () => {
        joined = false;
        setConnected(false);
        clearInterval(heartbeat);
        if (closed) return;
        retry = setTimeout(connect, backoff);
        backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
      };
      socket.onerror = () => socket?.close();
    };

    connect();
    return () => {
      closed = true;
      sendRef.current = () => false;
      clearInterval(heartbeat);
      clearTimeout(retry);
      socket?.close();
      setConnected(false);
    };
  }, [topic, base, key]);

  const send = useCallback((event: string, payload: unknown) => sendRef.current(event, payload), []);
  return { connected, send };
}
