"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import { useInkTool } from "@/lib/doska/ink-tool";
import { isClaimedByInk } from "@/lib/doska/interaction";
import { Z_INK_GUIDE } from "@/lib/doska/layers";
import {
  PROTRACTOR_RADIUS,
  RULER_LENGTH,
  RULER_MARGIN,
  RULER_UNIT,
  RULER_WIDTH,
  clampGuidePose,
  guideAngleLabel,
  snapGuideAngle,
  type GuideKind,
  type GuidePose,
} from "@/lib/doska/guides";
import { IconClose, IconRestart } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   CHIZGʻICH VA TRANSPORTIR — doska ustidagi shaffof asboblar
   (docs/doska-qolyozma-tadqiqot.md §9). Geometriyasi va «chetga
   yopishish» — `lib/doska/guides.ts`, chizishning oʻzi — `InkLayer`.

   Boshqaruv haqiqiy asbobdagidek:
     • bir barmoq (sichqoncha) — suradi;
     • ikki barmoq — suradi va buradi;
     • aylana tutqich — buradi (sichqoncha va bitta barmoq uchun).
   Burchak 15° ga yaqinlashsa yopishadi va asbob ustida yoziladi.

   ⚠️ Qalam asbob ustida YOZADI, barmoq esa SURADI: `InkLayer` qalam
   bosishini ildizda egallaydi (`claimForInk`) va bu yerda u
   eʼtiborsiz qoldiriladi. Qalami yoʻq panelda barmoq chet yonidan —
   asbobdan tashqarida — boshlab yozadi.

   Asbob markazi kanvasdan chiqib ketmaydi (`clampGuidePose`) — aks holda
   chetga otib yuborilgan asbobni qaytarib boʻlmasdi.

   Yozish rejimida koʻrinadi; «Markazga» rejimida va rasmga saqlashda
   (`data-doska-no-export`) — yoʻq.
   ════════════════════════════════════════════════════════════════════ */

type Pt = { x: number; y: number };

/** Transportirda tutqich va yopish tugmasi asbobdan shuncha (px) narida. */
const KNOB_GAP = 30;
/** Tugma oʻlchami — barmoq nishoni ≥ 44 px (R321). */
const KNOB = 44;

export function InkGuides() {
  const mode = useInkTool((s) => s.mode);
  const ruler = useInkTool((s) => s.ruler);
  const protractor = useInkTool((s) => s.protractor);
  const spotlight = useDoskaStore((s) => s.spotlightId !== null);
  if (!mode || spotlight) return null;
  return (
    <>
      {ruler && <Guide kind="ruler" pose={ruler} />}
      {protractor && <Guide kind="protractor" pose={protractor} />}
    </>
  );
}

function Guide({ kind, pose }: { kind: GuideKind; pose: GuidePose }) {
  const t = useTranslations("Doska.ink");
  const ref = React.useRef<HTMLDivElement>(null);
  const setPose = useInkTool((s) => s.setGuidePose);
  const toggleGuide = useInkTool((s) => s.toggleGuide);

  /** Asbobga tekkan barmoqlar (kanvas koordinatasida) va harakat boshidagi holat. */
  const pointers = React.useRef(new Map<number, Pt>());
  const base = React.useRef<{ pose: GuidePose; pts: Pt[] } | null>(null);
  const knob = React.useRef<number | null>(null);

  /**
   * Ishlovchilar BARQAROR (holatni `getState()` dan oʻqiydi): yuz (SVG
   * shkala, 20–40 matn) `React.memo` bilan har sudrash qadamida qayta
   * chizilmasin — harakatda faqat idishning `transform` i oʻzgaradi.
   */
  const handlers = React.useMemo(() => {
    const current = () => useInkTool.getState()[kind];

    const toCanvas = (e: React.PointerEvent): Pt => {
      const rect = (ref.current?.offsetParent as HTMLElement | null)?.getBoundingClientRect();
      return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
    };

    const place = (next: GuidePose) => {
      const canvas = ref.current?.offsetParent as HTMLElement | null;
      setPose(kind, canvas ? clampGuidePose(next, canvas.clientWidth, canvas.clientHeight) : next);
    };

    /** Barmoq qoʻshilsa yoki ketsa harakat yangi holatdan davom etadi — asbob sakramaydi. */
    const rebase = () => {
      const pose = current();
      const pts = [...pointers.current.values()].slice(0, 2);
      base.current = pose && pts.length ? { pose, pts: pts.map((p) => ({ ...p })) } : null;
    };

    const grab = (e: React.PointerEvent): boolean => {
      // Qalam yozyapti — `InkLayer` egallagan.
      if (isClaimedByInk(e.nativeEvent)) return false;
      if (e.pointerType === "mouse" && e.button !== 0) return false;
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      return true;
    };

    const bodyUp = (e: React.PointerEvent) => {
      if (pointers.current.delete(e.pointerId)) rebase();
    };

    const knobUp = () => {
      knob.current = null;
    };

    return {
      body: {
        onPointerDown: (e: React.PointerEvent) => {
          if (!grab(e)) return;
          pointers.current.set(e.pointerId, toCanvas(e));
          rebase();
        },
        onPointerMove: (e: React.PointerEvent) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, toCanvas(e));
          const b = base.current;
          if (!b) return;
          const now = [...pointers.current.values()].slice(0, 2);
          if (b.pts.length < 2 || now.length < 2) {
            place({ ...b.pose, x: b.pose.x + now[0].x - b.pts[0].x, y: b.pose.y + now[0].y - b.pts[0].y });
            return;
          }
          // Ikki barmoq: barmoqlar oʻrtasi atrofida buriladi va u bilan suriladi.
          const turn =
            Math.atan2(now[1].y - now[0].y, now[1].x - now[0].x) -
            Math.atan2(b.pts[1].y - b.pts[0].y, b.pts[1].x - b.pts[0].x);
          const m0 = { x: (b.pts[0].x + b.pts[1].x) / 2, y: (b.pts[0].y + b.pts[1].y) / 2 };
          const m1 = { x: (now[0].x + now[1].x) / 2, y: (now[0].y + now[1].y) / 2 };
          const cx = b.pose.x - m0.x;
          const cy = b.pose.y - m0.y;
          place({
            x: m1.x + cx * Math.cos(turn) - cy * Math.sin(turn),
            y: m1.y + cx * Math.sin(turn) + cy * Math.cos(turn),
            angle: snapGuideAngle(b.pose.angle + (turn * 180) / Math.PI),
          });
        },
        onPointerUp: bodyUp,
        onPointerCancel: bodyUp,
      } satisfies BodyHandlers,
      knob: {
        onPointerDown: (e: React.PointerEvent) => {
          const c = current();
          if (!c || !grab(e)) return;
          const p = toCanvas(e);
          knob.current = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI - c.angle;
        },
        onPointerMove: (e: React.PointerEvent) => {
          const c = current();
          if (knob.current === null || !c) return;
          const p = toCanvas(e);
          const angle = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI - knob.current;
          setPose(kind, { ...c, angle: snapGuideAngle(angle) });
        },
        onPointerUp: knobUp,
        onPointerCancel: knobUp,
      },
    };
  }, [kind, setPose]);

  // Tugmalar asbob bilan birga buriladi. Chizgʻichda — tanasining ICHIDA,
  // pastki burchaklarda: tashqarida boʻlsa 720 px chizgʻich tor ekranda
  // tugmalarini kanvasdan chiqarib yuborardi, chet yonida esa qalam
  // chizigʻiga xalal berardi. Transportirda — yoy tepasida va oʻngda.
  const inset = KNOB / 2 + 8;
  const knobAt: Pt =
    kind === "ruler"
      ? { x: RULER_LENGTH / 2 - inset, y: RULER_WIDTH / 2 - inset }
      : { x: 0, y: -PROTRACTOR_RADIUS - KNOB_GAP };
  const closeAt: Pt =
    kind === "ruler"
      ? { x: -RULER_LENGTH / 2 + inset, y: RULER_WIDTH / 2 - inset }
      : { x: PROTRACTOR_RADIUS + KNOB_GAP, y: -KNOB / 2 };
  const buttonClass =
    "doska-bar doska-ctl pointer-events-auto absolute grid place-items-center rounded-full transition-colors";

  return (
    <div
      ref={ref}
      data-ink-guide={kind}
      data-doska-no-export=""
      className="pointer-events-none absolute top-0 left-0 select-none"
      style={{ transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.angle}deg)`, zIndex: Z_INK_GUIDE }}
    >
      {kind === "ruler" ? (
        <RulerFace label={guideAngleLabel(pose.angle)} handlers={handlers.body} />
      ) : (
        <ProtractorFace handlers={handlers.body} />
      )}

      <button
        type="button"
        aria-label={t("rotate")}
        {...handlers.knob}
        className={`${buttonClass} cursor-grab touch-none active:cursor-grabbing`}
        style={{ left: knobAt.x - KNOB / 2, top: knobAt.y - KNOB / 2, width: KNOB, height: KNOB }}
      >
        <IconRestart className="size-5" />
      </button>
      <button
        type="button"
        aria-label={t("hideGuide", { guide: t(kind) })}
        onClick={() => toggleGuide(kind)}
        className={`${buttonClass} hover:bg-muted`}
        style={{ left: closeAt.x - KNOB / 2, top: closeAt.y - KNOB / 2, width: KNOB, height: KNOB }}
      >
        <IconClose className="size-5" />
      </button>
    </div>
  );
}

type BodyHandlers = Pick<
  React.SVGProps<SVGPathElement>,
  "onPointerDown" | "onPointerMove" | "onPointerUp" | "onPointerCancel"
>;

const BODY_CLASS = "fill-background/75 stroke-foreground/40 cursor-grab active:cursor-grabbing";
const TICK_CLASS = "stroke-foreground/80";
const LABEL_CLASS = "fill-foreground/80";

/* ── Chizgʻich ── */

const RULER_UNITS = Math.floor((RULER_LENGTH - RULER_MARGIN * 2) / RULER_UNIT);
/** Birlik oʻnga boʻlinadi — maktab chizgʻichidagi millimetrlar kabi. */
const RULER_TICKS = (() => {
  const top = -RULER_WIDTH / 2;
  const bottom = RULER_WIDTH / 2;
  let d = "";
  for (let i = 0; i <= RULER_UNITS * 10; i++) {
    const x = -RULER_LENGTH / 2 + RULER_MARGIN + (i * RULER_UNIT) / 10;
    const len = i % 10 === 0 ? 22 : i % 5 === 0 ? 14 : 8;
    d += `M${x} ${top}v${len}`;
    if (i % 10 === 0) d += `M${x} ${bottom}v-10`;
  }
  return d;
})();

const RulerFace = React.memo(function RulerFace({ label, handlers }: { label: number; handlers: BodyHandlers }) {
  const hl = RULER_LENGTH / 2;
  const hw = RULER_WIDTH / 2;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -hl, top: -hw }}
      width={RULER_LENGTH}
      height={RULER_WIDTH}
      viewBox={`${-hl} ${-hw} ${RULER_LENGTH} ${RULER_WIDTH}`}
    >
      <path
        d={`M${-hl + 10} ${-hw}H${hl - 10}Q${hl} ${-hw} ${hl} ${-hw + 10}V${hw - 10}Q${hl} ${hw} ${hl - 10} ${hw}H${-hl + 10}Q${-hl} ${hw} ${-hl} ${hw - 10}V${-hw + 10}Q${-hl} ${-hw} ${-hl + 10} ${-hw}Z`}
        className={BODY_CLASS}
        strokeWidth={1.5}
        style={{ pointerEvents: "auto" }}
        {...handlers}
      />
      <path d={RULER_TICKS} className={TICK_CLASS} strokeWidth={1.2} />
      {Array.from({ length: RULER_UNITS + 1 }, (_, i) => (
        <text
          key={i}
          x={-hl + RULER_MARGIN + i * RULER_UNIT}
          y={-hw + 38}
          textAnchor="middle"
          fontSize={13}
          className={LABEL_CLASS}
        >
          {i}
        </text>
      ))}
      <text x={0} y={hw - 16} textAnchor="middle" fontSize={15} fontWeight={600} className={LABEL_CLASS}>
        {label}°
      </text>
    </svg>
  );
});

/* ── Transportir ── */

const R = PROTRACTOR_RADIUS;
const polar = (r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), -r * Math.sin(a)];
};
const PROTRACTOR_TICKS = (() => {
  let d = "";
  for (let deg = 0; deg <= 180; deg++) {
    const len = deg % 10 === 0 ? 20 : deg % 5 === 0 ? 13 : 7;
    const [x1, y1] = polar(R, deg);
    const [x2, y2] = polar(R - len, deg);
    d += `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }
  return d;
})();
const PROTRACTOR_LABELS = Array.from({ length: 19 }, (_, i) => i * 10);

const ProtractorFace = React.memo(function ProtractorFace({ handlers }: { handlers: BodyHandlers }) {
  const inner = R - 72;
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute overflow-visible"
      style={{ left: -R, top: -R }}
      width={R * 2}
      height={R}
      viewBox={`${-R} ${-R} ${R * 2} ${R}`}
    >
      <path
        d={`M${-R} 0A${R} ${R} 0 0 1 ${R} 0Z`}
        className={BODY_CLASS}
        strokeWidth={1.5}
        style={{ pointerEvents: "auto" }}
        {...handlers}
      />
      <path d={PROTRACTOR_TICKS} className={TICK_CLASS} strokeWidth={1.2} />
      <path d={`M${-inner} 0A${inner} ${inner} 0 0 1 ${inner} 0`} fill="none" className="stroke-foreground/30" />
      {/* Markaz — burchak uchi shu nuqtaga qoʻyiladi. */}
      <path d="M0 0V-22M-10 0H10" className={TICK_CLASS} strokeWidth={1.5} />
      <circle r={3.5} className="fill-foreground" />
      {PROTRACTOR_LABELS.map((deg) => {
        const [ox, oy] = polar(R - 34, deg);
        const [ix, iy] = polar(R - 56, deg);
        return (
          <React.Fragment key={deg}>
            <text
              x={ox}
              y={oy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              transform={`rotate(${90 - deg} ${ox} ${oy})`}
              className={LABEL_CLASS}
            >
              {deg}
            </text>
            <text
              x={ix}
              y={iy}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={11}
              transform={`rotate(${90 - deg} ${ix} ${iy})`}
              className="fill-foreground/55"
            >
              {180 - deg}
            </text>
          </React.Fragment>
        );
      })}
    </svg>
  );
});
