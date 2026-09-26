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
  anchorsKey,
  canvasColor,
  compactPoints,
  eraseAlong,
  eraserRadiusPx,
  inkAnchorAt,
  inkAnchorFor,
  inkColorVar,
  inkWidthAt,
  isRealPressureSample,
  laserPath,
  livePath,
  recognizeShape,
  shapePath,
  simulatedPressure,
  snapLineEnd,
  strokeHit,
  strokePath,
  strokeWidthPx,
  visibleInk,
  type InkPlacement,
  type PlacedStroke,
} from "@/lib/doska/ink";
import type { DoskaScreen, InkShape, InkStroke, InkTool } from "@/lib/doska/types";

/* ════════════════════════════════════════════════════════════════════
   QOʻLYOZMA QATLAMI — docs/doska-qolyozma-tadqiqot.md.

   Uch kanvas, vidjetlar ustida (`--z-doska-ink`, R338):

     • QURUQ — saqlangan chiziqlar. Faqat yozuv oʻzgarganda (chiziq
       qoʻshildi, oʻchirildi, qaytarildi), fon yoki uslub almashganda,
       yoki yozuv bogʻlangan vidjet surilganda / slayd almashganda
       qayta chiziladi. Har chiziqning konturi keshda (`strokePath`) —
       500 chiziqli ekran ham bir zumda (R341).
     • HOʻL — hozir yozilayotgan chiziqlar, lazer izi va oʻchirgʻich
       doirasi. Har kadrda (`requestAnimationFrame`) qayta chiziladi,
       lekin faqat oʻzi — quruq qatlamga tegmaydi.
     • MARKER ORALIGʻI (DOMda yoʻq) — yozilayotgan marker avval shu yerga
       toʻliq rangda chiziladi, keyin hoʻl qatlamga bir marta shaffof
       koʻchiriladi. Aks holda boʻlaklar (pastda) tutashgan joyda
       shaffoflik ikki marta tushib, qoramtir dogʻ qolardi.

   KIRITISH. Qalamning oraliq nuqtalari `getCoalescedEvents()` dan
   olinadi: qalam 120–240 Hz da nuqta beradi, brauzer esa kadrga bitta
   `pointermove` yuboradi — ularsiz tez yozuv siniq chiqadi (R330).

   KECHIKISH (R330). Brauzer bersa, ikki qoʻshimcha — ikkalasi ham
   borligini tekshirib, yoʻq boʻlsa jim:
     • bashorat nuqtalari (`getPredictedEvents`) — keyingi bir necha ms
       taxminan chiziladi va FAQAT BIR KADR yashaydi: qalam toʻxtasa
       keyingi kadrda oʻchadi, qalam uchidan oldinga «oʻsib» qolmaydi.
       Saqlanmaydi;
     • tizim siyoh izi (`navigator.ink`) — oxirgi nuqtadan qalam
       uchigacha boʻlgan boʻlakni OS kompozitori chizadi. Faqat qalamda:
       izning rangi yaxlit, marker esa shaffof. Bashoratning OʻRNIGA
       emas, USTIGA: `requestPresenter` baʼzi platformalarda muvaffaqiyatli
       qaytadi-yu, izni chizmaydi — bashorat baribir ishlasin.

   UZUN CHIZIQ. Yozilayotgan chiziq konturi har kadrda qayta quriladi.
   Butun chiziq har safar qurilsa, uzun chiziqda (bir necha ming nuqta)
   kadr sekinlashib, kechikish aynan yozish paytida oʻsardi. Shuning
   uchun chiziq `CHUNK_POINTS` lik boʻlaklarga «muzlatiladi»: tayyor
   boʻlak yoʻli keshda, har kadrda faqat dumi quriladi.

   «CHIZ VA USHLAB TUR» (R336). Qalam `HOLD_MS` davomida joyida tursa
   chiziq tanib olinadi (`recognizeShape`) va toʻgʻri chiziq, aylana yoki
   toʻrtburchakka aylanadi. Toʻgʻri chiziqning uchi qoʻyib yuborilguncha
   qalam ortidan yuradi va 15° ga yopishadi.

   SLAYD USTIGA (R338). Taqdimot slaydi ustida boshlangan chiziq shu
   slaydga bogʻlanadi (`inkAnchorAt`): slayd almashsa yashirinadi,
   qaytilsa chiqadi, vidjet surilsa birga suriladi.

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

/** Qalam shuncha ms joyida tursa chiziq shaklga aylanadi (R336). */
const HOLD_MS = 550;
/**
 * «Joyida» — shu radius ichida. Qalam va barmoq tursa ham bir-ikki
 * pikselga titraydi; har titrashda taymer qayta boshlansa shakl hech
 * qachon tanilmasdi.
 */
const HOLD_RADIUS = 6;

/** Lazerning sichqonchadagi nuqtasi (px). */
const LASER_DOT = 6;

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
  /** Bashorat qilingan nuqtalar `[x, y, bosim, …]` — faqat chizish uchun. */
  predicted: number[];
  /**
   * Chiziq boshlangan taqdimot vidjeti. Sahifa va vidjet burchagi
   * qoʻyib yuborilganda qayta olinadi (`commit`): yozish paytida barmoq
   * vidjetni surishi yoki pult slaydni almashtirishi mumkin.
   */
  anchorWidgetId: string | null;
  /** Ushlab turish: qalam oxirgi marta shu nuqtada (`holdIndex`-nuqta) «toʻxtagan». */
  holdX: number;
  holdY: number;
  holdIndex: number;
  holdTimer: number;
  /** Tanilgan shakl — boʻlsa chiziq oʻrniga shu chiziladi va saqlanadi. */
  shape: { shape: InkShape; points: number[] } | null;
};

type LiveEraser = { radius: number; partial: boolean; x: number; y: number; begun: boolean };

type InkPresenter = {
  updateInkTrailStartPoint: (event: PointerEvent, style: { color: string; diameter: number }) => void;
};
type NavigatorInk = { requestPresenter: (options?: { presentationArea?: Element }) => Promise<InkPresenter> };

function activeScreen(): DoskaScreen | undefined {
  const s = useDoskaStore.getState();
  return s.deck.screens.find((x) => x.id === s.activeScreenId);
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
          // Oʻchirgʻich doirasi va lazer nuqtasi kanvasda chiziladi — tizim kursori ortiqcha.
          capturesAll && (mode === "eraser" || mode === "laser" ? "cursor-none" : "cursor-crosshair"),
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
    let disposed = false;

    const live = new Map<number, LiveStroke>();
    const erasers = new Map<number, LiveEraser>();
    /** Lazer: bosilib turgan izlar (`pointerId` boʻyicha) va qoʻyib yuborilib soʻnayotganlari. */
    const lasers = new Map<number, number[]>();
    let fading: number[][] = [];
    /** Sichqoncha kursori — oʻchirgʻich doirasi yoki lazer nuqtasi bosilmagan paytda ham koʻrinsin. */
    let hover: { x: number; y: number } | null = null;

    /**
     * Koʻrinayotgan chiziqlar — ekran obyekti oʻzgarmaguncha qayta
     * hisoblanmaydi: oʻchirgʻich ularni har `pointermove` da soʻraydi.
     */
    let visibleFor: DoskaScreen | undefined | null = null;
    let visibleCache: PlacedStroke[] = [];
    const visible = (): PlacedStroke[] => {
      const screen = activeScreen();
      if (screen !== visibleFor) {
        visibleFor = screen;
        visibleCache = visibleInk(screen);
      }
      return visibleCache;
    };

    /* ── Tizim siyoh izi (R330) ──
       Chromium'da bor, boshqalarda `navigator.ink` yoʻq — jim oʻtiladi. */
    let presenter: InkPresenter | null = null;
    const inkApi = (navigator as Navigator & { ink?: NavigatorInk }).ink;
    inkApi
      ?.requestPresenter({ presentationArea: wet })
      .then((p) => {
        if (!disposed) presenter = p;
      })
      .catch(() => {});

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
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    /** Bogʻlangan chiziq vidjet bilan birga suriladi va kattalashadi. */
    const place = (ctx: CanvasRenderingContext2D, p: InkPlacement) => {
      ctx.setTransform(dpr * p.scale, 0, 0, dpr * p.scale, dpr * p.x, dpr * p.y);
    };

    /** Qoʻlyozma — kontur toʻldiriladi; tekislangan shakl — aniq chiziq. */
    const paint = (ctx: CanvasRenderingContext2D, stroke: InkStroke) => {
      const color = resolve(inkColorVar(stroke.tool, stroke.color));
      if (stroke.shape) {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidthPx(stroke.tool, stroke.size);
        ctx.stroke(shapePath(stroke));
        return;
      }
      const path = strokePath(stroke);
      if (!path) return;
      ctx.fillStyle = color;
      ctx.fill(path);
    };

    /* ── Quruq qatlam ──
       Marker AVVAL, qalam KEYIN: marker yozuvni yopmasin, ostida qolsin. */
    const drawDry = () => {
      colors.clear();
      reset(dctx, dry);
      const placed = visible();
      for (const pass of ["marker", "pen"] as const) {
        dctx.globalAlpha = pass === "marker" ? MARKER_ALPHA : 1;
        for (const { stroke, place: p } of placed) {
          if (stroke.tool !== pass) continue;
          place(dctx, p);
          paint(dctx, stroke);
        }
      }
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    /**
     * Lazer — yorqin rang va yogʻdu. `shadowBlur` transformatsiyaga
     * boʻysunmaydi (qurilma pikselida), shuning uchun `dpr` ga koʻpaytiriladi.
     */
    const glow = (fill: () => void) => {
      const color = resolve("--doska-laser");
      wctx.fillStyle = color;
      wctx.shadowColor = color;
      wctx.shadowBlur = 14 * dpr;
      fill();
      wctx.shadowBlur = 0;
      wctx.shadowColor = "transparent";
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
      const tailPoints = l.points.slice(l.frozenUpTo * 3);
      const tail = livePath(l.tool, l.size, l.predicted.length ? tailPoints.concat(l.predicted) : tailPoints);
      return tail ? [...l.frozen, tail] : l.frozen;
    };

    /** Lazer izining eskirgan boshini kesadi; iz tugagan boʻlsa `null`. */
    const laserFrame = (trail: number[], now: number): Path2D | null => {
      let drop = 0;
      while (drop + 2 < trail.length && now - trail[drop + 2] > 2000) drop += 3;
      if (drop) trail.splice(0, drop);
      return laserPath(trail, now);
    };

    /* ── Hoʻl qatlam ── */
    const drawWet = () => {
      // Toʻgʻridan-toʻgʻri chaqirilganda (`resize`, fon) kutayotgan kadr
      // bekor qilinadi — aks holda lazer soʻnayotganda ikkita parallel
      // kadr zanjiri paydo boʻlardi.
      cancelAnimationFrame(frame);
      frame = 0;
      reset(wctx, wet);

      let markers = false;
      let predicted = false;
      for (const l of live.values()) {
        const ctx = l.tool === "marker" ? sctx : wctx;
        if (l.tool === "marker" && !markers) {
          reset(sctx, scratch);
          markers = true;
        }
        const color = resolve(inkColorVar(l.tool, l.color));
        if (l.shape) {
          ctx.strokeStyle = color;
          ctx.lineWidth = strokeWidthPx(l.tool, l.size);
          ctx.stroke(shapePath({ id: "", tool: l.tool, color: l.color, size: l.size, ...l.shape }));
        } else {
          ctx.fillStyle = color;
          for (const path of livePaths(l)) ctx.fill(path);
        }
        // Bashorat bir kadr yashaydi: qalam harakatlansa keyingi
        // `pointermove` yangisini beradi, toʻxtasa — dum oʻchadi.
        if (l.predicted.length) {
          l.predicted = [];
          predicted = true;
        }
      }
      if (markers) {
        wctx.setTransform(1, 0, 0, 1, 0, 0);
        wctx.globalAlpha = MARKER_ALPHA;
        wctx.drawImage(scratch, 0, 0);
        wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        wctx.globalAlpha = 1;
      }

      // Lazer izlari soʻnib boradi — tirik iz bor ekan, kadr davom etadi.
      const now = performance.now();
      let glowing = false;
      const dot = (x: number, y: number) =>
        glow(() => {
          wctx.beginPath();
          wctx.arc(x, y, LASER_DOT, 0, Math.PI * 2);
          wctx.fill();
        });
      for (const trail of lasers.values()) {
        // Bosib turilgan lazerning uchi doim koʻrinadi — qimirlamasa ham.
        const [x, y] = [trail[trail.length - 3], trail[trail.length - 2]];
        const path = laserFrame(trail, now);
        if (path) glow(() => wctx.fill(path));
        dot(x, y);
        glowing = true;
      }
      fading = fading.filter((trail) => {
        const path = laserFrame(trail, now);
        if (!path) return false;
        glow(() => wctx.fill(path));
        glowing = true;
        return true;
      });

      for (const e of erasers.values()) drawRing(e.x, e.y, e.radius);
      const mode = useInkTool.getState().mode;
      if (hover && mode === "eraser" && erasers.size === 0) {
        drawRing(hover.x, hover.y, eraserRadiusPx(useInkTool.getState().eraserSize));
      }
      if (hover && mode === "laser" && lasers.size === 0) dot(hover.x, hover.y);

      if (glowing || predicted) schedule();
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
       Bitta hodisaning butun yoʻli (coalesced nuqtalar) BIR marta
       qoʻllanadi: har nuqtada alohida qoʻllansa, quruq qatlam bir
       hodisada oʻnlab marta qayta chizilardi. Tez harakatda nuqtalar
       oraligʻidagi chiziq ham oʻchadi — yoʻl kesmalar bilan tekshiriladi. */
    const erase = (eraser: LiveEraser, path: number[]) => {
      const changes = new Map<string, InkStroke[]>();
      for (const placed of visible()) {
        if (eraser.partial) {
          const pieces = eraseAlong(placed, path, eraser.radius, () => crypto.randomUUID());
          if (pieces) changes.set(placed.stroke.id, pieces);
        } else if (strokeHit(placed, path, eraser.radius)) {
          changes.set(placed.stroke.id, []);
        }
      }
      if (changes.size === 0) return;
      const doska = useDoskaStore.getState();
      // Butun oʻchirish harakati tarixda BITTA qadam — birinchi tegishda.
      if (!eraser.begun) {
        doska.beginGesture();
        eraser.begun = true;
      }
      doska.replaceStrokes(changes);
    };

    /* ── «Chiz va ushlab tur» ── */
    const armHold = (pointerId: number, l: LiveStroke) => {
      window.clearTimeout(l.holdTimer);
      l.holdTimer = window.setTimeout(() => {
        const current = live.get(pointerId);
        if (current !== l || l.shape) return;
        // Qalam toʻxtagandan keyingi titrash nuqtalari tanishga berilmaydi.
        const found = recognizeShape(l.points.slice(0, (l.holdIndex + 1) * 3));
        if (!found) return;
        l.shape = found;
        l.predicted = [];
        schedule();
      }, HOLD_MS);
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

    /** Bashorat nuqtalari — qalam uchiga yetib olish uchun; bir kadr yashaydi (`drawWet`). */
    const predict = (l: LiveStroke, e: PointerEvent) => {
      l.predicted = [];
      if (typeof e.getPredictedEvents !== "function") return;
      for (const p of e.getPredictedEvents()) {
        l.predicted.push(p.clientX - originX, p.clientY - originY, l.pressure);
      }
    };

    /** Yozilayotgan chiziqni oʻz ekraniga saqlaydi. */
    const commit = (l: LiveStroke) => {
      window.clearTimeout(l.holdTimer);
      const points = l.shape ? l.shape.points.map(Math.round) : compactPoints(l.points);
      if (!points.length) return;
      // Bogʻlash QOʻYIB YUBORILGAN paytdagi vidjet boʻyicha: chiziq ekranda
      // qayerda koʻringan boʻlsa, oʻsha yerda qoladi — yozish paytida
      // vidjet surilgan yoki slayd almashgan boʻlsa ham (u holda yangi
      // slaydga tushadi, koʻzdan gʻoyib boʻlmaydi). Vidjet yoʻqolgan yoki
      // toʻplami yopilgan boʻlsa — ekranniki.
      const screen = useDoskaStore.getState().deck.screens.find((x) => x.id === l.screenId);
      const anchor = l.anchorWidgetId
        ? inkAnchorFor(screen?.widgets.find((w) => w.id === l.anchorWidgetId))
        : null;
      if (anchor) {
        for (let i = 0; i + 1 < points.length; i += 3) {
          points[i] = Math.round(points[i] - anchor.originX);
          points[i + 1] = Math.round(points[i + 1] - anchor.originY);
        }
      }
      useDoskaStore.getState().addStroke(
        {
          id: crypto.randomUUID(),
          tool: l.tool,
          color: l.color,
          size: l.size,
          points,
          ...(l.shape ? { shape: l.shape.shape } : {}),
          ...(anchor ? { anchor: anchor.anchor } : {}),
        },
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

      if (mode === "laser") {
        lasers.set(e.pointerId, [x, y, e.timeStamp]);
      } else if (mode === "eraser") {
        const eraser: LiveEraser = {
          radius: eraserRadiusPx(tool.eraserSize),
          partial: tool.eraserPartial,
          x,
          y,
          begun: false,
        };
        erasers.set(e.pointerId, eraser);
        erase(eraser, [x, y]);
      } else {
        const realPressure = isRealPressureSample(e.pointerType, e.pressure);
        const pressure = realPressure ? e.pressure : START_PRESSURE;
        const l: LiveStroke = {
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
          predicted: [],
          anchorWidgetId: inkAnchorAt(activeScreen()?.widgets ?? [], x, y)?.anchor.widgetId ?? null,
          holdX: x,
          holdY: y,
          holdIndex: 0,
          holdTimer: 0,
          shape: null,
        };
        live.set(e.pointerId, l);
        armHold(e.pointerId, l);
      }
      schedule();
    };

    const onPointerMove = (e: PointerEvent) => {
      const l = live.get(e.pointerId);
      const eraser = erasers.get(e.pointerId);
      const trail = lasers.get(e.pointerId);

      if (l) {
        if (l.shape) {
          // Tekislangan chiziqning uchi qalam ortidan yuradi; yopiq shakl joyida.
          if (l.shape.shape === "line") {
            const [x, y] = snapLineEnd(l.shape.points[0], l.shape.points[1], e.clientX - originX, e.clientY - originY);
            l.shape.points[3] = x;
            l.shape.points[4] = y;
          }
        } else {
          for (const ev of coalesced(e)) addPoint(l, ev);
          // Joyidan chiqdi — ushlab turish hisobi yangidan.
          if (Math.hypot(l.lastX - l.holdX, l.lastY - l.holdY) > HOLD_RADIUS) {
            l.holdX = l.lastX;
            l.holdY = l.lastY;
            l.holdIndex = l.points.length / 3 - 1;
            armHold(e.pointerId, l);
          }
          predict(l, e);
          if (presenter && l.tool === "pen") {
            try {
              presenter.updateInkTrailStartPoint(e, {
                color: resolve(inkColorVar(l.tool, l.color)),
                diameter: inkWidthAt(l.tool, l.size, l.pressure),
              });
            } catch {
              // Brauzer hodisani qabul qilmadi — iz shunchaki chizilmaydi.
            }
          }
        }
        schedule();
        return;
      }
      if (eraser) {
        const path = [eraser.x, eraser.y];
        for (const ev of coalesced(e)) path.push(ev.clientX - originX, ev.clientY - originY);
        eraser.x = path[path.length - 2];
        eraser.y = path[path.length - 1];
        erase(eraser, path);
        schedule();
        return;
      }
      if (trail) {
        for (const ev of coalesced(e)) trail.push(ev.clientX - originX, ev.clientY - originY, ev.timeStamp);
        schedule();
        return;
      }

      // Sichqonchada oʻchirgʻich doirasi / lazer nuqtasi kursor oʻrnida.
      const mode = useInkTool.getState().mode;
      if ((mode === "eraser" || mode === "laser") && e.pointerType === "mouse") {
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
      const trail = lasers.get(e.pointerId);
      if (!l && !eraser && !trail) return;

      if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
      live.delete(e.pointerId);
      erasers.delete(e.pointerId);
      lasers.delete(e.pointerId);

      // `pointercancel` da ham saqlanadi: brauzer harakatni tortib olsa
      // ham oʻqituvchi yozgani yoʻqolmasin.
      if (l) commit(l);
      // Lazer izi darhol yoʻqolmaydi — oʻzi soʻnadi.
      if (trail) fading.push(trail);
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
       yuborilgan chiziq bir kadr ham yoʻqolib qolmaydi. Slaydga
       bogʻlangan yozuv ham shunday: vidjet surilsa yoki slayd almashsa
       (`anchorsKey`) — shu zahoti.

       Fon va uslub esa bir kadr kutadi: `data-bg-tone` va
       `data-doska-style` ni React keyinroq qoʻyadi, token qiymati shundan
       keyin oʻzgaradi.

       Ekran almashsa (strelka, pult) yozilayotgan chiziqlar DARHOL oʻz
       ekraniga saqlanib yakunlanadi: aks holda chiziq yangi ekran ustida
       chizilishda davom etib, qoʻyib yuborilganda koʻzdan gʻoyib boʻlardi.
       Oʻchirgʻich va lazer ham toʻxtaydi — yangi ekranda davom ettirmasin. */
    let lastScreen = activeScreen();
    let lastInk = lastScreen?.ink;
    let lastAnchors = anchorsKey(lastScreen);
    let lastBackground = lastScreen?.background;
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
        lasers.clear();
        fading = [];
        for (const l of pending) commit(l);
        schedule();
      }
      const screen = activeScreen();
      if (screen === lastScreen) return;
      lastScreen = screen;

      const anchors = anchorsKey(screen);
      if (screen?.ink !== lastInk || anchors !== lastAnchors) {
        lastInk = screen?.ink;
        lastAnchors = anchors;
        drawDry();
      }
      if (screen?.background !== lastBackground) {
        lastBackground = screen?.background;
        redrawNextFrame();
      }
    });
    const unsubPrefs = useDoskaPrefs.subscribe((s, prev) => {
      if (s.style !== prev.style) redrawNextFrame();
    });
    const unsubTool = useInkTool.subscribe((s, prev) => {
      if (s.mode !== prev.mode && s.mode !== "eraser" && s.mode !== "laser" && hover) {
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
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(bgFrame);
      for (const l of live.values()) window.clearTimeout(l.holdTimer);
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
