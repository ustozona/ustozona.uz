import type { ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   GʻILDIRAK MATEMATIKASI — tasodif, burchak, boʻlak.

   React ham, DOM ham YOʻQ. Bitta gʻildirak primitivi uch joyga xizmat
   qiladi (docs/doska-gildirak-spec.md R299, R111): Doska vidjeti
   (sinf roʻyxati), Baholash shabloni (atamalar) va jonli dars
   (ishtirokchilar). Hisob hammasida bir xil, shuning uchun u shu yerda.

   BURCHAK KELISHUVI — hamma funksiya shunga tayanadi:
     • gradus, soat mili boʻyicha (SVGʼda y pastga qaraydi);
     • koʻrsatkich 0° da — oʻng tomonda, soat 3 da;
     • i-boʻlakning markazi `i * seg` da, gʻildirak `rotation` ga
       burilgan. Demak koʻrsatkich ostidagi boʻlak:
       `i * seg + rotation ≡ 0 (mod 360)`.
   ════════════════════════════════════════════════════════════════════ */

/** Bitta boʻlakning burchagi (gradus). */
export function segmentAngle(count: number): number {
  return 360 / Math.max(1, count);
}

/** Burchakni [0, 360) oraligʻiga keltiradi. */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Kriptografik tekis tasodif: [0, count).
 *
 * ⚠️ `Math.random()` EMAS. Sinfda bolalar «tanlov adolatli» ekaniga
 * ishonishi kerak, ishonch esa tekshirib boʻladigan kafolatdan keladi.
 *
 * ⚠️ `x % count` ning oʻzi yetmaydi — 2³² ga karrali boʻlmagan `count`
 * da birinchi qiymatlar biroz koʻproq chiqadi (modulo ogʻishi). Shuning
 * uchun oxirgi toʻliq boʻlmagan «dum» rad etiladi va qayta olinadi.
 */
export function randomIndex(count: number): number {
  if (count <= 1) return 0;
  const limit = Math.floor(0x1_0000_0000 / count) * count;
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % count;
  }
}

/** Kriptografik [0, 1) — boʻlak ichidagi toʻxtash nuqtasi uchun. */
export function randomUnit(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 0x1_0000_0000;
}

/** Koʻrsatkich ostida qaysi boʻlak turibdi. */
export function segmentAtPointer(rotation: number, count: number): number {
  if (count <= 1) return 0;
  const seg = segmentAngle(count);
  return Math.round(normalizeAngle(-rotation) / seg) % count;
}

/**
 * Aylanish oxiridagi burchak: `index` li boʻlak koʻrsatkich ostida
 * toʻxtaydi.
 *
 * Gʻolib aylanish BOSHIDA tanlanadi, animatsiya esa unga olib boradi
 * (R289, R298). Fizika simulyatsiyasi kerak emas: natija baribir tekis
 * taqsimlangan tasodifdan keladi, aylanish esa uni koʻrsatadi.
 *
 * `jitter` ∈ [0, 1) — boʻlak ichida qayerda toʻxtashi. Har safar
 * markazda toʻxtasa gʻildirak «oldindan belgilangan»dek koʻrinadi.
 * Chetlarning 15 foizi ishlatilmaydi: koʻrsatkich chiziq ustida tursa
 * bolalar «qaysi biri?» deb bahslashadi.
 *
 * Natija `from` dan KATTA — gʻildirak har doim bir tomonga aylanadi.
 */
export function targetRotation(
  from: number,
  index: number,
  count: number,
  turns: number,
  jitter: number,
): number {
  const seg = segmentAngle(count);
  const offset = (jitter - 0.5) * seg * 0.7;
  const rest = normalizeAngle(-(index * seg + offset));
  const delta = normalizeAngle(rest - normalizeAngle(from));
  return from + turns * 360 + delta;
}

/**
 * Sekinlashish egri chizigʻi — tez boshlanadi, uzoq toʻxtaydi.
 * Toʻrtinchi darajali: oxirgi soniyalarda ismlar birma-bir sudralib
 * oʻtadi va sinf «qaysi biri?» deb kutadi.
 */
export function spinEase(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/**
 * Boʻlak ranglari — `class-colors.ts` palitrasidan (yangi rang ixtiro
 * qilinmaydi, docs/doska-dizayn-tizimi.md §3).
 *
 * Tartib ATAYLAB aralash: qoʻshni boʻlaklar tus boʻyicha uzoq turadi.
 * Yashil yoʻq — u Doskaning brend rangi (faol holat), kulrang yoʻq —
 * «oʻchirilgan» deb oʻqiladi.
 */
const SEGMENT_COLORS: ClassColor[] = [
  "red",
  "sky",
  "amber",
  "violet",
  "lime",
  "pink",
  "teal",
  "orange",
  "blue",
  "fuchsia",
];

/**
 * `index` li boʻlakning rangi. Oxirgi boʻlak birinchisiga tegib turadi —
 * ularning rangi bir xil chiqib qolsa (soni 10k+1 boʻlganda) oxirgisiga
 * ikkala qoʻshnisidan (qizil va binafsha-pushti) ham uzoq sariq beriladi.
 */
export function segmentColor(index: number, count: number): ClassColor {
  const n = SEGMENT_COLORS.length;
  if (count > 1 && index === count - 1 && index % n === 0) return "amber";
  return SEGMENT_COLORS[index % n];
}

/* ── Yozuv geometriyasi ─────────────────────────────────────────────
   Gʻildirak `viewBox` birliklarida: radius 100, markazda 16 lik tugun.
   Ism tugundan gardishgacha, radius boʻylab yoziladi. */
export const WHEEL_RADIUS = 100;
export const WHEEL_HUB = 16;
const LABEL_INNER = WHEEL_HUB + 8;
const LABEL_OUTER = WHEEL_RADIUS - 8;
/** DM Sans 600 da harfning oʻrtacha kengligi (em). Taxmin — aniq oʻlchov emas. */
const CHAR_EM = 0.58;

/**
 * Boʻlak ichidagi ism: shrift oʻlchami va sigʻmasa qisqartirilgan matn.
 *
 * Shrift boʻlak kengligidan keladi: 8 kishida katta, 35 kishida kichik.
 * Uzun ism avval biroz KICHRAYTIRILADI (qoʻshnilaridan uchdan birdan
 * koʻp emas — aks holda gʻildirakda bir ism boshqalardan ajralib
 * qoladi), shunda ham sigʻmasa kesiladi. Gʻolib ekranida baribir toʻliq
 * chiqadi.
 */
export function fitSegmentLabel(name: string, count: number): { text: string; fontSize: number } {
  const seg = (segmentAngle(count) * Math.PI) / 180;
  // Yozuv oʻrtasidagi boʻlak kengligi (vatar).
  const mid = (LABEL_INNER + LABEL_OUTER) / 2;
  const chord = count <= 1 ? 60 : 2 * mid * Math.sin(Math.min(seg, Math.PI) / 2);
  const base = Math.max(4, Math.min(14, chord * 0.62));

  const room = LABEL_OUTER - LABEL_INNER;
  const chars = Array.from(name);
  const fits = room / (Math.max(1, chars.length) * CHAR_EM);
  const fontSize = Math.max(Math.min(base, fits), base * 0.65, 4);

  const maxChars = Math.max(3, Math.floor(room / (fontSize * CHAR_EM)));
  const text = chars.length > maxChars ? chars.slice(0, maxChars - 1).join("") + "…" : name;
  return { text, fontSize };
}

/** Ism yoziladigan tashqi nuqta (matn shu yerda tugaydi). */
export const WHEEL_LABEL_END = LABEL_OUTER;
