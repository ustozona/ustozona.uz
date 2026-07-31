import { CLASS_COLORS, CLASS_COLOR_BASE, type ClassColor } from "@/lib/class-colors";
import type { DraftQuestionValues } from "@/server/actions/assess";

/* Toʻplam builder — mijoz tomonidagi qoralama turlari va konstantalar.

   Qoralama TOʻLIQ mahalliy: "Saqlash" bosilgunicha hech narsa bazaga
   yozilmaydi (`saveSetDraftAction` hammasini bir amalda yozadi). Shu
   sababli har savolda barqaror `key` bor — `activityId` hali yoʻq
   savollarni ham roʻyxatda ajratish uchun. */

export type DraftQuestion = DraftQuestionValues & { key: string };

/** Test savolida variant soni QATʼIY 4 ta (Kahoot bilan bir xil):
    qoʻshish/oʻchirish yoʻq, boʻsh qolgan variant saqlashda tushib
    qoladi — yaʼni 2 yoki 3 variantli savol shunchaki boʻsh qoldirish
    orqali olinadi. Sahna balandligi ham shu sababli qatʼiy 2×2. */
export const MCQ_OPTION_COUNT = 4;
export const MAX_PAIRS = 10;

export const TIME_LIMITS = [5, 10, 20, 30, 60, 90, 120, 240] as const;

/** Sahna mavzusi — 16:9 maydonning foni (Kahoot "Themes" ga mos).
    Qiymat `--stage-bg` tokeniga inline yoziladi, shuning uchun yangi
    mavzu qoʻshish = shu roʻyxatga bitta qator. Mavzu toʻplam
    darajasida saqlanadi (`activity_sets.config.stageTheme`).

    Faqat "Gradient" guruhi qoldi — "Sodda" (juda yassi/rangsiz) va
    "Toʻq" (matn kontrasti past koʻrinadi) guruhlari olib tashlandi. */
export const STAGE_THEME_GROUPS = ["Gradient"] as const;

export type StageThemeGroup = (typeof STAGE_THEME_GROUPS)[number];

/** Sinf rangi nomlarining oʻzbekcha yorligʻi — faqat shu yerda
    (mavzu kartasi ustidagi lenta matni uchun). */
const CLASS_COLOR_LABELS: Record<ClassColor, string> = {
  red: "Qizil",
  orange: "Toʻq sariq",
  amber: "Amber",
  yellow: "Sariq",
  lime: "Layim",
  green: "Yashil",
  emerald: "Zumrad",
  teal: "Firuza",
  cyan: "Zangori",
  sky: "Osmon",
  blue: "Koʻk",
  indigo: "Indigo",
  violet: "Binafsha",
  purple: "Purpur",
  fuchsia: "Fuksiya",
  pink: "Pushti",
  rose: "Atirgul",
  gray: "Kulrang",
};

/** `CLASS_COLOR_BASE`dagi oklch qatoridan huening (H) sonini ajratadi —
    mavzu gradienti xuddi shu tondan, faqat boshqa L/C bilan qurilgani
    uchun sinf rangi bilan bir xil "oila"da koʻrinadi. */
function hueOf(oklch: string): number {
  const match = oklch.match(/oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+)/i);
  return match ? parseFloat(match[1]) : 0;
}

/* Har mavzuda uch qiymat:
   `bg`   — sahna foni;
   `band` — karta pastidagi nom lentasi (fonning toʻqroq/yorugʻroq
            varianti — Kahoot kartalarida ham aynan shunday);
   `onBand` — lenta ustidagi matn rangi.
   Rang aralashtirish qoʻlda yozilgan: `color-mix(var(...))` Turbopack'da
   buziladi (memory: turbopack-css-gotchas).

   Mavzular QOʻLDA sanab chiqilmaydi — sinf rangi dvigateli
   (`CLASS_COLOR_BASE`, [[color-system-layers]]) dagi 17 tondan avtomatik
   hosil qilinadi: bitta yagona manba, ikkita joyda takrorlanmaydi. */
export const STAGE_THEMES: ReadonlyArray<{
  id: string;
  label: string;
  group: StageThemeGroup;
  bg: string;
  band: string;
  onBand: "light" | "dark";
}> = CLASS_COLORS.map((color) => {
  const h = hueOf(CLASS_COLOR_BASE[color]);
  return {
    id: color,
    label: CLASS_COLOR_LABELS[color],
    group: "Gradient",
    bg: `linear-gradient(160deg, oklch(0.72 0.16 ${h}), oklch(0.5 0.18 ${h}))`,
    band: `oklch(0.38 0.14 ${h})`,
    onBand: "light",
  };
});

export function stageThemeBg(id: string): string {
  return (STAGE_THEMES.find((t) => t.id === id) ?? STAGE_THEMES[0]).bg;
}

export const POINTS_LABEL: Record<DraftQuestion["pointsMode"], string> = {
  standard: "Standart",
  double: "Ikki barobar",
  none: "Ballsiz",
};

export const SHAPE_LABEL: Record<DraftQuestion["shape"], string> = {
  mcq: "Test savoli",
  pairs: "Moslashtirish",
};

export function newOption(): DraftQuestion["options"][number] {
  return { id: crypto.randomUUID(), text: "", isCorrect: false };
}

/** Test savoli uchun toʻliq variant toʻplami — har doim 4 ta. */
export function newOptions(): DraftQuestion["options"] {
  return Array.from({ length: MCQ_OPTION_COUNT }, newOption);
}

export function newPair(): DraftQuestion["pairs"][number] {
  return { id: crypto.randomUUID(), left: "", right: "" };
}

export function newQuestion(shape: DraftQuestion["shape"]): DraftQuestion {
  return {
    key: crypto.randomUUID(),
    shape,
    title: "",
    stem: "",
    options: shape === "mcq" ? newOptions() : [],
    pairs: shape === "pairs" ? [newPair(), newPair()] : [],
    timeLimitSec: 20,
    pointsMode: "standard",
    multiSelect: false,
    answerLayout: "grid",
  };
}

/** Chap tasmada va saqlashda ishlatiladigan koʻrinadigan nom. */
export function questionLabel(question: DraftQuestion, index: number): string {
  const fromContent = question.title.trim() || question.stem.trim();
  return fromContent || `${index + 1}-savol`;
}
