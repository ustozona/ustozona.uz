"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeConfig } from "@/lib/live-session";

/* ════════════════════════════════════════════════════════════════════
   REALTIME TURTKI TINGLOVCHISI — oʻqituvchi ekrani uchun (R284).

   Supabase Realtime BROADCAST kanaliga Phoenix protokoli bilan ulanadi.
   `@supabase/supabase-js` qoʻshilmadi (~100 KB): bizga faqat bitta kanalni
   tinglash kerak — qoʻshilish, yurak urishi, xabar. Shu ~70 qator.

   Turtkida maʼlumot yoʻq — `onNudge` natijani server amali bilan oʻzi
   soʻraydi. Kalit sozlanmagan yoki ulanish uzilgan boʻlsa `connected =
   false` qaytadi va chaqiruvchi zaxira soʻrovga (polling) oʻtadi.

   Ulanish sozlamasi (`config`) `NEXT_PUBLIC_` env'dan EMAS — uni
   tizimga kirgan oʻqituvchiga server amali beradi
   (`liveRealtimeConfigAction`, `server/realtime/config.ts`). Shu sababli
   kalit ommaviy JS paketiga qotirilmaydi.
   ════════════════════════════════════════════════════════════════════ */

const HEARTBEAT_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

export function useLiveNudge(
  topic: string | null,
  config: RealtimeConfig | null,
  onNudge: () => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const onNudgeRef = useRef(onNudge);
  useEffect(() => {
    onNudgeRef.current = onNudge;
  });

  const base = config?.url;
  const key = config?.key;

  useEffect(() => {
    if (!topic || !base || !key) return;

    const url = `${base.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`;
    const channel = `realtime:${topic}`;
    let socket: WebSocket | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let backoff = 1000;
    let ref = 0;
    let closed = false;

    const send = (msg: Record<string, unknown>) => {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ ...msg, ref: String(++ref) }));
    };

    const connect = () => {
      socket = new WebSocket(url);
      socket.onopen = () => {
        backoff = 1000;
        send({
          topic: channel,
          event: "phx_join",
          join_ref: "1",
          payload: {
            config: { broadcast: { self: false, ack: false }, presence: { key: "" }, postgres_changes: [], private: false },
            access_token: key,
          },
        });
        heartbeat = setInterval(() => send({ topic: "phoenix", event: "heartbeat", payload: {} }), HEARTBEAT_MS);
      };
      socket.onmessage = (e) => {
        let msg: { topic?: string; event?: string; payload?: { status?: string } };
        try {
          msg = JSON.parse(String(e.data));
        } catch {
          return;
        }
        if (msg.topic !== channel) return;
        if (msg.event === "phx_reply" && msg.payload?.status === "ok") setConnected(true);
        else if (msg.event === "broadcast") onNudgeRef.current();
        else if (msg.event === "phx_error" || msg.event === "phx_close") socket?.close();
      };
      socket.onclose = () => {
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
      clearInterval(heartbeat);
      clearTimeout(retry);
      socket?.close();
      setConnected(false);
    };
  }, [topic, base, key]);

  return { connected };
}
