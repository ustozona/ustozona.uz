import {
  Lightbulb,
  Bug,
  HelpCircle,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  FeedbackCategory,
  FeedbackStatus,
} from "@/store/useFeedbackStore";
import { useTranslations } from "next-intl";

/* Fikr-mulohaza sahifasi uchun turkum/holat/soha metadatasi — YAGONA MANBA.
   Students'dagi STATUS_PILL naqshi: semantik Tailwind ranglar + dark variant.
   Pill/badge = rounded-full; ranglar tema tokenlari EMAS (maʼno bildiradi).
   Labellar tarjima qilinadi — shu sabab CATEGORY_META/STATUS_META endi
   useCategoryMeta()/useStatusMeta() hook orqali olinadi (label komponent
   render vaqtida useTranslations bilan hisoblanadi). */

type Meta<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
  /** Badge/pill klassi (fon + matn + border). */
  pill: string;
  /** Yumaloq nuqta rangi (chap panel filtrlarida). */
  dot: string;
  /** Ikonaning yakka rangi (kontekst menyu va h.k.). */
  iconColor: string;
};

// ── Turkum ────────────────────────────────────────────────────────────────
const CATEGORY_ICON: Record<FeedbackCategory, LucideIcon> = {
  taklif: Lightbulb,
  xato: Bug,
  savol: HelpCircle,
  maqtov: ThumbsUp,
  boshqa: MessageSquare,
};

const CATEGORY_PILL: Record<FeedbackCategory, { pill: string; dot: string; iconColor: string }> = {
  taklif: {
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500",
    iconColor: "text-violet-500",
  },
  xato: {
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    iconColor: "text-rose-500",
  },
  savol: {
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
    iconColor: "text-blue-500",
  },
  maqtov: {
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  boshqa: {
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
    iconColor: "text-slate-400",
  },
};

export const CATEGORY_ORDER: FeedbackCategory[] = ["taklif", "xato", "savol", "maqtov", "boshqa"];

const CATEGORY_LABEL_UZ: Record<FeedbackCategory, string> = {
  taklif: "Taklif",
  xato: "Xato",
  savol: "Savol",
  maqtov: "Maqtov",
  boshqa: "Boshqa",
};

/** Statik (tarjima qilinmagan, uz) turkum metadatasi — admin panel uchun. */
export const CATEGORY_META: Record<FeedbackCategory, Meta<FeedbackCategory>> = Object.fromEntries(
  CATEGORY_ORDER.map((value) => [
    value,
    { value, label: CATEGORY_LABEL_UZ[value], icon: CATEGORY_ICON[value], ...CATEGORY_PILL[value] },
  ])
) as Record<FeedbackCategory, Meta<FeedbackCategory>>;

/** Turkum metadatasi — tarjima qilingan label bilan (client komponentda chaqiring). */
export function useCategoryMeta(): Record<FeedbackCategory, Meta<FeedbackCategory>> {
  const t = useTranslations("FeedbackMeta.categories");
  return Object.fromEntries(
    CATEGORY_ORDER.map((value) => [
      value,
      { value, label: t(value), icon: CATEGORY_ICON[value], ...CATEGORY_PILL[value] },
    ])
  ) as Record<FeedbackCategory, Meta<FeedbackCategory>>;
}

// ── Holat (sodda 4-bosqichli oqim) ──────────────────────────────────────────
const STATUS_ICON: Record<FeedbackStatus, LucideIcon> = {
  yangi: Sparkles,
  jarayonda: Loader2,
  bajarildi: CheckCircle2,
  rad: XCircle,
};

const STATUS_PILL: Record<FeedbackStatus, { pill: string; dot: string; iconColor: string }> = {
  yangi: {
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
    iconColor: "text-slate-400",
  },
  jarayonda: {
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
    iconColor: "text-blue-500",
  },
  bajarildi: {
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  rad: {
    pill: "bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/20",
    dot: "bg-slate-300 dark:bg-slate-600",
    iconColor: "text-slate-400",
  },
};

export const STATUS_ORDER: FeedbackStatus[] = ["yangi", "jarayonda", "bajarildi", "rad"];

const STATUS_LABEL_UZ: Record<FeedbackStatus, string> = {
  yangi: "Yangi",
  jarayonda: "Jarayonda",
  bajarildi: "Bajarildi",
  rad: "Rad etilgan",
};

/** Statik (tarjima qilinmagan, uz) holat metadatasi — admin panel uchun. */
export const STATUS_META: Record<FeedbackStatus, Meta<FeedbackStatus>> = Object.fromEntries(
  STATUS_ORDER.map((value) => [
    value,
    { value, label: STATUS_LABEL_UZ[value], icon: STATUS_ICON[value], ...STATUS_PILL[value] },
  ])
) as Record<FeedbackStatus, Meta<FeedbackStatus>>;

/** Holat metadatasi — tarjima qilingan label bilan (client komponentda chaqiring). */
export function useStatusMeta(): Record<FeedbackStatus, Meta<FeedbackStatus>> {
  const t = useTranslations("FeedbackMeta.statuses");
  return Object.fromEntries(
    STATUS_ORDER.map((value) => [
      value,
      { value, label: t(value), icon: STATUS_ICON[value], ...STATUS_PILL[value] },
    ])
  ) as Record<FeedbackStatus, Meta<FeedbackStatus>>;
}

// ── Sana formati ──────────────────────────────────────────────────────────
/** Oy qisqartmalari — tarjima qilingan (client komponentda useMonthsShort() chaqiring). */
export function useMonthsShort(): string[] {
  const t = useTranslations("FeedbackMeta.months");
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => t(`m${i}`));
}

/** ISO → "18:24" (24-soatlik). */
export function formatFeedbackTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** `FeedbackMeta.relative` namespace tarjimon tipi (formatFeedbackAgo uchun). */
type RelativeT = (key: "now" | "minutesAgo" | "hoursAgo" | "yesterday", values?: { count: number }) => string;

/** `useTranslations("FeedbackMeta.relative")` natijasini shu yerga uzating. */
export function useRelativeT(): RelativeT {
  return useTranslations("FeedbackMeta.relative") as unknown as RelativeT;
}

/** Statik (tarjima qilinmagan, uz) fallback — admin panel `t` uzatmaydigan eski chaqiruvlar uchun. */
const RELATIVE_T_UZ: RelativeT = (key, values) => {
  if (key === "now") return "hozir";
  if (key === "yesterday") return "kecha";
  if (key === "minutesAgo") return `${values?.count ?? 0} daqiqa oldin`;
  return `${values?.count ?? 0} soat oldin`;
};

const MONTHS_SHORT_UZ = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** ISO → nisbiy (GitHub/Twitter uslubi): "N daqiqa/soat oldin" → "kecha" →
    "DD-MM" (yoki boshqa yil boʻlsa "DD-MM-YYYY"). `t` — useRelativeT() natijasi
    (chaqirilmasa — statik uz fallback, admin panel uchun). */
export function formatFeedbackAgo(iso: string, t: RelativeT = RELATIVE_T_UZ): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const dayMs = 86_400_000;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dayDiff = Math.round((startOf(now) - startOf(d)) / dayMs);

  if (dayDiff <= 0) {
    const diffMs = Math.max(0, now.getTime() - d.getTime());
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return t("now");
    if (diffMin < 60) return t("minutesAgo", { count: diffMin });
    return t("hoursAgo", { count: Math.floor(diffMs / 3_600_000) });
  }
  if (dayDiff === 1) return t("yesterday");

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return d.getFullYear() === now.getFullYear() ? `${dd}-${mm}` : `${dd}-${mm}-${d.getFullYear()}`;
}

/** ISO → "30 may 2026, 18:24" (hover tooltip / toʻliq sana uchun).
    `monthsShort` — useMonthsShort() natijasi (chaqirilmasa — statik uz fallback). */
export function formatFeedbackFull(iso: string, monthsShort: string[] = MONTHS_SHORT_UZ): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}, ${formatFeedbackTime(iso)}`;
}
