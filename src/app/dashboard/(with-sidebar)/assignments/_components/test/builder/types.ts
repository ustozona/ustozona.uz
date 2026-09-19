import type { DraftQuestionValues } from "@/server/actions/assess";
import { DEFAULT_SLIDE_LAYOUT } from "@/lib/slide-layouts";

/* Toʻplam builder — mijoz tomonidagi qoralama turlari va konstantalar.

   Qoralama TOʻLIQ mahalliy: "Saqlash" bosilgunicha hech narsa bazaga
   yozilmaydi (`saveSetDraftAction` hammasini bir amalda yozadi). Shu
   sababli har savolda barqaror `key` bor — `activityId` hali yoʻq
   savollarni ham roʻyxatda ajratish uchun. */

export type DraftQuestion = DraftQuestionValues & { key: string };

/** Test savolida variant soni QATʼIY 4 ta:
    qoʻshish/oʻchirish yoʻq, boʻsh qolgan variant saqlashda tushib
    qoladi — yaʼni 2 yoki 3 variantli savol shunchaki boʻsh qoldirish
    orqali olinadi. Sahna balandligi ham shu sababli qatʼiy 2×2. */
export const MCQ_OPTION_COUNT = 4;
export const MAX_PAIRS = 10;

export const TIME_LIMITS = [5, 10, 20, 30, 60, 90, 120, 240] as const;

/** Sahna mavzusi — 16:9 maydonning foni ("Mavzular" ga mos).
    Qiymat `--stage-bg` tokeniga inline yoziladi, shuning uchun yangi
    mavzu qoʻshish = shu roʻyxatga bitta qator. Mavzu toʻplam
    darajasida saqlanadi (`activity_sets.config.stageTheme`).

    Faqat "Gradient" guruhi qoldi — "Sodda" (juda yassi/rangsiz) va
    "Toʻq" (matn kontrasti past koʻrinadi) guruhlari olib tashlandi. */
export {
  STAGE_THEME_GROUPS,
  STAGE_THEMES,
  stageThemeBg,
  stageThemeVars,
  type StageThemeGroup,
} from "@/lib/stage-themes";

export const POINTS_LABEL: Record<DraftQuestion["pointsMode"], string> = {
  standard: "Standart",
  double: "Ikki barobar",
  none: "Ballsiz",
};

export const SHAPE_LABEL: Record<DraftQuestion["shape"], string> = {
  mcq: "Test savoli",
  pairs: "Moslashtirish",
  slide: "Slayd",
  poll: "Soʻrovnoma",
  wordcloud: "Soʻz buluti",
  text: "Ochiq javob",
};

/** Baholanmaydigan turlar — vaqt, ball va «toʻgʻri javob» yoʻq. */
export function isUngradedShape(shape: DraftQuestion["shape"]): boolean {
  return shape === "slide" || shape === "poll" || shape === "wordcloud";
}

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
    options: shape === "mcq" || shape === "poll" ? newOptions() : [],
    pairs: shape === "pairs" ? [newPair(), newPair()] : [],
    timeLimitSec: 20,
    pointsMode: "standard",
    multiSelect: false,
    answerLayout: "grid",
    ...(shape === "slide" ? { slideLayout: DEFAULT_SLIDE_LAYOUT } : {}),
  };
}

/** Chap tasmada va saqlashda ishlatiladigan koʻrinadigan nom. */
export function questionLabel(question: DraftQuestion, index: number): string {
  const fromContent = question.title.trim() || question.stem.trim();
  return fromContent || `${index + 1}-${question.shape === "slide" ? "slayd" : "savol"}`;
}
