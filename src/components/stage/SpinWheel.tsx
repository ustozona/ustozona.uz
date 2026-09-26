"use client";

import * as React from "react";

import { classColorValue } from "@/lib/class-colors";
import {
  fitSegmentLabel,
  segmentAngle,
  segmentAtPointer,
  segmentColor,
  spinEase,
  WHEEL_HUB,
  WHEEL_LABEL_END,
  WHEEL_RADIUS,
} from "@/lib/spin-wheel";

/* ════════════════════════════════════════════════════════════════════
   GʻILDIRAK — sof chizish komponenti (`stage` sirti).

   Nimani BILMAYDI: kim tanlanishi, roʻyxat qayerdan kelgani, natija
   qayerga yozilishi. U faqat ismlarni boʻlaklarga chizadi va berilgan
   burchakka aylanadi. Tasodif va holat — chaqiruvchida (Doska vidjeti,
   keyin Baholash shabloni va jonli dars, R111/R299).

   Burchak kelishuvi — `lib/spin-wheel.ts` sarlavhasida: koʻrsatkich
   oʻngda (0°), boʻlak `i` ning markazi `i * seg` da.

   ⚠️ Aylanish React holati orqali EMAS, `requestAnimationFrame` da
   `transform` atributini toʻgʻridan-toʻgʻri yozib chiziladi. 4 soniyada
   ~240 kadr — har birida React render qilsa 35 ta `<text>` qayta
   solishtiriladi va eski noutbukda gʻildirak tirmalaydi. React faqat
   tinch holatni (`rotation`) biladi.
   ════════════════════════════════════════════════════════════════════ */

export type SpinRequest = {
  /** Har aylanishga yangi raqam — bir soʻrov ikki marta ishga tushmasin. */
  id: number;
  /** Tugash burchagi — `targetRotation()` natijasi. */
  to: number;
  durationMs: number;
};

/**
 * Koʻrsatkich uchi — ism tugaydigan radiusdan TASHQARIDA.
 *
 * Ilgari uchi 86 da, ismlar esa 92 da tugardi: koʻrsatkich doim oʻz
 * ostidagi ismning — yaʼni aynan GʻOLIBNING — oxirgi harfini yopib
 * turardi. Ikkalasi shu doimiy orqali bogʻlangan: `LABEL_OUTER`
 * oʻzgarsa koʻrsatkich ham oʻzi suriladi.
 */
const POINTER_TIP = WHEEL_LABEL_END + 4;
const POINTER_BASE = POINTER_TIP + 17;
/** `viewBox` yarim oʻlchami: gʻildirak (100) + koʻrsatkich va soya uchun joy. */
const VIEW = POINTER_BASE + 3;
/**
 * Ikki «tiq» orasidagi eng qisqa vaqt. Aylanish boshida koʻrsatkich bir
 * kadrda bir necha boʻlakdan oʻtadi — har biriga ovoz berilsa tiqillash
 * vizillashga aylanadi.
 */
const TICK_GAP_MS = 35;

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

function segmentPath(index: number, count: number): string {
  const seg = segmentAngle(count);
  const a0 = ((index * seg - seg / 2) * Math.PI) / 180;
  const a1 = ((index * seg + seg / 2) * Math.PI) / 180;
  const r = WHEEL_RADIUS;
  return [
    "M 0 0",
    `L ${round(r * Math.cos(a0))} ${round(r * Math.sin(a0))}`,
    `A ${r} ${r} 0 ${seg > 180 ? 1 : 0} 1 ${round(r * Math.cos(a1))} ${round(r * Math.sin(a1))}`,
    "Z",
  ].join(" ");
}

/**
 * `memo` — Doskada har store oʻzgarishida (boshqa vidjetni sudrash,
 * matn yozish) hamma vidjet qayta chiziladi. Gʻildirakda 60 tagacha
 * boʻlak va yozuv bor — ularni har kadrda solishtirish sudrashni
 * tirmalatadi. Chaqiruvchi `entries` ni memo qilishi kerak.
 */
export const SpinWheel = React.memo(function SpinWheel({
  entries,
  rotation,
  spin,
  onTick,
  onSpinEnd,
  hint,
  className,
}: {
  /**
   * Boʻlaklar, soat mili boʻyicha. Aylanish davomida oʻzgarsa ham
   * gʻildirak aylanish BOSHIDAGI roʻyxatni chizadi — aks holda `to`
   * burchagi boshqa boʻlakka tushib qolardi.
   */
  entries: string[];
  /** Tinch holatdagi burchak (gradus). */
  rotation: number;
  spin?: SpinRequest | null;
  /** Koʻrsatkich boʻlak chegarasidan oʻtdi — tiq-tiq ovozi uchun. */
  onTick?: () => void;
  onSpinEnd?: (id: number) => void;
  /** Gʻildirak ustidagi egri yozuv («Bosing — aylanadi»). */
  hint?: string | null;
  className?: string;
}) {
  const rotorRef = React.useRef<SVGGElement>(null);
  const hintPathId = `spin-hint-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  // Aylanish boshidagi roʻyxat ushlab turiladi (render paytidagi holat
  // yangilanishi — Reactʼning «oldingi renderdan maʼlumot saqlash» naqshi).
  const [held, setHeld] = React.useState<{ id: number; entries: string[] } | null>(null);
  if (spin && held?.id !== spin.id) setHeld({ id: spin.id, entries });
  if (!spin && held) setHeld(null);
  const drawn = spin && held?.id === spin.id ? held.entries : entries;

  const count = drawn.length;
  const seg = segmentAngle(count);

  // Oxirgi qiymatlar refʼda: animatsiya effekti ular oʻzgarganda qayta
  // ishga tushmasligi kerak — aks holda gʻildirak yarim yoʻlda boshidan
  // aylana boshlardi.
  const restRef = React.useRef(rotation);
  const tickRef = React.useRef(onTick);
  const endRef = React.useRef(onSpinEnd);
  React.useEffect(() => {
    restRef.current = rotation;
    tickRef.current = onTick;
    endRef.current = onSpinEnd;
  });

  React.useEffect(() => {
    const rotor = rotorRef.current;
    if (!spin || !rotor) return;

    const from = restRef.current;
    const distance = spin.to - from;
    const start = performance.now();
    let lastSegment = segmentAtPointer(from, count);
    let lastTick = 0;
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / spin.durationMs);
      const angle = from + distance * spinEase(t);
      rotor.setAttribute("transform", `rotate(${round(angle)})`);

      const current = segmentAtPointer(angle, count);
      if (current !== lastSegment) {
        lastSegment = current;
        if (now - lastTick >= TICK_GAP_MS) {
          lastTick = now;
          tickRef.current?.();
        }
      }

      if (t < 1) frame = requestAnimationFrame(step);
      else endRef.current?.(spin.id);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [spin, count]);

  return (
    <svg
      viewBox={`${-VIEW} ${-VIEW} ${VIEW * 2} ${VIEW * 2}`}
      className={className}
      // ⚠️ `translate="no"` SVG tipida yoʻq — uni chaqiruvchi oʻrovchi
      // HTML elementga qoʻyadi: brauzer tarjimasi ismlarni buzmasin (R302).
      aria-hidden="true"
    >
      {/* Ofset soya — blur emas (docs/doska-dizayn-tizimi.md §7). Filtr
          ham emas: u aylanayotgan guruhni har kadrda qayta chizdirardi. */}
      <circle cy={4} r={WHEEL_RADIUS + 2} fill="var(--doska-wheel-edge)" />
      <circle r={WHEEL_RADIUS + 2} fill="var(--doska-wheel-rim)" />

      <g ref={rotorRef} transform={`rotate(${round(rotation)})`}>
        {count === 1 ? (
          <circle r={WHEEL_RADIUS} fill={classColorValue(segmentColor(0, 1))} />
        ) : (
          drawn.map((_, i) => (
            <path
              key={i}
              d={segmentPath(i, count)}
              fill={classColorValue(segmentColor(i, count))}
              stroke="var(--doska-wheel-rim)"
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          ))
        )}

        {drawn.map((name, i) => {
          const label = fitSegmentLabel(name, count);
          return (
            <text
              key={i}
              transform={`rotate(${round(i * seg)})`}
              x={WHEEL_LABEL_END}
              y={0}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={round(label.fontSize)}
              fontWeight={600}
              fill="var(--doska-wheel-ink)"
            >
              {label.text}
            </text>
          );
        })}
      </g>

      {/* Tugun — aylanmaydi, markaz koʻzga «qotib» turadi. */}
      <circle r={WHEEL_HUB} fill="var(--doska-wheel-rim)" stroke="var(--doska-wheel-ink)" strokeWidth={2.5} />
      <circle r={5} fill="var(--doska-wheel-ink)" />

      {/* Koʻrsatkich — oʻngda, markazga qarab. */}
      <path
        d={`M ${POINTER_TIP} 0 L ${POINTER_BASE} -9 L ${POINTER_BASE} 9 Z`}
        fill="var(--doska-wheel-ink)"
        stroke="var(--doska-wheel-rim)"
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {hint && (
        <>
          <defs>
            <path id={hintPathId} d="M -60 0 A 60 60 0 0 1 60 0" />
          </defs>
          <text
            fontSize={12}
            fontWeight={800}
            letterSpacing={0.4}
            textAnchor="middle"
            fill="var(--doska-wheel-rim)"
            stroke="var(--doska-wheel-ink)"
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            <textPath href={`#${hintPathId}`} startOffset="50%">
              {hint}
            </textPath>
          </text>
        </>
      )}
    </svg>
  );
});
