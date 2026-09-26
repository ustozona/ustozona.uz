#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   DOSKA USLUBLARI — PROYEKTOR SINOVI (docs/doska-ux-tadqiqot.md R324, Q1)

   Har uslub (Sokin, Oʻyinchoq, Doska) tokenlarini src/styles/doska.css
   dan oʻqiydi va matn/fon juftliklarini ikki sharoitda tekshiradi:

     • oddiy ekran                 — kontrast ≥ 4,5:1 (WCAG 1.4.3);
     • yuvilgan proyektor          — kontrast ≥ 3:1 (yirik matn chegarasi).
       Yorugʻ sinf simulyatsiyasi: toʻyinganlik 0,72 ga tushadi, qora
       25% gacha koʻtariladi (sRGB: c' = 0,25 + 0,75·c) — maketlardagi
       `contrast(.6) brightness(1.25) saturate(.72)` bilan bir xil.

   Tekshiriladi: har vidjet tusining matni (`--doska-{tus}-fg` /
   `-bg`), boshqaruv matni va yorliqlari, varaq matni (Sokinda u
   temadan olinadi — oʻtkazib yuboriladi), idishsiz siyoh och doskada
   va boʻr toʻq doskada. Shaffof rang (`/ 0.94`) ostidagi rang ustiga
   qoʻyib hisoblanadi; shaffof fon — eng och va eng toʻq doskada.

   OKLCH → sRGB bu yerda qayta yozilgan: `class-colors.ts` dagi
   `oklchToHex` TypeScript, skript esa build'siz toza Node'da ishlaydi.

   Ishlatish:  node scripts/doska-projector-check.mjs
   Yangi uslub yoki rang qoʻshilganda shu skript yashil boʻlishi shart.
   ════════════════════════════════════════════════════════════════════ */

import { readFileSync } from "node:fs";

const CSS = readFileSync("src/styles/doska.css", "utf8");

const STYLES = {
  sokin: /html\[data-product="doska"\],\s*\[data-doska-style="sokin"\]\s*\{([^}]*)\}/,
  oyinchoq: /\[data-doska-style="oyinchoq"\]\s*\{([^}]*)\}/,
  doska: /\[data-doska-style="doska"\]\s*\{([^}]*)\}/,
};

/** Doska fonlaridan ikkitasi — eng och va eng koʻp ishlatiladigan toʻq. */
const LIGHT_BG = "oklch(0.97 0.002 250)"; // oq taxta
const DARK_BG = "oklch(0.33 0.045 158)"; // yashil doska (standart)

const TINTS = ["blue", "amber", "slate", "teal", "note", "done"];

// `parse` va `toSrgb` pastda (function hoisting) — ular shu yerda ham ishlaydi.
const CANVASES = [LIGHT_BG, DARK_BG].map((v) => parse(v).rgb);

function tokens(block) {
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

/** `oklch(L C H / a)` → sRGB (0..1) va shaffoflik. Boshqa yozuv — `null`. */
function parse(value) {
  const m = /^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/.exec(value ?? "");
  if (!m) return null;
  const alpha = m[4] === undefined ? 1 : m[5] ? +m[4] / 100 : +m[4];
  return { rgb: toSrgb([+m[1], +m[2], +m[3]]), alpha };
}

/** Shaffof rangni ostidagi rang ustiga qoʻyadi — brauzer kabi, sRGB da. */
function over(top, under) {
  return top.rgb.map((c, i) => top.alpha * c + (1 - top.alpha) * under[i]);
}

function toSrgb([L, C, H]) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => {
    const x = Math.min(1, Math.max(0, c));
    return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  });
}

function projector([R, G, B]) {
  const s = 0.72;
  const r = (0.213 + 0.787 * s) * R + (0.715 - 0.715 * s) * G + (0.072 - 0.072 * s) * B;
  const g = (0.213 - 0.213 * s) * R + (0.715 + 0.285 * s) * G + (0.072 - 0.072 * s) * B;
  const b = (0.213 - 0.213 * s) * R + (0.715 - 0.715 * s) * G + (0.072 + 0.928 * s) * B;
  return [r, g, b].map((c) => 0.25 + 0.75 * Math.min(1, Math.max(0, c)));
}

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
function contrast(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

let failed = 0;
let checked = 0;

for (const [name, re] of Object.entries(STYLES)) {
  const block = re.exec(CSS)?.[1];
  if (!block) {
    console.error(`⛔ ${name}: uslub bloki doska.css da topilmadi`);
    failed++;
    continue;
  }
  const t = tokens(block);

  const pairs = [
    ...TINTS.map((tint) => [`${tint}`, t[`doska-${tint}-fg`], t[`doska-${tint}-bg`]]),
    ["boshqaruv matni", t["doska-ctl-fg"], t["doska-ctl-bg"]],
    ["boshqaruv yorligʻi", t["doska-ctl-muted"], t["doska-ctl-bg"]],
    ["varaq matni", t["doska-sheet-fg"], t["doska-sheet-bg"]],
    ["varaq izohi", t["doska-sheet-muted"], t["doska-sheet-bg"]],
    ["siyoh · oq taxta", t["doska-ink"], LIGHT_BG],
    ["boʻr · yashil doska", t["doska-chalk"], DARK_BG],
  ];

  console.log(`\n${name}`);
  for (const [label, fg, bg] of pairs) {
    const F = parse(fg);
    const B = parse(bg);
    // `var(--popover)` kabi temadan olinadigan qiymat — bu yerda emas.
    if (!F || !B) {
      console.log(`   ·  ${label.padEnd(20)} temadan — oʻtkazildi`);
      continue;
    }
    checked++;
    // Shaffof fon (masalan boshqaruv paneli 0,94) ostidagi doskaga qarab
    // oʻzgaradi — eng och va toʻq doskada tekshirib, yomonini olamiz.
    let normal = Infinity;
    let proj = Infinity;
    for (const under of B.alpha < 1 ? CANVASES : [B.rgb]) {
      const back = over(B, under);
      const front = over(F, back);
      normal = Math.min(normal, contrast(front, back));
      proj = Math.min(proj, contrast(projector(front), projector(back)));
    }
    const ok = normal >= 4.5 && proj >= 3;
    if (!ok) failed++;
    console.log(
      `   ${ok ? "✓" : "⛔"}  ${label.padEnd(20)} ${normal.toFixed(2).padStart(5)}:1   proyektor ${proj.toFixed(2).padStart(5)}:1`,
    );
  }
}

if (failed > 0) {
  console.error(`\n⛔ ${failed} ta juftlik chegaradan past (oddiy ≥ 4,5:1, proyektor ≥ 3:1).`);
  process.exit(1);
}
console.log(`\n✅ ${checked} ta juftlik — hammasi oddiy ekranda ≥ 4,5:1 va proyektorda ≥ 3:1.`);
