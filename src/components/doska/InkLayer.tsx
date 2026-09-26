"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import { useDoskaPrefs } from "@/lib/doska/prefs";
import { useInkTool, type InkMode } from "@/lib/doska/ink-tool";
import { claimForInk } from "@/lib/doska/interaction";
import {
  MARKER_ALPHA,
  START_PRESSURE,
  canvasColor,
  compactPoints,
  eraserRadiusPx,
  inkColorVar,
  isRealPressureSample,
  livePath,
  simulatedPressure,
  strokeHit,
  strokePath,
} from "@/lib/doska/ink";
import type { InkStroke, InkTool } from "@/lib/doska/types";

/* ════════════════════════════════════════════════════════════════════
   QOʻLYOZMA QATLAMI — docs/doska-qolyozma-tadqiqot.md.

   Uch kanvas, vidjetlar ustida (`--z-doska-ink`, R338):

     • QURUQ — saqlangan chiziqlar. Faqat yozuv oʻzgarganda (chiziq
       qoʻshildi, oʻchirildi, qaytarildi), fon yoki uslub almashganda
       qayta chiziladi. Har chiziqning konturi keshda (`strokePath`) —
       500 chiziqli ekran ham bir zumda (R341).
     • HOʻL — hozir yozilayotgan chiziqlar va oʻchirgʻich doirasi. Har
       kadrda (`requestAnimationFrame`) qayta chiziladi, lekin faqat
       oʻzi — quruq qatlamga tegmaydi.
     • MARKER ORALIGʻI (DOMda yoʻq) — yozilayotgan marker avval shu yerga
       toʻliq rangda chiziladi, keyin hoʻl qatlamga bir marta shaffof
       koʻchiriladi. Aks holda boʻlaklar (pastda) tutashgan joyda
       shaffoflik ikki marta tushib, qoramtir dogʻ qolardi.

   KIRITISH. Qalamning oraliq nuqtalari `getCoalescedEvents()` dan
   olinadi: qalam 120–240 Hz da nuqta beradi, brauzer esa kadrga bitta
   `pointermove` yuboradi — ularsiz tez yozuv siniq chiqadi (R330).

   UZUN CHIZIQ. Yozilayotgan chiziq konturi har kadrda qayta quriladi.
   Butun chiziq har safar qurilsa, uzun chiziqda (bir necha ming nuqta)
   kadr sekinlashib, kechikish aynan yozish paytida oʻsardi. Shuning
   uchun chiziq `CHUNK_POINTS` lik boʻlaklarga «muzlatiladi»: tayyor
   boʻlak yoʻli keshda, har kadrda faqat dumi quriladi.

   ⚠️ Hodisalar kanvas ildizida, CAPTURE bosqichida olinadi va
   TOʻXTATILMAYDI — faqat «egallangan» deb belgilanadi (`claimForInk`).
   Vidjet dispatcheri (`InteractionLayer`) belgini koʻrib chetga turadi,
   hujjatdagi tinglovchilar esa hodisani oladi: ochiq menyu yoki oyna
   yozish boshlanganda yopiladi.

   ⚠️ Store'lar `getState()` orqali oʻqiladi — `InteractionLayer` bilan
   bir xil sabab: listenerlar yozish oʻrtasida qayta ulanmasin.
   ════════════════════════════════════════════════════════════════════ */

/** Qurilma piksel zichligi shundan oshmaydi: 4K doskada kanvaslar 4× xotira yemasin. */
const MAX_DPR = 2;

/** Shundan yaqin keyingi nuqta tashlanadi — qalam turgan joyda titraydi. */
const MIN_POINT_DISTANCE = 0.3;

/** Yozilayotgan chiziq shuncha nuqtadan keyin boʻlak qilib muzlatiladi. */
const CHUNK_POINTS = 200;

const EMPTY: InkStroke[] = [];

type LiveStroke = {
  /** Chiziq BOSHLANGAN ekran — saqlash aynan shunga (store `addStroke`). */
  screenId: string;
  tool: InkTool;
  color: string;
  size: number;
  /** `[x, y, bosim 0–1, …]` — kasr, soddalashtirilmagan. */
  points: number[];
  /** Tayyor boʻlaklar yoʻli va dum qaysi nuqtadan boshlanadi. */
  frozen: Path2D[];
  frozenUpTo: number;
  lastX: number;
  lastY: number;
  lastT: number;
  pressure: number;
  /** Qurilma haqiqiy bosim bera boshladi — shundan keyin simulyatsiya yoʻq. */
  realPressure: boolean;
};

type LiveEraser = { radius: number; x: number; y: number; begun: boolean };

function activeInk(): InkStroke[] {
  const s = useDoskaStore.getState();
  return s.deck.screens.find((x) => x.id === s.activeScreenId)?.ink ?? EMPTY;
}

function activeBackground(): string | null | undefined {
  const s = useDoskaStore.getState();
  return s.deck.screens.find((x) => x.id === s.activeScreenId)?.background;
}

/**
 * Bu bosish siyohnikimi — boʻlsa qaysi asbob bilan.
 *
 * Qalamning oʻchirgʻich uchi (`buttons & 32`, W3C Pointer Events, R334)
 * rejimdan qatʼi nazar oʻchiradi: qalamni aylantirish — aniq niyat.
 */
function inkModeFor(e: PointerEvent): InkMode | null {
  const doska = useDoskaStore.getState();
  if (doska.spotlightId || doska.curtain) return null;

  const tool = useInkTool.getState();
  const eraserTip = e.pointerType === "pen" && (e.buttons & 32) !== 0;
  if (!eraserTip && (e.button !== 0 || !tool.mode)) return null;

  // Qalam yozishga kirishdi — «Faqat qalam» birinchi marta yoqiladi
  // (R333). Tanlash rejimidagi qalam bosishi hisoblanmaydi.
  if (e.pointerType === "pen") tool.markPenSeen();
  if (eraserTip) return "eraser";

  // Faqat qalam yozadi — kaft va barmoq yoʻq.
  if (useInkTool.getState().penOnly && e.pointerType !== "pen") return null;
  return tool.mode;
}

export function InkLayer({ rootRef }: { rootRef: React.RefObject<HTMLElement | null> }) {
  const dryRef = React.useRef<HTMLCanvasElement>(null);
  const wetRef = React.useRef<HTMLCanvasElement>(null);

  const mode = useInkTool((s) => s.mode);
  const penOnly = useInkTool((s) => s.penOnly);
  const spotlight = useDoskaStore((s) => s.spotlightId !== null);

  // «Faqat qalam» oʻchiq boʻlsa HOʻL kanvas butun ekranni yopib bosishni
  // oʻzi oladi — vidjet tugmasi yozuv ostida tasodifan bosilmasin.
  // Yoqiq boʻlsa kanvas bosishni oʻtkazadi: barmoq vidjetni boshqaradi,
  // qalamni esa ildizdagi listener ushlaydi.
  const capturesAll = mode !== null && !penOnly && !spotlight;

  useInkEngine(rootRef, dryRef, wetRef);

  // Yozish rejimida ildiz ham `touch-action: none`: «Faqat qalam»da qalam
  // boʻsh joyda (ildizning oʻzida) yozadi va brauzer harakatni
  // aylantirish deb olib, `pointercancel` yubormasin.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || mode === null) return;
    root.style.touchAction = "none";
    return () => {
      root.style.touchAction = "";
    };
  }, [rootRef, mode]);

  return (
    <>
      <canvas
        ref={dryRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
        style={{ zIndex: "var(--z-doska-ink)" }}
      />
      <canvas
        ref={wetRef}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 size-full",
          capturesAll ? "touch-none" : "pointer-events-none",
          capturesAll && (mode === "eraser" ? "cursor-none" : "cursor-crosshair"),
        )}
        style={{ zIndex: "var(--z-doska-ink)" }}
      />
    </>
  );
}

function useInkEngine(
  rootRef: React.RefObject<HTMLElement | null>,
  dryRef: React.RefObject<HTMLCanvasElement | null>,
  wetRef: React.RefObject<HTMLCanvasElement | null>,
) {
  React.useEffect(() => {
    const root = rootRef.current;
    const dry = dryRef.current;
    const wet = wetRef.current;
    const scratch = document.createElement("canvas");
    const dctx = dry?.getContext("2d");
    const wctx = wet?.getContext("2d");
    const sctx = scratch.getContext("2d");
    if (!root || !dry || !wet || !dctx || !wctx || !sctx) return;

    let dpr = 1;
    let originX = 0;
    let originY = 0;
    let frame = 0;
    let bgFrame = 0;

    const live = new Map<number, LiveStroke>();
    const erasers = new Map<number, LiveEraser>();
    /** Sichqonchadagi oʻchirgʻich doirasi — bosilmagan paytda ham koʻrinsin. */
    let hover: { x: number; y: number } | null = null;

    /* ── Rang ──
       Token qiymati kanvas ildizidan oʻqiladi: `data-bg-tone` shu yerda,
       yaʼni `--doska-ink` toʻq fonda allaqachon boʻr. `canvasColor` —
       oklch → rgba (kanvas notanish rangni jimgina rad etadi). Kesh har
       quruq chizishda tozalanadi — fon yoki uslub almashsa yangi qiymat. */
    const colors = new Map<string, string>();
    const resolve = (cssVar: string) => {
      let c = colors.get(cssVar);
      if (c === undefined) {
        c = canvasColor(getComputedStyle(root).getPropertyValue(cssVar).trim() || "black");
        colors.set(cssVar, c);
      }
      return c;
    };

    const reset = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    };

    /* ── Quruq qatlam ──
       Marker AVVAL, qalam KEYIN: marker yozuvni yopmasin, ostida qolsin. */
    const drawDry = () => {
      colors.clear();
      reset(dctx, dry);
      const ink = activeInk();
      for (const pass of ["marker", "pen"] as const) {
        dctx.globalAlpha = pass === "marker" ? MARKER_ALPHA : 1;
        for (const stroke of ink) {
          if (stroke.tool !== pass) continue;
          const path = strokePath(stroke);
          if (!path) continue;
          dctx.fillStyle = resolve(inkColorVar(stroke.tool, stroke.color));
          dctx.fill(path);
        }
      }
      dctx.globalAlpha = 1;
    };

    /** Oʻchirgʻich doirasi — siyoh rangida: och fonda toʻq, toʻq fonda boʻr. */
    const drawRing = (x: number, y: number, radius: number) => {
      const ink = resolve("--doska-ink");
      wctx.beginPath();
      wctx.arc(x, y, radius, 0, Math.PI * 2);
      wctx.globalAlpha = 0.12;
      wctx.fillStyle = ink;
      wctx.fill();
      wctx.globalAlpha = 0.8;
      wctx.lineWidth = 2;
      wctx.strokeStyle = ink;
      wctx.stroke();
      wctx.globalAlpha = 1;
    };

    /** Tayyor boʻlaklarni muzlatadi; dum har kadrda qayta quriladi. */
    const livePaths = (l: LiveStroke): Path2D[] => {
      const count = l.points.length / 3;
      // Oxirgi boʻlakdan keyin kamida bitta toʻliq boʻlak joyi qolsin —
      // dum juda qisqa boʻlsa uning boshlangʻich qalpogʻi koʻzga tashlanadi.
      while (count - l.frozenUpTo > CHUNK_POINTS * 2) {
        const end = l.frozenUpTo + CHUNK_POINTS;
        // Boʻlaklar bitta umumiy nuqtada tutashadi — yumaloq uchlar
        // bir-birini yopadi, chiziq uzilmaydi.
        const path = livePath(l.tool, l.size, l.points.slice(l.frozenUpTo * 3, (end + 1) * 3), true);
        if (path) l.frozen.push(path);
        l.frozenUpTo = end;
      }
      const tail = livePath(l.tool, l.size, l.points.slice(l.frozenUpTo * 3));
      return tail ? [...l.frozen, tail] : l.frozen;
    };

    /* ── Hoʻl qatlam ── */
    const drawWet = () => {
      frame = 0;
      reset(wctx, wet);

      let markers = false;
      for (const l of live.values()) {
        const ctx = l.tool === "marker" ? sctx : wctx;
        if (l.tool === "marker" && !markers) {
          reset(sctx, scratch);
          markers = true;
        }
        ctx.fillStyle = resolve(inkColorVar(l.tool, l.color));
        for (const path of livePaths(l)) ctx.fill(path);
      }
      if (markers) {
        wctx.setTransform(1, 0, 0, 1, 0, 0);
        wctx.globalAlpha = MARKER_ALPHA;
        wctx.drawImage(scratch, 0, 0);
        wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        wctx.globalAlpha = 1;
      }

      for (const e of erasers.values()) drawRing(e.x, e.y, e.radius);
      if (hover && erasers.size === 0) {
        drawRing(hover.x, hover.y, eraserRadiusPx(useInkTool.getState().eraserSize));
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(drawWet);
    };

    const resize = () => {
      const rect = root.getBoundingClientRect();
      originX = rect.left;
      originY = rect.top;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      for (const c of [dry, wet, scratch]) {
        c.width = Math.max(1, Math.round(rect.width * dpr));
        c.height = Math.max(1, Math.round(rect.height * dpr));
      }
      drawDry();
      drawWet();
    };

    /* ── Oʻchirgʻich ──
       Bitta hodisaning barcha nuqtalari (coalesced + yoʻl boʻylab oraliq)
       avval yigʻiladi va store'dan BIR marta olib tashlanadi: har
       tegishda alohida olib tashlansa, quruq qatlam bir hodisada oʻnlab
       marta qayta chizilardi. */
    const collectHits = (eraser: LiveEraser, x: number, y: number, hits: Set<string>) => {
      for (const stroke of activeInk()) {
        if (!hits.has(stroke.id) && strokeHit(stroke, x, y, eraser.radius)) hits.add(stroke.id);
      }
    };

    /** Tez harakatda nuqtalar orasidagi chiziqlar ham oʻchsin — yoʻl boʻylab. */
    const collectAlong = (eraser: LiveEraser, x: number, y: number, hits: Set<string>) => {
      const dist = Math.hypot(x - eraser.x, y - eraser.y);
      const steps = Math.max(1, Math.ceil(dist / (eraser.radius / 2)));
      for (let i = 1; i <= steps; i++) {
        collectHits(eraser, eraser.x + ((x - eraser.x) * i) / steps, eraser.y + ((y - eraser.y) * i) / steps, hits);
      }
      eraser.x = x;
      eraser.y = y;
    };

    const applyErase = (eraser: LiveEraser, hits: Set<string>) => {
      if (hits.size === 0) return;
      const doska = useDoskaStore.getState();
      // Butun oʻchirish harakati tarixda BITTA qadam — birinchi tegishda.
      if (!eraser.begun) {
        doska.beginGesture();
        eraser.begun = true;
      }
      doska.removeStrokes(hits);
    };

    /* ── Nuqta qoʻshish ── */
    const addPoint = (l: LiveStroke, ev: PointerEvent) => {
      const x = ev.clientX - originX;
      const y = ev.clientY - originY;
      const dist = Math.hypot(x - l.lastX, y - l.lastY);
      if (dist < MIN_POINT_DISTANCE) return;
      if (!l.realPressure && isRealPressureSample(ev.pointerType, ev.pressure)) l.realPressure = true;
      const pressure = l.realPressure
        ? ev.pressure > 0
          ? ev.pressure
          : l.pressure
        : simulatedPressure(l.pressure, dist, ev.timeStamp - l.lastT);
      l.points.push(x, y, pressure);
      l.lastX = x;
      l.lastY = y;
      l.lastT = ev.timeStamp;
      l.pressure = pressure;
    };

    const coalesced = (e: PointerEvent): PointerEvent[] => {
      const list = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      return list.length ? list : [e];
    };

    /** Yozilayotgan chiziqni oʻz ekraniga saqlaydi. */
    const commit = (l: LiveStroke) => {
      const points = compactPoints(l.points);
      if (!points.length) return;
      useDoskaStore.getState().addStroke(
        { id: crypto.randomUUID(), tool: l.tool, color: l.color, size: l.size, points },
        l.screenId,
      );
    };

    /**
     * Yozuvdan keyingi `click` yutiladi — qalam vidjet tugmasi ustida
     * qoʻyib yuborilsa tugma bosilib ketmasin. `InteractionLayer` dagi
     * sudrashdan keyingi yutish bilan bir xil naqsh.
     */
    const swallowClick = () => {
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      root.addEventListener("click", swallow, { capture: true, once: true });
      setTimeout(() => root.removeEventListener("click", swallow, { capture: true }), 0);
    };

    /* ── Hodisalar ── */
    const onPointerDown = (e: PointerEvent) => {
      const mode = inkModeFor(e);
      if (!mode) return;

      claimForInk(e);
      // Sichqonchada matn belgilanmasin va fokus siljimasin.
      e.preventDefault();
      try {
        root.setPointerCapture(e.pointerId);
      } catch {
        // Koʻrsatkich allaqachon yoʻq (juda qisqa teginish) — capture'siz davom.
      }

      const x = e.clientX - originX;
      const y = e.clientY - originY;
      const tool = useInkTool.getState();

      if (mode === "eraser") {
        const eraser: LiveEraser = { radius: eraserRadiusPx(tool.eraserSize), x, y, begun: false };
        erasers.set(e.pointerId, eraser);
        const hits = new Set<string>();
        collectHits(eraser, x, y, hits);
        applyErase(eraser, hits);
      } else {
        const realPressure = isRealPressureSample(e.pointerType, e.pressure);
        const pressure = realPressure ? e.pressure : START_PRESSURE;
        live.set(e.pointerId, {
          screenId: useDoskaStore.getState().activeScreenId,
          tool: mode,
          color: mode === "marker" ? tool.markerColor : tool.penColor,
          size: mode === "marker" ? tool.markerSize : tool.penSize,
          points: [x, y, pressure],
          frozen: [],
          frozenUpTo: 0,
          lastX: x,
          lastY: y,
          lastT: e.timeStamp,
          pressure,
          realPressure,
        });
      }
      schedule();
    };

    const onPointerMove = (e: PointerEvent) => {
      const l = live.get(e.pointerId);
      const eraser = erasers.get(e.pointerId);

      if (l) {
        for (const ev of coalesced(e)) addPoint(l, ev);
        schedule();
        return;
      }
      if (eraser) {
        const hits = new Set<string>();
        for (const ev of coalesced(e)) collectAlong(eraser, ev.clientX - originX, ev.clientY - originY, hits);
        applyErase(eraser, hits);
        schedule();
        return;
      }

      // Sichqonchada oʻchirgʻich doirasi kursor oʻrnida.
      const tool = useInkTool.getState();
      if (tool.mode === "eraser" && e.pointerType === "mouse") {
        hover = { x: e.clientX - originX, y: e.clientY - originY };
        schedule();
      } else if (hover) {
        hover = null;
        schedule();
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      const l = live.get(e.pointerId);
      const eraser = erasers.get(e.pointerId);
      if (!l && !eraser) return;

      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      live.delete(e.pointerId);
      erasers.delete(e.pointerId);

      // `pointercancel` da ham saqlanadi: brauzer harakatni tortib olsa
      // ham oʻqituvchi yozgani yoʻqolmasin.
      if (l) commit(l);
      swallowClick();
      schedule();
    };

    const onPointerLeave = () => {
      if (!hover) return;
      hover = null;
      schedule();
    };

    /* ── Obunalar ──
       Yozuv oʻzgarsa quruq qatlam DARHOL (sinxron) chiziladi: hoʻl chiziq
       keyingi kadrda oʻchadi, quruq esa undan oldin tayyor — qoʻyib
       yuborilgan chiziq bir kadr ham yoʻqolib qolmaydi.

       Fon va uslub esa bir kadr kutadi: `data-bg-tone` va
       `data-doska-style` ni React keyinroq qoʻyadi, token qiymati shundan
       keyin oʻzgaradi.

       Ekran almashsa (strelka, pult) yozilayotgan chiziqlar DARHOL oʻz
       ekraniga saqlanib yakunlanadi: aks holda chiziq yangi ekran ustida
       chizilishda davom etib, qoʻyib yuborilganda koʻzdan gʻoyib boʻlardi.
       Oʻchirgʻich ham toʻxtaydi — yangi ekranda oʻchirishni davom
       ettirmasin. */
    let lastInk = activeInk();
    let lastBackground = activeBackground();
    let lastScreenId = useDoskaStore.getState().activeScreenId;
    const redrawNextFrame = () => {
      cancelAnimationFrame(bgFrame);
      bgFrame = requestAnimationFrame(() => {
        drawDry();
        drawWet();
      });
    };
    const unsubDoska = useDoskaStore.subscribe((s) => {
      if (s.activeScreenId !== lastScreenId) {
        lastScreenId = s.activeScreenId;
        const pending = [...live.values()];
        live.clear();
        erasers.clear();
        for (const l of pending) commit(l);
        schedule();
      }
      const ink = activeInk();
      if (ink !== lastInk) {
        lastInk = ink;
        drawDry();
      }
      const background = activeBackground();
      if (background !== lastBackground) {
        lastBackground = background;
        redrawNextFrame();
      }
    });
    const unsubPrefs = useDoskaPrefs.subscribe((s, prev) => {
      if (s.style !== prev.style) redrawNextFrame();
    });
    const unsubTool = useInkTool.subscribe((s, prev) => {
      if (s.mode !== prev.mode && s.mode !== "eraser" && hover) {
        hover = null;
        schedule();
      }
    });

    const observer = new ResizeObserver(resize);
    observer.observe(root);
    window.addEventListener("resize", resize);
    resize();

    root.addEventListener("pointerdown", onPointerDown, { capture: true });
    root.addEventListener("pointermove", onPointerMove, { capture: true });
    root.addEventListener("pointerup", onPointerEnd, { capture: true });
    root.addEventListener("pointercancel", onPointerEnd, { capture: true });
    root.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(bgFrame);
      unsubDoska();
      unsubPrefs();
      unsubTool();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      root.removeEventListener("pointerdown", onPointerDown, { capture: true });
      root.removeEventListener("pointermove", onPointerMove, { capture: true });
      root.removeEventListener("pointerup", onPointerEnd, { capture: true });
      root.removeEventListener("pointercancel", onPointerEnd, { capture: true });
      root.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [rootRef, dryRef, wetRef]);
}
