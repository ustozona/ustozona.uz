"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════
   RADIO PULT QABUL QILGICHI — Web Serial (Chrome/Edge, kompyuter).

   Qurilma: Arduino + 433 MHz qabul qilgich (LessonLab `arduino/`),
   noutbukka USB bilan ulanadi. Qabul qilgich ikki formatdan birini
   chiqaradi — ikkalasi ham qabul qilinadi:

       {"pult":5,"button":"B"}     ← hozirgi sketch (RUN rejimi)
       ID:5,BTN:B                  ← eski format

   PULT RAQAMI = JURNALDAGI TARTIB RAQAMI (QR-karta va OMR varagʻi
   bilan bir xil qoida) — bogʻlash jadvali kerak emas.

   Bosishsiz qayta ulanish: brauzer qabul qilgichga ilgari ruxsat bergan
   boʻlsa (`getPorts`), port tanlash oynasisiz ulanadi. Birinchi marta
   ruxsat — baribir «Qurilmani ulash» bilan (brauzer qoidasi).
   ════════════════════════════════════════════════════════════════════ */

type SerialPortLike = {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
};
type SerialLike = {
  requestPort(): Promise<SerialPortLike>;
  /** Ilgari ruxsat berilgan portlar — bosishsiz qayta ulanish uchun. */
  getPorts?(): Promise<SerialPortLike[]>;
};

export type SerialState = "idle" | "connecting" | "connected" | "error";

export function serialApi(): SerialLike | null {
  if (typeof navigator === "undefined") return null;
  return (navigator as Navigator & { serial?: SerialLike }).serial ?? null;
}

/** Qabul qilgich satri → {pult, harf}. Izoh (`#`), `ERR`, `PONG` — `null`. */
export function parsePultSignal(line: string): { pult: number; letter: string } | null {
  const text = line.trim();
  if (!text || text.startsWith("#")) return null;
  const json = text.match(/"pult"\s*:\s*(\d+)\s*,\s*"button"\s*:\s*"([A-Da-d])"/);
  if (json) return { pult: Number(json[1]), letter: json[2].toUpperCase() };
  const legacy = text.match(/ID:(\d+),BTN:([A-Da-d])/);
  if (legacy) return { pult: Number(legacy[1]), letter: legacy[2].toUpperCase() };
  return null;
}

export function usePultSerial({
  enabled,
  onSignal,
  onUnsupported,
  onFailed,
}: {
  enabled: boolean;
  onSignal: (pult: number, letter: string) => void;
  onUnsupported: () => void;
  onFailed: () => void;
}) {
  const [conn, setConn] = useState<SerialState>("idle");
  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const readingRef = useRef(false);
  /* Uzoq yashaydigan oqim eskirgan yopilishdan emas, joriy ishlovchidan chaqirsin. */
  const handlersRef = useRef({ onSignal, onUnsupported, onFailed });
  useEffect(() => {
    handlersRef.current = { onSignal, onUnsupported, onFailed };
  });

  const disconnect = useCallback(async () => {
    readingRef.current = false;
    try {
      await readerRef.current?.cancel();
    } catch {
      /* allaqachon yopilgan */
    }
    readerRef.current = null;
    try {
      await portRef.current?.close();
    } catch {
      /* allaqachon yopilgan */
    }
    portRef.current = null;
  }, []);

  useEffect(() => () => void disconnect(), [disconnect]);

  const connect = useCallback(async (given?: SerialPortLike) => {
    const serial = serialApi();
    if (!serial) {
      setConn("error");
      handlersRef.current.onUnsupported();
      return;
    }
    setConn("connecting");
    try {
      const port = given ?? (await serial.requestPort());
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      // Oʻrganish rejimida qolib ketgan boʻlsa — sinf rejimiga.
      try {
        const writer = port.writable?.getWriter();
        await writer?.write(new TextEncoder().encode("RUN\n"));
        writer?.releaseLock();
      } catch {
        /* eski sketch buyruqni bilmasligi mumkin — zararsiz */
      }
      if (!port.readable) throw new Error("no readable");
      const decoder = new TextDecoderStream();
      void port.readable.pipeTo(decoder.writable as unknown as WritableStream<Uint8Array>).catch(() => {});
      const reader = decoder.readable.getReader();
      readerRef.current = reader;
      readingRef.current = true;
      setConn("connected");

      let buffer = "";
      while (readingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const signal = parsePultSignal(line);
          if (signal) handlersRef.current.onSignal(signal.pult, signal.letter);
        }
      }
      if (readingRef.current) setConn("error");
    } catch (e) {
      // Foydalanuvchi port tanlash oynasini yopdi — xato emas.
      if (e instanceof DOMException && e.name === "NotFoundError") {
        setConn("idle");
        return;
      }
      setConn("error");
      handlersRef.current.onFailed();
    }
  }, []);

  /* Doskadan telefon orqali ochilganda oʻqituvchi kompyuterga qaytmasligi
     uchun — ruxsat berilgan port boʻlsa oʻzi ulanadi. */
  const autoTried = useRef(false);
  useEffect(() => {
    if (!enabled || autoTried.current) return;
    autoTried.current = true;
    serialApi()
      ?.getPorts?.()
      .then((ports) => {
        if (ports[0]) void connect(ports[0]);
      })
      .catch(() => {});
  }, [enabled, connect]);

  return { conn, connect: () => void connect(), disconnect };
}
