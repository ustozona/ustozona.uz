/* ════════════════════════════════════════════════════════════════════
   ILOVA ANIQLAGICHI UCHUN ETALON KADRLAR

   Ishga tushirish:
     npx tsx scripts/gen-card-app-fixtures.ts <papka>
   Natija → LessonLab repo: `mobile/test/fixtures/cards/`.

   Ustozona ilovasi (Flutter, LessonLab repo `mobile/`) QR-kartalarni
   oʻz kamerasi bilan oʻqiydi. Uning aniqlagichi shu yerdagi
   `src/lib/cards/detect.ts` ning AYNAN nusxasi boʻlishi shart — aks
   holda bitta karta saytda «B», ilovada «C» boʻlib chiqardi. Bu skript
   sunʼiy sinf kadrlarini (perspektiva, notekis yorugʻlik, xiralik,
   shovqin, xalaqit beruvchi toʻrtburchaklar) chizadi, VEB aniqlagichdan
   oʻtkazadi va natijani etalon sifatida yozadi; ilova testi
   (`mobile/test/card_vision_test.dart`) oʻsha natijani piksel
   darajasida takrorlashi kerak.

   ⚠️ `detect.ts`, `marker.ts`, `cv.ts` yoki lugʻat oʻzgarsa — skriptni
   qayta yurgizing, etalonni ilovaga koʻchiring va Dart aniqlagichini
   (`mobile/lib/features/cards/card_vision.dart`) shunga moslang.
   ════════════════════════════════════════════════════════════════════ */
import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { allRotations, markerForStudent, MARKER_GRID } from "../src/lib/cards/marker";
import { detectCards, makeDetectBuffers } from "../src/lib/cards/detect";
import { CvImage, adaptiveThreshold, warp } from "../src/lib/omr/cv";

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Q = [number, number][]; // TL, TR, BR, BL (rasmda)

/** Kvadrat (u,v ∈ [0,1]) → toʻrtburchak gomografiyasi va teskarisi. */
function homography(q: Q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den;
  const h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, c = x0;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3, f = y0;
  // teskari (adjugate)
  const A = e - f * h, B = c * h - b, C = b * f - c * e;
  const D = f * g - d, E = a - c * g, F = c * d - a * f;
  const G = d * h - e * g, H = b * g - a * h, I = a * e - b * d;
  return (x: number, y: number): [number, number] => {
    const w = G * x + H * y + I;
    return [(A * x + B * y + C) / w, (D * x + E * y + F) / w];
  };
}

class Scene {
  w: number; h: number; ink: Float64Array; base: Float64Array;
  constructor(w: number, h: number, light: (x: number, y: number) => number) {
    this.w = w; this.h = h;
    this.base = new Float64Array(w * h);
    this.ink = new Float64Array(w * h).fill(1); // 1 = oq qogʻoz
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.base[y * w + x] = light(x, y);
  }
  /** Karta: oq hoshiya (cells 9×9: 1 hoshiya + 7 belgi + 1 hoshiya), qora ramka, bitlar. */
  card(q: Q, bits: number | null, rotation: number, opts: { margin?: number; paper?: number } = {}) {
    const inv = homography(q);
    const margin = opts.margin ?? 1;
    const total = MARKER_GRID + 2 + margin * 2;
    const rotated = bits === null ? null : allRotations(bits)[rotation];
    const xs = q.map((p) => p[0]), ys = q.map((p) => p[1]);
    const SS = 4;
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(this.h - 1, Math.ceil(Math.max(...ys))); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(this.w - 1, Math.ceil(Math.max(...xs))); x++) {
        let acc = 0, cov = 0;
        for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
          const [u, v] = inv(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          if (u < 0 || u >= 1 || v < 0 || v >= 1) continue;
          cov++;
          const c = Math.floor(u * total) - margin, r = Math.floor(v * total) - margin;
          let dark = false;
          if (r >= 0 && c >= 0 && r < MARKER_GRID + 2 && c < MARKER_GRID + 2) {
            const border = r === 0 || c === 0 || r === MARKER_GRID + 1 || c === MARKER_GRID + 1;
            dark = border || (rotated !== null && (rotated & (1 << ((r - 1) * MARKER_GRID + (c - 1)))) !== 0);
          }
          acc += dark ? 0.08 : (opts.paper ?? 0.97);
        }
        if (cov === 0) continue;
        const i = y * this.w + x;
        this.ink[i] = (this.ink[i] * (SS * SS - cov) + acc) / (SS * SS);
      }
    }
  }
  rect(x0: number, y0: number, x1: number, y1: number, tone: number) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) this.ink[y * this.w + x] = tone;
  }
  render(noise: number, seed: number, blur: number): CvImage {
    const rnd = lcg(seed);
    const img = new CvImage(this.w, this.h);
    let buf = new Float64Array(this.w * this.h);
    for (let i = 0; i < buf.length; i++) buf[i] = this.base[i] * this.ink[i];
    for (let k = 0; k < blur; k++) {
      const next = new Float64Array(buf.length);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        let s = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= this.w || yy >= this.h) continue;
          s += buf[yy * this.w + xx]; n++;
        }
        next[y * this.w + x] = s / n;
      }
      buf = next;
    }
    void rnd; void noise;
    for (let i = 0; i < buf.length; i++) img.data[i] = Math.max(0, Math.min(255, Math.round(buf[i] * 255)));
    return img;
  }
}

/** Butun sonli shovqin — Dart testida AYNAN takrorlanadi (`addNoise`). */
function addNoise(img: CvImage, amp: number, seed: number) {
  let st = seed >>> 0;
  for (let i = 0; i < img.data.length; i++) {
    st = (Math.imul(st, 1664525) + 1013904223) >>> 0;
    const n = Math.floor((st / 4294967296) * (2 * amp + 1)) - amp;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
  }
}

function fnv(data: Uint8Array): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) { h ^= data[i]; h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

function quad(cx: number, cy: number, size: number, tilt: number, skew: number, persp: number): Q {
  // Burilish trig'siz: tilt — burchak tangensi (aniq butun nisbat emas, lekin bir martalik hisob).
  const s = size / 2;
  const pts: Q = [[-s, -s], [s, -s], [s, s], [-s, s]];
  return pts.map(([x, y], i) => {
    const rx = x - tilt * y, ry = y + tilt * x;
    const k = 1 + (i < 2 ? -persp : persp);
    return [cx + rx * k + skew * ry, cy + ry * k] as [number, number];
  }) as Q;
}

const scenes: { name: string; make: () => { img: CvImage; minEdge: number; truth: { no: number; rotation: number }[]; noise: { amp: number; seed: number } } }[] = [];

scenes.push({ name: "flat", make: () => {
  const sc = new Scene(640, 480, () => 1);
  const truth = [{ no: 1, rotation: 0 }, { no: 7, rotation: 1 }, { no: 23, rotation: 2 }, { no: 42, rotation: 3 }, { no: 63, rotation: 1 }];
  const pos = [[90, 90, 120], [260, 90, 100], [440, 100, 90], [130, 320, 140], [360, 320, 110]];
  truth.forEach((t, i) => sc.card(quad(pos[i][0], pos[i][1], pos[i][2], 0, 0, 0), markerForStudent(t.no), t.rotation));
  return { img: sc.render(0, 1, 0), minEdge: 40, truth, noise: { amp: 0, seed: 1 } };
}});

scenes.push({ name: "classroom", make: () => {
  const rnd = lcg(7);
  const W = 720, H = 540;
  const sc = new Scene(W, H, (x, y) => 0.55 + 0.4 * (x / W) * (1 - 0.4 * (y / H)));
  // Xalaqit: plakat, deraza romi, qora kvadrat, roʻyxatdan tashqari belgi.
  sc.rect(20, 20, 120, 160, 0.35);
  sc.rect(600, 30, 700, 40, 0.1); sc.rect(600, 30, 610, 140, 0.1); sc.rect(690, 30, 700, 140, 0.1); sc.rect(600, 130, 700, 140, 0.1);
  sc.card(quad(560, 470, 50, 0, 0, 0), null, 0); // faqat ramka
  sc.card(quad(660, 470, 50, 0.05, 0, 0), 0b1010101010101010101010101, 0); // lugʻatda yoʻq
  const truth: { no: number; rotation: number }[] = [];
  let no = 2;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
    const size = 70 - row * 15 + Math.round(rnd() * 8);
    const cx = 170 + col * 85 + Math.round(rnd() * 10);
    const cy = 120 + row * 130 + Math.round(rnd() * 10);
    const rotation = Math.floor(rnd() * 4);
    const tilt = (rnd() - 0.5) * 0.5, skew = (rnd() - 0.5) * 0.15, persp = rnd() * 0.08;
    sc.card(quad(cx, cy, size, tilt, skew, persp), markerForStudent(no), rotation);
    truth.push({ no, rotation });
    no += 3;
  }
  return { img: sc.render(10, 99, 1), minEdge: Math.round(W / 40), truth, noise: { amp: 12, seed: 99 } };
}});

scenes.push({ name: "portrait-30", make: () => {
  const rnd = lcg(31);
  const W = 720, H = 960;
  const sc = new Scene(W, H, (x, y) => 0.75 + 0.2 * Math.cos((x + y) / 300));
  const truth: { no: number; rotation: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    const size = 85 - row * 9;
    const cx = 80 + col * 140 + Math.round((rnd() - 0.5) * 20);
    const cy = 90 + row * 150 + Math.round((rnd() - 0.5) * 20);
    const rotation = (i * 7 + row) % 4;
    sc.card(quad(cx, cy, size, (rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.1, rnd() * 0.06), markerForStudent(i + 30), rotation);
    truth.push({ no: i + 30, rotation });
  }
  return { img: sc.render(14, 5, 1), minEdge: Math.round(W / 40), truth, noise: { amp: 16, seed: 5 } };
}});

scenes.push({ name: "dim-blur", make: () => {
  const W = 480, H = 360;
  const sc = new Scene(W, H, (x) => 0.35 + 0.25 * (x / W));
  const truth = [{ no: 5, rotation: 3 }, { no: 11, rotation: 0 }, { no: 50, rotation: 2 }];
  sc.card(quad(90, 120, 90, 0.2, 0, 0.05), markerForStudent(5), 3);
  sc.card(quad(240, 200, 70, -0.3, 0.05, 0), markerForStudent(11), 0);
  sc.card(quad(390, 150, 100, 0.6, 0, 0.1), markerForStudent(50), 2);
  return { img: sc.render(6, 3, 2), minEdge: 12, truth, noise: { amp: 8, seed: 3 } };
}});

const manifest: unknown[] = [];
for (const s of scenes) {
  const { img, minEdge, truth, noise } = s.make();
  const clean = Buffer.from(img.data);
  addNoise(img, noise.amp, noise.seed);
  const buffers = makeDetectBuffers(img.width, img.height);
  const found = detectCards(img, buffers, { minEdgePx: minEdge });
  const thres = new CvImage(img.width, img.height);
  adaptiveThreshold(img, thres, 9, 7);
  writeFileSync(`${OUT}/${s.name}.gray.gz`, gzipSync(clean, { level: 9 }));
  manifest.push({
    name: s.name, noise, width: img.width, height: img.height, minEdgePx: minEdge,
    grayFnv: fnv(img.data), thresFnv: fnv(thres.data), truth,
    found: found.map((f) => ({ no: f.match.studentNo, rotation: f.match.rotation, corrected: f.match.corrected, corners: f.corners.map((p) => [p.x, p.y]) })),
  });
  const ok = truth.filter((t) => found.some((f) => f.match.studentNo === t.no && f.match.rotation === t.rotation)).length;
  console.log(s.name, `${ok}/${truth.length} toʻgʻri`, `topildi ${found.length}`);
}

// Warp: qisman kadrdan tashqaridagi toʻrtburchak (JS NaN → 0 xatti-harakati).
const W = 64, H = 48;
const g = new CvImage(W, H);
for (let i = 0; i < g.data.length; i++) g.data[i] = (i * 37 + (i >> 5)) & 0xff;
const warps = [
  [[-10.5, -8.25], [70.75, 2], [60, 55.5], [-3, 40]],
  [[5, 5], [40, 7], [38, 30], [6, 33]],
  [[63.9, 0], [63.9, 47.9], [0, 47.9], [0, 0]],
].map((q) => {
  const d = new CvImage(56, 56);
  warp(g, d, q.map(([x, y]) => ({ x, y })), 56);
  return { quad: q, fnv: fnv(d.data) };
});
writeFileSync(`${OUT}/expected.json`, JSON.stringify({ source: "ustozona.uz src/lib/cards/detect.ts", scenes: manifest, warp: { srcFormula: "(i*37 + (i>>5)) & 0xff", width: W, height: H, cases: warps } }, null, 1));
