"use client";

import * as React from "react";

/* ════════════════════════════════════════════════════════════════════
   KIRITISH SINOVI — panel brauzerga nima yuborishini koʻrsatadi.
   Sahifa: src/app/doska/sinov/page.tsx.

   Kanvasga har nuqta kontakt oʻlchamida (ellips) chiziladi: qalam —
   koʻk, barmoq — yashil, sichqoncha — kulrang. Kaft qoʻyilganda katta
   ellips chiqsa — panel kontakt oʻlchamini beradi va kaft bilan
   oʻchirish mumkin (R332). Hammasi bir xil mayda nuqta boʻlsa — yoʻq.

   Matn faqat oʻzbekcha: ichki vosita, `/doska/ikonalar` bilan bir xil.
   ════════════════════════════════════════════════════════════════════ */

type PointerStat = {
  id: number;
  type: string;
  pressure: number;
  width: number;
  height: number;
  tiltX: number;
  tiltY: number;
  buttons: number;
  /** Oxirgi soniyadagi nuqtalar soni (coalesced bilan). */
  hz: number;
  /** Bitta `pointermove` ichidagi coalesced nuqtalar — oxirgi va eng koʻp. */
  coalesced: number;
  maxCoalesced: number;
};

type Summary = {
  types: Record<string, number>;
  pressureValues: number[];
  maxContact: number;
  maxHz: number;
  maxCoalesced: number;
  eraserButton: boolean;
  maxSimultaneous: number;
};

type Capabilities = Record<string, string | number | boolean>;

const TYPE_VAR: Record<string, [string, string]> = {
  pen: ["--doska-pen-blue", "royalblue"],
  touch: ["--doska-pen-green", "seagreen"],
  mouse: ["--muted-foreground", "gray"],
};

function readCapabilities(): Capabilities {
  const probe = typeof PointerEvent !== "undefined" ? PointerEvent.prototype : null;
  const canvas = document.createElement("canvas");
  let desynchronized = false;
  try {
    const ctx = canvas.getContext("2d", { desynchronized: true }) as
      | (CanvasRenderingContext2D & { getContextAttributes?: () => { desynchronized?: boolean } })
      | null;
    desynchronized = !!ctx?.getContextAttributes?.().desynchronized;
  } catch {
    desynchronized = false;
  }
  return {
    getCoalescedEvents: !!probe && "getCoalescedEvents" in probe,
    getPredictedEvents: !!probe && "getPredictedEvents" in probe,
    inkApi: "ink" in navigator,
    desynchronizedCanvas: desynchronized,
    maxTouchPoints: navigator.maxTouchPoints,
    devicePixelRatio: window.devicePixelRatio,
    screen: `${screen.width}×${screen.height}`,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    userAgent: navigator.userAgent,
  };
}

function emptySummary(): Summary {
  return {
    types: {},
    pressureValues: [],
    maxContact: 0,
    maxHz: 0,
    maxCoalesced: 0,
    eraserButton: false,
    maxSimultaneous: 0,
  };
}

export function InputProbe() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [caps, setCaps] = React.useState<Capabilities | null>(null);
  const [pointers, setPointers] = React.useState<PointerStat[]>([]);
  const [log, setLog] = React.useState<string[]>([]);
  const [summary, setSummary] = React.useState<Summary>(emptySummary);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => setCaps(readCapabilities()), []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const style = getComputedStyle(canvas);
    const colorFor = (type: string) => {
      const [cssVar, fallback] = TYPE_VAR[type] ?? TYPE_VAR.mouse;
      return style.getPropertyValue(cssVar).trim() || fallback;
    };

    const live = new Map<number, PointerStat & { stamps: number[] }>();
    const sum = emptySummary();
    const pressures = new Set<number>();
    let frame = 0;

    const publish = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setPointers(
          [...live.values()].map((p) => ({
            id: p.id, type: p.type, pressure: p.pressure, width: p.width, height: p.height,
            tiltX: p.tiltX, tiltY: p.tiltY, buttons: p.buttons, hz: p.hz,
            coalesced: p.coalesced, maxCoalesced: p.maxCoalesced,
          })),
        );
        setSummary({ ...sum, types: { ...sum.types }, pressureValues: [...pressures].sort((a, b) => a - b).slice(0, 20) });
      });
    };

    const dot = (e: PointerEvent) => {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = colorFor(e.pointerType);
      ctx.beginPath();
      ctx.ellipse(e.clientX, e.clientY, Math.max(1.5, e.width / 2), Math.max(1.5, e.height / 2), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    };

    const track = (e: PointerEvent, coalescedCount: number) => {
      const now = performance.now();
      let p = live.get(e.pointerId);
      if (!p) {
        p = {
          id: e.pointerId, type: e.pointerType, pressure: 0, width: 0, height: 0,
          tiltX: 0, tiltY: 0, buttons: 0, hz: 0, coalesced: 0, maxCoalesced: 0, stamps: [],
        };
        live.set(e.pointerId, p);
      }
      for (let i = 0; i < coalescedCount; i++) p.stamps.push(now);
      while (p.stamps.length && now - p.stamps[0] > 1000) p.stamps.shift();

      Object.assign(p, {
        pressure: e.pressure, width: e.width, height: e.height, tiltX: e.tiltX, tiltY: e.tiltY,
        buttons: e.buttons, hz: p.stamps.length, coalesced: coalescedCount,
        maxCoalesced: Math.max(p.maxCoalesced, coalescedCount),
      });

      pressures.add(Math.round(e.pressure * 100) / 100);
      sum.maxContact = Math.max(sum.maxContact, e.width * e.height);
      sum.maxHz = Math.max(sum.maxHz, p.hz);
      sum.maxCoalesced = Math.max(sum.maxCoalesced, coalescedCount);
      if (e.pointerType === "pen" && (e.buttons & 32) !== 0) sum.eraserButton = true;
      publish();
    };

    const onDown = (e: PointerEvent) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      sum.types[e.pointerType] = (sum.types[e.pointerType] ?? 0) + 1;
      track(e, 1);
      sum.maxSimultaneous = Math.max(sum.maxSimultaneous, live.size);
      dot(e);
      const line =
        `${e.pointerType} #${e.pointerId} · bosim ${e.pressure.toFixed(2)} · ` +
        `kontakt ${e.width.toFixed(0)}×${e.height.toFixed(0)} · button ${e.button} / buttons ${e.buttons}`;
      setLog((l) => [line, ...l].slice(0, 8));
    };

    const onMove = (e: PointerEvent) => {
      if (!live.has(e.pointerId)) return;
      const list = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      const events = list.length ? list : [e];
      for (const ev of events) dot(ev);
      track(e, events.length);
    };

    const onEnd = (e: PointerEvent) => {
      live.delete(e.pointerId);
      publish();
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onEnd);
    canvas.addEventListener("pointercancel", onEnd);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onEnd);
      canvas.removeEventListener("pointercancel", onEnd);
    };
  }, []);

  const clear = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setLog([]);
  };

  const copyReport = async () => {
    const report = JSON.stringify({ capabilities: caps, summary }, null, 2);
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard yopiq (http yoki eski brauzer) — konsolga chiqaramiz.
      console.info(report);
    }
  };

  return (
    <main className="bg-background fixed inset-0 overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 size-full touch-none" />

      <section className="bg-background/90 pointer-events-none absolute top-3 left-3 max-h-[calc(100%-1.5rem)] w-[min(26rem,calc(100%-1.5rem))] overflow-y-auto rounded-lg border p-4 text-xs">
        <h1 className="text-base font-semibold">Kiritish sinovi</h1>
        <p className="text-muted-foreground mt-1">
          Qalam, barmoq va kaft bilan yozing. Koʻk — qalam, yashil — barmoq, kulrang — sichqoncha;
          doira oʻlchami — kontakt oʻlchami.
        </p>

        <h2 className="text-muted-foreground mt-3 mb-1 font-medium uppercase">Brauzer</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {caps &&
            Object.entries(caps).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-mono break-all">{String(v)}</dd>
              </React.Fragment>
            ))}
        </dl>

        <h2 className="text-muted-foreground mt-3 mb-1 font-medium uppercase">Jami</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 font-mono">
          <dt className="text-muted-foreground font-sans">turlar</dt>
          <dd>{Object.entries(summary.types).map(([k, n]) => `${k}: ${n}`).join(", ") || "—"}</dd>
          <dt className="text-muted-foreground font-sans">bosim qiymatlari</dt>
          <dd>{summary.pressureValues.join(", ") || "—"}</dd>
          <dt className="text-muted-foreground font-sans">eng katta kontakt</dt>
          <dd>{summary.maxContact.toFixed(0)} px²</dd>
          <dt className="text-muted-foreground font-sans">eng koʻp nuqta/s</dt>
          <dd>{summary.maxHz}</dd>
          <dt className="text-muted-foreground font-sans">coalesced (maks.)</dt>
          <dd>{summary.maxCoalesced}</dd>
          <dt className="text-muted-foreground font-sans">oʻchirgʻich tugmasi</dt>
          <dd>{summary.eraserButton ? "ha" : "—"}</dd>
          <dt className="text-muted-foreground font-sans">bir vaqtda</dt>
          <dd>{summary.maxSimultaneous}</dd>
        </dl>

        {pointers.length > 0 && (
          <>
            <h2 className="text-muted-foreground mt-3 mb-1 font-medium uppercase">Hozir</h2>
            <ul className="space-y-0.5 font-mono">
              {pointers.map((p) => (
                <li key={p.id}>
                  {p.type} #{p.id} · {p.pressure.toFixed(2)} · {p.width.toFixed(0)}×{p.height.toFixed(0)} ·
                  tilt {p.tiltX}/{p.tiltY} · {p.hz}/s · ×{p.coalesced}
                </li>
              ))}
            </ul>
          </>
        )}

        {log.length > 0 && (
          <>
            <h2 className="text-muted-foreground mt-3 mb-1 font-medium uppercase">Teginishlar</h2>
            <ul className="space-y-0.5 font-mono">
              {log.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </>
        )}

        <div className="pointer-events-auto mt-4 flex gap-2">
          <button
            type="button"
            onClick={copyReport}
            className="bg-primary text-primary-foreground h-9 rounded-md px-3 text-sm font-medium"
          >
            {copied ? "Nusxalandi" : "Hisobotni nusxalash"}
          </button>
          <button type="button" onClick={clear} className="hover:bg-muted h-9 rounded-md border px-3 text-sm">
            Tozalash
          </button>
        </div>
      </section>
    </main>
  );
}
