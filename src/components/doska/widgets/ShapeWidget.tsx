"use client";

import type { DoskaWidget } from "@/lib/doska/types";
import {
  centroid,
  shapeById,
  toPixels,
  unitVector,
  VERTEX_LETTERS,
  type ShapeDef,
} from "@/lib/doska/shapes";

/* ════════════════════════════════════════════════════════════════════
   GEOMETRIK SHAKL — matematika darsi uchun chizma.

   Matn vidjeti kabi IDISHSIZ: fon ham, soya ham yoʻq, faqat chiziq.
   Chizma rangi `--doska-ink`, yaʼni toʻq fonda oʻzi bo'r rangiga
   oʻtadi — yashil doskada figura bo'r bilan chizilgandek koʻrinadi.
   Geometriya uchun aynan shu toʻgʻri: figura — chizma, kartochka emas.

   ⚠️ `viewBox` vidjetning PIKSEL oʻlchamiga teng (1:1). Shu sababli
   chiziq qalinligi shakl choʻzilganda oʻzgarmaydi. Agar `viewBox`
   qatʼiy (masalan `0 0 100 100`) boʻlsa va SVG choʻzilsa, gorizontal
   va vertikal chiziqlar HAR XIL qalinlikda chiqardi — chizma
   qoʻlbolaga oʻxshab qolardi.
   ════════════════════════════════════════════════════════════════════ */

export function ShapeWidget({ widget }: { widget: DoskaWidget }) {
  const def = shapeById(widget.state.shape);
  const showLabels = widget.state.labels !== false;

  const { w, h } = widget;

  // Yorliq oʻlchami figuraning kichik oʻlchamidan olinadi — cho'zilgan
  // shaklda ham harf figuraga nisbatan bir xil koʻrinsin.
  const font = Math.max(11, Math.min(Math.min(w, h) * 0.12, 40));
  const stroke = Math.max(2, Math.min(Math.min(w, h) * 0.012, 4));

  // Koʻpburchakda yorliqlar uchlardan TASHQARIDA turadi, shuning uchun
  // figuraning oʻzi ichkariga siqiladi.
  //
  // ⚠️ Aylanada esa yorliq — markaz `O`, yaʼni ICHKARIDA. Unga chetdan
  // joy kerak emas va berilsa aylana quti ichida sababsiz kichrayib
  // qoladi (birinchi variantda aynan shunday boʻlgan edi).
  const pad = def.points && showLabels ? font * 1.25 : stroke;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="block size-full overflow-visible"
      style={{ color: "var(--doska-ink)" }}
      aria-label={def.label}
    >
      {def.points ? (
        <Polygon def={def} w={w} h={h} pad={pad} stroke={stroke} font={font} labels={showLabels} />
      ) : (
        <Circle w={w} h={h} pad={pad} stroke={stroke} font={font} labels={showLabels} />
      )}
    </svg>
  );
}

function Polygon({
  def,
  w,
  h,
  pad,
  stroke,
  font,
  labels,
}: {
  def: ShapeDef;
  w: number;
  h: number;
  pad: number;
  stroke: number;
  font: number;
  labels: boolean;
}) {
  const points = toPixels(def.points ?? [], w, h, pad);
  const center = centroid(points);

  return (
    <>
      <polygon
        points={points.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />

      {def.rightAngleAt !== undefined && (
        <RightAngleMark points={points} at={def.rightAngleAt} stroke={stroke} font={font} />
      )}

      {labels &&
        points.map(([x, y], i) => {
          // Yorliq markazdan uchga qarab TASHQARIGA suriladi — shunda u
          // hech qachon figuraning ichiga tushmaydi va chiziqni
          // toʻsmaydi. Yoʻnalish piksel fazosida hisoblanadi: choʻzilgan
          // shaklda birlik kvadratdagi yoʻnalish notoʻgʻri boʻlardi.
          const [dx, dy] = unitVector(center, [x, y]);
          return (
            <text
              key={i}
              x={x + dx * font * 0.9}
              y={y + dy * font * 0.9}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={font}
              fontWeight={500}
              fill="currentColor"
            >
              {VERTEX_LETTERS[i] ?? ""}
            </text>
          );
        })}
    </>
  );
}

/**
 * Toʻgʻri burchak kvadratchasi — uchdan ikki qoʻshni tomon boʻylab
 * teng masofada chiziladigan burchak.
 *
 * Toʻldirilmaydi (`fill="none"`): toʻldirilgan kvadratcha bo'r rejimida
 * figuraning ichida qora dogʻ boʻlib koʻrinadi.
 */
function RightAngleMark({
  points,
  at,
  stroke,
  font,
}: {
  points: [number, number][];
  at: number;
  stroke: number;
  font: number;
}) {
  const n = points.length;
  const corner = points[at];
  const prev = points[(at - 1 + n) % n];
  const next = points[(at + 1) % n];
  if (!corner || !prev || !next) return null;

  const [ux, uy] = unitVector(corner, prev);
  const [vx, vy] = unitVector(corner, next);
  const size = Math.max(8, Math.min(font * 0.6, 20));

  const a: [number, number] = [corner[0] + ux * size, corner[1] + uy * size];
  const b: [number, number] = [a[0] + vx * size, a[1] + vy * size];
  const c: [number, number] = [corner[0] + vx * size, corner[1] + vy * size];

  return (
    <polyline
      points={`${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinejoin="round"
    />
  );
}

/**
 * Aylana — choʻzilganda ellips boʻladi.
 *
 * Yorliq sifatida markaz `O` qoʻyiladi: aylananing «uchi» yoʻq, lekin
 * markazsiz u geometrik obyekt emas, shunchaki halqa — radius ham,
 * diametr ham markazdan oʻlchanadi.
 */
function Circle({
  w,
  h,
  pad,
  stroke,
  font,
  labels,
}: {
  w: number;
  h: number;
  pad: number;
  stroke: number;
  font: number;
  labels: boolean;
}) {
  const cx = w / 2;
  const cy = h / 2;

  return (
    <>
      <ellipse
        cx={cx}
        cy={cy}
        rx={Math.max(1, w / 2 - pad)}
        ry={Math.max(1, h / 2 - pad)}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
      />

      {labels && (
        <>
          <circle cx={cx} cy={cy} r={Math.max(2, stroke)} fill="currentColor" />
          <text
            // Nuqtadan chapga-yuqoriga suriladi: ustiga tushsa harf ham,
            // markaz ham oʻqilmay qoladi.
            x={cx - font * 0.75}
            y={cy - font * 0.7}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={font}
            fontWeight={500}
            fill="currentColor"
          >
            O
          </text>
        </>
      )}
    </>
  );
}
