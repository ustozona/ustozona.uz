import type { AiInfographic, AiMindMap } from "@/lib/ai-materials";
import { CLASS_COLOR_HEX, oklchToHex, type ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   AQLIY XARITA VA INFOGRAFIKA — AI javobidan RASM (16:9 PNG).

   Nega rasm: bitta natija uch joyda ishlaydi —
     • taqdimot slaydi («Katta media» maketi) — smartdoska/proyektor;
     • PNG yuklab olish — messenjerda ulashish;
     • chop etish (A4 albom) — proyektorsiz sinfda doskaga ilinadi.
   Yangi slayd turi ham, yangi baza ustuni ham kerak boʻlmadi.

   Chizish SVG satr sifatida, keyin <canvas> orqali PNG. Rasm ichida
   veb-shrift yuklanmaydi (brauzer <img> ichidagi SVG ga tashqi manba
   bermaydi), shuning uchun tizim shrifti va matn eni oʻsha shrift
   bilan <canvas> da oʻlchanadi — qator koʻchishi aniq chiqadi.

   Ranglar: rasm CSS tokenlarini oʻqiy olmaydi (u sahifadan ajralgan
   fayl), shuning uchun sinf rang dvigatelidan (`CLASS_COLOR_HEX`,
   OKLCH manba) olinadi — DESIGN.md §2 dagi yagona manba.
   ════════════════════════════════════════════════════════════════════ */

export const VISUAL_W = 1600;
export const VISUAL_H = 900;
/** PNG masshtabi — katta smartdoskada ham matn tiniq koʻrinsin. */
const PNG_SCALE = 1.5;

const FONT = `Arial, "Helvetica Neue", Helvetica, sans-serif`;
const INK = oklchToHex("oklch(0.26 0.01 260)");
const MUTED = oklchToHex("oklch(0.52 0.01 260)");
const PAPER = oklchToHex("oklch(1 0 0)");
const PALETTE: ClassColor[] = ["blue", "orange", "green", "violet", "rose", "teal"];
const color = (i: number) => CLASS_COLOR_HEX[PALETTE[i % PALETTE.length]];

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Measure = (text: string, size: number, weight?: number) => number;

function makeMeasure(): Measure {
  const ctx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  return (text, size, weight = 400) => {
    if (!ctx) return text.length * size * 0.56;
    ctx.font = `${weight} ${size}px ${FONT}`;
    return ctx.measureText(text).width;
  };
}

/** Soʻz boʻyicha qatorlarga boʻladi; sigʻmasa oxirgi qator «…» bilan tugaydi. */
function wrap(m: Measure, text: string, size: number, weight: number, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (!line || m(next, size, weight) <= maxWidth) {
      line = next;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  const fit = (s: string) => {
    let out = s;
    while (out.length > 1 && m(out, size, weight) > maxWidth) out = out.slice(0, -1);
    return out;
  };
  if (lines.length <= maxLines) return lines.map((l) => (m(l, size, weight) > maxWidth ? `${fit(l.slice(0, -1))}…` : l));
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && m(`${last}…`, size, weight) > maxWidth) last = last.slice(0, -1).trimEnd();
  kept[maxLines - 1] = `${last}…`;
  return kept;
}

function textBlock(
  lines: string[],
  x: number,
  y: number,
  size: number,
  lineHeight: number,
  attrs: string,
): string {
  const spans = lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" font-family='${FONT}' font-size="${size}" ${attrs}>${spans}</text>`;
}

function frame(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VISUAL_W}" height="${VISUAL_H}" viewBox="0 0 ${VISUAL_W} ${VISUAL_H}"><rect width="${VISUAL_W}" height="${VISUAL_H}" fill="${PAPER}"/>${inner}</svg>`;
}

/* ── AQLIY XARITA ──────────────────────────────────────────────────
   Markaz — toʻq tugun, shoxchalar ikki tomonga navbat bilan: oʻngda
   birinchi yarmi, chapda qolgani. Har shoxcha — rangli yorliq va
   ostida bandlar; markazdan egri chiziq bilan ulanadi. */
export function mindMapSvg(data: AiMindMap): string {
  const m = makeMeasure();
  const MARGIN = 36;
  const BW = 440;
  const cx = VISUAL_W / 2;
  const cy = VISUAL_H / 2;

  const centerLines = wrap(m, data.center, 38, 700, 320, 3);
  const cw = Math.min(420, Math.max(260, Math.max(...centerLines.map((l) => m(l, 38, 700))) + 80));
  const ch = centerLines.length * 46 + 48;

  const n = data.branches.length;
  const rightCount = Math.ceil(n / 2);
  const links: string[] = [];
  const boxes: string[] = [];

  data.branches.forEach((b, i) => {
    const right = i < rightCount;
    const k = right ? rightCount : n - rightCount;
    // Soat mili boʻyicha: oʻngda yuqoridan pastga, chapda pastdan yuqoriga.
    const j = right ? i : k - 1 - (i - rightCount);
    const slotH = (VISUAL_H - 2 * MARGIN) / k;
    const slotTop = MARGIN + j * slotH;
    const hex = color(i);
    const x = right ? VISUAL_W - MARGIN - BW : MARGIN;

    const labelLines = wrap(m, b.label, 26, 700, BW - 48, 2);
    const pillH = labelLines.length * 32 + 20;

    // Bandlar sigʻmasa avval bir qatorga qisqartiriladi, keyin oxiridan tashlanadi.
    const room = slotH - 16 - pillH - 32;
    let itemLines: string[][] = b.items.map((it) => wrap(m, it, 21, 400, BW - 64, 2));
    const total = () => itemLines.reduce((s, l) => s + l.length, 0) * 28;
    if (total() > room) itemLines = b.items.map((it) => wrap(m, it, 21, 400, BW - 64, 1));
    while (itemLines.length && total() > room) itemLines = itemLines.slice(0, -1);

    const boxH = pillH + (itemLines.length ? 14 + total() + 18 : 0);
    const y = slotTop + (slotH - boxH) / 2;
    const pillMid = y + pillH / 2;

    const x0 = right ? cx + cw / 2 : cx - cw / 2;
    const x1 = right ? x : x + BW;
    const mid = (x0 + x1) / 2;
    links.push(
      `<path d="M ${x0} ${cy} C ${mid} ${cy}, ${mid} ${pillMid}, ${x1} ${pillMid}" fill="none" stroke="${hex}" stroke-width="5" stroke-linecap="round"/>`,
    );

    boxes.push(
      `<rect x="${x}" y="${y}" width="${BW}" height="${boxH}" rx="22" fill="${hex}" fill-opacity="0.1" stroke="${hex}" stroke-opacity="0.45" stroke-width="2"/>`,
      `<rect x="${x}" y="${y}" width="${BW}" height="${pillH}" rx="22" fill="${hex}"/>`,
      textBlock(labelLines, x + 24, y + 10 + 26, 26, 32, `font-weight="700" fill="${PAPER}"`),
    );
    let ty = y + pillH + 14 + 21;
    for (const lines of itemLines) {
      boxes.push(
        `<circle cx="${x + 32}" cy="${ty - 7}" r="5" fill="${hex}"/>`,
        textBlock(lines, x + 48, ty, 21, 28, `fill="${INK}"`),
      );
      ty += lines.length * 28;
    }
  });

  const center = [
    `<rect x="${cx - cw / 2}" y="${cy - ch / 2}" width="${cw}" height="${ch}" rx="28" fill="${INK}"/>`,
    `<text x="${cx}" y="${cy - ch / 2 + 24 + 38}" font-family='${FONT}' font-size="38" font-weight="700" fill="${PAPER}" text-anchor="middle">${centerLines
      .map((l, i) => `<tspan x="${cx}" dy="${i === 0 ? 0 : 46}">${esc(l)}</tspan>`)
      .join("")}</text>`,
  ];

  return frame(links.join("") + boxes.join("") + center.join(""));
}

/* ── INFOGRAFIKA ───────────────────────────────────────────────────
   Sarlavha + izoh, ostida 2–6 ta raqamli kartochka (4 tagacha — 2
   ustun, koʻprogʻi — 3 ustun). Chala qator markazga suriladi.

   Shrift oʻlchami MOSLASHADI: barcha kartochkaga sigʻadigan eng katta
   oʻlcham tanlanadi (hammasida bir xil — koʻz bir ritmda oʻqiydi).
   Qisqa faktlar katta harf bilan kartani toʻldiradi va sinfning oxirgi
   partasidan ham oʻqiladi; uzunlari kichrayadi, lekin kesilmaydi. */
const HEAD_SIZES = [36, 32, 30, 28];
const BODY_SIZES = [36, 34, 32, 30, 28, 26, 24, 22];

export function infographicSvg(data: AiInfographic): string {
  const m = makeMeasure();
  const PAD = 64;
  const parts: string[] = [];

  const titleLines = wrap(m, data.title, 52, 700, VISUAL_W - 2 * PAD, 2);
  parts.push(textBlock(titleLines, PAD, 96, 52, 60, `font-weight="700" fill="${INK}"`));
  let y = 96 + (titleLines.length - 1) * 60 + 26;
  parts.push(`<rect x="${PAD}" y="${y}" width="120" height="8" rx="4" fill="${color(0)}"/>`);
  y += 20;
  if (data.subtitle) {
    const sub = wrap(m, data.subtitle, 26, 400, VISUAL_W - 2 * PAD, 2);
    parts.push(textBlock(sub, PAD, y + 30, 26, 34, `fill="${MUTED}"`));
    y += 30 + (sub.length - 1) * 34 + 12;
  }

  const n = data.facts.length;
  const cols = n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const GAP = 28;
  const top = y + 28;
  const bottom = VISUAL_H - 48;
  const cardW = (VISUAL_W - 2 * PAD - GAP * (cols - 1)) / cols;
  const cardH = (bottom - top - GAP * (rows - 1)) / rows;
  const headW = cardW - 124;
  const bodyW = cardW - 64;

  /* Sarlavha: hammasi 2 qatorga sigʻadigan eng katta oʻlcham. */
  const headSize =
    HEAD_SIZES.find((sz) => data.facts.every((f) => !f.head || wrap(m, f.head, sz, 700, headW, Infinity).length <= 2)) ??
    HEAD_SIZES[HEAD_SIZES.length - 1];
  const headLH = Math.round(headSize * 1.2);
  const r = 26;

  /* Kartochka ichidagi geometriya — sarlavha qator soniga bogʻliq. */
  const layout = data.facts.map((f) => {
    const head = f.head ? wrap(m, f.head, headSize, 700, headW, 2) : [];
    const badgeCy = 28 + r;
    const firstHead = badgeCy - ((head.length - 1) * headLH) / 2 + headSize * 0.35;
    const headBottom = Math.max(badgeCy + r, firstHead + (head.length - 1) * headLH + headSize * 0.3);
    return { head, badgeCy, firstHead, headBottom };
  });

  /* Matn: hamma kartochkaga toʻliq sigʻadigan eng katta oʻlcham. */
  const fits = (sz: number) =>
    data.facts.every((f, i) => {
      if (!f.text) return true;
      const lh = Math.round(sz * 1.4);
      const avail = cardH - layout[i].headBottom - 20 - 24;
      return wrap(m, f.text, sz, 400, bodyW, Infinity).length * lh <= avail;
    });
  const bodySize = BODY_SIZES.find(fits) ?? BODY_SIZES[BODY_SIZES.length - 1];
  const bodyLH = Math.round(bodySize * 1.4);

  data.facts.forEach((f, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const shift = ((cols - inRow) * (cardW + GAP)) / 2;
    const x = PAD + shift + (i % cols) * (cardW + GAP);
    const cy = top + row * (cardH + GAP);
    const hex = color(i);
    const L = layout[i];

    parts.push(
      `<rect x="${x}" y="${cy}" width="${cardW}" height="${cardH}" rx="24" fill="${hex}" fill-opacity="0.08" stroke="${hex}" stroke-opacity="0.4" stroke-width="2"/>`,
      `<circle cx="${x + 52}" cy="${cy + L.badgeCy}" r="${r}" fill="${hex}"/>`,
      `<text x="${x + 52}" y="${cy + L.badgeCy + 9}" font-family='${FONT}' font-size="26" font-weight="700" fill="${PAPER}" text-anchor="middle">${i + 1}</text>`,
    );
    if (L.head.length) {
      parts.push(textBlock(L.head, x + 96, cy + L.firstHead, headSize, headLH, `font-weight="700" fill="${INK}"`));
    }
    if (f.text) {
      const bodyTop = cy + L.headBottom + 20 + bodySize;
      const maxLines = Math.max(1, Math.floor((cy + cardH - 24 - (bodyTop - bodySize)) / bodyLH));
      const body = wrap(m, f.text, bodySize, 400, bodyW, maxLines);
      parts.push(textBlock(body, x + 32, bodyTop, bodySize, bodyLH, `fill="${INK}" fill-opacity="0.85"`));
    }
  });

  return frame(parts.join(""));
}

/* ── PNG, YUKLAB OLISH, CHOP ETISH ─────────────────────────────── */

export async function svgToPng(svg: string): Promise<string> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("svg"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(VISUAL_W * PNG_SCALE);
    canvas.height = Math.round(VISUAL_H * PNG_SCALE);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Fayl nomi — mavzudan, xavfli belgilarsiz. */
function fileName(title: string): string {
  const base = title.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return `${base || "ustozona"}.png`;
}

export function downloadPng(dataUrl: string, title: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName(title);
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** A4 albom varagʻida chop etish — yashirin iframe orqali (popup kerak emas). */
export function printPng(dataUrl: string, title: string) {
  const frameEl = document.createElement("iframe");
  frameEl.setAttribute("aria-hidden", "true");
  Object.assign(frameEl.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  frameEl.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page{size:A4 landscape;margin:10mm}html,body{margin:0}img{display:block;width:100%;height:auto}</style></head><body><img src="${dataUrl}" alt=""></body></html>`;
  frameEl.onload = () => {
    const win = frameEl.contentWindow;
    const img = frameEl.contentDocument?.querySelector("img");
    const go = () => {
      win?.focus();
      win?.print();
      setTimeout(() => frameEl.remove(), 60_000);
    };
    if (!img || img.complete) go();
    else img.onload = go;
  };
  document.body.appendChild(frameEl);
}
