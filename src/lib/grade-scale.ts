/**
 * Ballik ko‘rinish (display layer). Ichki hisob har doim `0..100` foiz —
 * bu modul faqat EKRANGA chiqarish usulini o‘zgartiradi, hisobni emas.
 *
 * v2 (docs/grades-scale-model.md): YAGONA chegara manbasi (`FIVE_CUTS` /
 * `PASS_THRESHOLD`). Barcha formatter shu jadvaldan o‘qiydi — "bir nomli shkala,
 * ikki xil chegara" bug'i ildizdan yo‘qoladi.
 */
import { getLetterGrade, type GradingScale } from "@/lib/grades-data";
export { GRADING_SCALE_PRESETS, SCALE_SHORT_LABELS } from "@/lib/grades-data";

// ─── YAGONA CHEGARA MANBASI (single source of truth) ────────────────────────

/**
 * 5-ballik cut-score jadvali — RAQAM va SO‘Z yorlig‘i bitta chegaraga bog‘langan.
 * "5-ballik" va "Aʼlo/Yaxshi/..." — alohida shkala EMAS, shu jadvalning ikki yorlig‘i.
 */
export type FiveTier = { min: number; number: string; word: string };
export const FIVE_CUTS: readonly FiveTier[] = [
  { min: 85, number: "5", word: "Aʼlo" },
  { min: 70, number: "4", word: "Yaxshi" },
  { min: 55, number: "3", word: "Qoniqarli" },
  { min: 0, number: "2", word: "Qoniqarsiz" },
] as const;

/** Yagona pass/fail chegarasi — binary (0/100) qiymatni ajratadi. */
export const PASS_THRESHOLD = 50;

function fiveTier(percent: number): FiveTier {
  for (const t of FIVE_CUTS) if (percent >= t.min) return t;
  return FIVE_CUTS[FIVE_CUTS.length - 1];
}

/** O‘zbek 5-ballik tizimi (a'lo/yaxshi/qoniqarli/qoniqarsiz) — FIVE_CUTS dan. */
export function toFive(percent: number): number {
  return Number(fiveTier(percent).number);
}

export function toTen(percent: number): number {
  return Math.max(1, Math.min(10, Math.round(percent / 10)));
}

// ─── JURNAL SHKALASI (v2 yagona model) ──────────────────────────────────────

/**
 * Jurnal shkalasi turi — o‘qituvchi tanlaydigan barcha shkalalar
 * (`GRADING_SCALE_PRESETS` ro‘yxati). `five` — default.
 */
export type JournalScaleKind = Exclude<GradingScale, "scale_6" | "scale_10" | "custom">;
/** Yorliq uslubi — faqat ko‘rinish (hisobni/hujjatni o‘zgartirmaydi). */
export type LabelStyle = "number" | "word";

export type JournalScale = {
  kind: JournalScaleKind;
  labelStyle: LabelStyle;
  /** Baho yonida qavsda foiz ko‘rsatilsinmi: "4 (78%)". */
  showPercent: boolean;
};

export const DEFAULT_JOURNAL_SCALE: JournalScale = {
  kind: "five",
  labelStyle: "number",
  showPercent: true,
};

/** Foizning yagona jurnal shkalasidagi yorlig‘i (qavssiz). */
export function scoreLabel(percent: number, scale: JournalScale): string {
  // Yorliq uslubi (raqam/so‘z) faqat 5-ballikka tegishli.
  if (scale.kind === "five") {
    const t = fiveTier(percent);
    return scale.labelStyle === "word" ? t.word : t.number;
  }
  // Qolgan barcha shkalalar yagona formatter'dan o‘qiydi.
  return formatByScaleKind(percent, scale.kind);
}

export type ScoreDisplay = { label: string; percent: string; display: string };

/**
 * Foizni jurnal shkalasida formatlash — Holat ustuni va raqamli kataklar uchun
 * YAGONA formatter. `display` = "4 (78%)" (showPercent) yoki "4".
 */
export function formatScore(percent: number, scale: JournalScale): ScoreDisplay {
  const label = scoreLabel(percent, scale);
  const pct = `${Math.round(percent)}%`;
  const display = scale.showPercent && label !== pct ? `${label} (${pct})` : label;
  return { label, percent: pct, display };
}

// ─── TOIFA shkalasi (legacy data + binary pass_fail) ─────────────────────────

/** Tartiblangan (yuqoridan past) chegara → yorliq jadvalidan foizga mos yorliq. */
function tierLabel(percent: number, tiers: [number, string][]): string {
  for (const [min, label] of tiers) {
    if (percent >= min) return label;
  }
  return tiers[tiers.length - 1][1];
}

// Tier-asosli xalqaro shkalalar — `formatByScaleKind` va `getScaleBoundaries`
// bitta jadvaldan o‘qiydi (ko‘rinadigan chegara jadvali shu yerdan quriladi).
const LETTER_BASIC_TIERS: [number, string][] = [[90, "A"], [80, "B"], [70, "C"], [60, "D"], [0, "F"]];
const IB7_TIERS: [number, string][] = [[85, "7"], [75, "6"], [65, "5"], [55, "4"], [45, "3"], [35, "2"], [0, "1"]];
const GCSE_TIERS: [number, string][] = [[90, "9"], [80, "8"], [70, "7"], [60, "6"], [50, "5"], [40, "4"], [30, "3"], [20, "2"], [0, "1"]];
const GERMAN6_TIERS: [number, string][] = [[90, "1"], [75, "2"], [60, "3"], [45, "4"], [30, "5"], [0, "6"]];
const SCALE6_TIERS: [number, string][] = [[90, "6"], [75, "5"], [60, "4"], [45, "3"], [30, "2"], [0, "1"]];

/**
 * TOIFA shkalasi (`scaleKind`) boʻyicha foizni yorliqqa oʻgiradi — katak va
 * ustun-oʻrtacha koʻrinishi uchun. O‘zbek-tegishli turlar (`five`, `ten`,
 * `qualitative`, `pass_fail`) YAGONA manbadan o‘qiydi; qolganlari (harf, IB,
 * GCSE...) "Xalqaro maktab rejimi" uchun saqlanadi (phase 3/4'da yashiriladi).
 */
export function formatByScaleKind(
  percent: number,
  scale: GradingScale,
  labels?: { passLabel?: string; failLabel?: string }
): string {
  switch (scale) {
    case "five":
      return fiveTier(percent).number;
    case "ten":
      return String(toTen(percent));
    case "percent":
      return `${Math.round(percent)}%`;
    case "pass_fail":
      return percent >= PASS_THRESHOLD
        ? labels?.passLabel ?? "Bajardi"
        : labels?.failLabel ?? "Bajarmadi";
    case "qualitative":
      // FIVE_CUTS so‘z yorlig‘i — alohida jadval EMAS.
      return fiveTier(percent).word;
    case "letter_plus":
      return getLetterGrade(percent).letter;
    case "letter_basic":
      return tierLabel(percent, LETTER_BASIC_TIERS);
    case "ib7":
      return tierLabel(percent, IB7_TIERS);
    case "gcse":
      return tierLabel(percent, GCSE_TIERS);
    case "german6":
      // Teskari: 1 = aʼlo, 6 = yiqilish.
      return tierLabel(percent, GERMAN6_TIERS);
    case "french20":
      return String(Math.round(percent / 5)); // 0..20
    case "scale_6":
      return tierLabel(percent, SCALE6_TIERS);
    case "scale_10":
      return String(toTen(percent));
    default:
      return `${Math.round(percent)}%`;
  }
}

// ─── CHEGARA JADVALI (koʻrinadigan) ─────────────────────────────────────────

export type ScaleBoundary = { min: number; label: string };

/**
 * Tanlangan shkalaning chegara jadvali — UI'da "nega 84% emas 85%" savoliga
 * javob beradi. Tier-asosli shkalalar uchun toʻliq jadval; formula-asosli
 * (`ten`, `percent`, `french20`) va `pass_fail` uchun `null` — bular uchun
 * bitta qisqa izoh (SCALE_HINTS) yetarli.
 */
export function getScaleBoundaries(kind: GradingScale, labelStyle: LabelStyle = "number"): ScaleBoundary[] | null {
  switch (kind) {
    case "five":
      return FIVE_CUTS.map((t) => ({ min: t.min, label: labelStyle === "word" ? t.word : t.number }));
    case "letter_basic":
      return LETTER_BASIC_TIERS.map(([min, label]) => ({ min, label }));
    case "ib7":
      return IB7_TIERS.map(([min, label]) => ({ min, label }));
    case "gcse":
      return GCSE_TIERS.map(([min, label]) => ({ min, label }));
    case "german6":
      return GERMAN6_TIERS.map(([min, label]) => ({ min, label }));
    case "scale_6":
      return SCALE6_TIERS.map(([min, label]) => ({ min, label }));
    default:
      return null;
  }
}
