// Matematik ekvivalentlik — v1: SONLI normalizatsiya (B4.2).
// "1.5 = 1½ = 3/2 = 150%" — turli yozuv, bir qiymat. Simvolik ekvivalentlik
// (x+1 vs 1+x) v2 — mathjs.simplify() bilan, hozir kerak emas.

const FRACTION_RE = /^(-?\d+)\s*\/\s*(\d+)$/;
const MIXED_FRACTION_RE = /^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/;
const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 1 / 2,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "¼": 1 / 4,
  "¾": 3 / 4,
  "⅕": 1 / 5,
  "⅖": 2 / 5,
  "⅗": 3 / 5,
  "⅘": 4 / 5,
  "⅙": 1 / 6,
  "⅚": 5 / 6,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

/** "1½" → 1.5, "3/4" → 0.75, "1 3/4" → 1.75, "150%" → 1.5, "1.5" → 1.5.
    Parslab boʻlmasa null. */
export function parseNumericAnswer(raw: string): number | null {
  const value = raw.trim().replace(",", ".");
  if (!value) return null;

  if (value.endsWith("%")) {
    const n = Number(value.slice(0, -1).trim());
    return Number.isFinite(n) ? n / 100 : null;
  }

  const mixed = value.match(MIXED_FRACTION_RE);
  if (mixed) {
    const [, whole, num, den] = mixed;
    const denom = Number(den);
    if (denom === 0) return null;
    const sign = whole.startsWith("-") ? -1 : 1;
    return Number(whole) + sign * (Number(num) / denom);
  }

  const fraction = value.match(FRACTION_RE);
  if (fraction) {
    const [, num, den] = fraction;
    const denom = Number(den);
    if (denom === 0) return null;
    return Number(num) / denom;
  }

  // Unicode kasr birlik raqam bilan qoʻshilgan boʻlishi mumkin: "1½".
  const lastChar = value.slice(-1);
  if (lastChar in UNICODE_FRACTIONS) {
    const wholePart = value.slice(0, -1).trim();
    const whole = wholePart ? Number(wholePart) : 0;
    if (!Number.isFinite(whole)) return null;
    const sign = wholePart.startsWith("-") ? -1 : 1;
    return whole + sign * UNICODE_FRACTIONS[lastChar];
  }

  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Ikki yozuv (kasr/oʻnlik/foiz) bir xil qiymatni bildiradimi — `tolerance` dopusk bilan. */
export function isMathEquivalent(
  studentAnswer: string,
  correctAnswer: string,
  tolerance = 0
): boolean {
  const a = parseNumericAnswer(studentAnswer);
  const b = parseNumericAnswer(correctAnswer);
  if (a === null || b === null) return false;
  return Math.abs(a - b) <= tolerance;
}
