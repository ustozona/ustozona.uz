import {
  Lightbulb,
  Bug,
  HelpCircle,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Eye,
  CalendarClock,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  FeedbackCategory,
  FeedbackStatus,
} from "@/store/useFeedbackStore";

/* Fikr-mulohaza sahifasi uchun turkum/holat/soha metadatasi — YAGONA MANBA.
   Students'dagi STATUS_PILL naqshi: semantik Tailwind ranglar + dark variant.
   Pill/badge = rounded-full; ranglar tema tokenlari EMAS (maʼno bildiradi). */

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
export const CATEGORY_META: Record<FeedbackCategory, Meta<FeedbackCategory>> = {
  taklif: {
    value: "taklif",
    label: "Taklif",
    icon: Lightbulb,
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500",
    iconColor: "text-violet-500",
  },
  xato: {
    value: "xato",
    label: "Xato",
    icon: Bug,
    pill: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    iconColor: "text-rose-500",
  },
  savol: {
    value: "savol",
    label: "Savol",
    icon: HelpCircle,
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
    iconColor: "text-blue-500",
  },
  maqtov: {
    value: "maqtov",
    label: "Maqtov",
    icon: ThumbsUp,
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  boshqa: {
    value: "boshqa",
    label: "Boshqa",
    icon: MessageSquare,
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
    iconColor: "text-slate-400",
  },
};

export const CATEGORY_ORDER: FeedbackCategory[] = ["taklif", "xato", "savol", "maqtov", "boshqa"];

// ── Holat ───────────────────────────────────────────────────────────────────
export const STATUS_META: Record<FeedbackStatus, Meta<FeedbackStatus>> = {
  yangi: {
    value: "yangi",
    label: "Yangi",
    icon: Sparkles,
    pill: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
    iconColor: "text-slate-400",
  },
  korilmoqda: {
    value: "korilmoqda",
    label: "Koʻrilmoqda",
    icon: Eye,
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dot: "bg-blue-500",
    iconColor: "text-blue-500",
  },
  rejalashtirilgan: {
    value: "rejalashtirilgan",
    label: "Rejalashtirilgan",
    icon: CalendarClock,
    pill: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    dot: "bg-violet-500",
    iconColor: "text-violet-500",
  },
  bajarilmoqda: {
    value: "bajarilmoqda",
    label: "Bajarilmoqda",
    icon: Loader2,
    pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
    iconColor: "text-amber-500",
  },
  bajarildi: {
    value: "bajarildi",
    label: "Bajarildi",
    icon: CheckCircle2,
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    iconColor: "text-emerald-500",
  },
  rad: {
    value: "rad",
    label: "Rad etilgan",
    icon: XCircle,
    pill: "bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/20",
    dot: "bg-slate-300 dark:bg-slate-600",
    iconColor: "text-slate-400",
  },
};

export const STATUS_ORDER: FeedbackStatus[] = [
  "yangi",
  "korilmoqda",
  "rejalashtirilgan",
  "bajarilmoqda",
  "bajarildi",
  "rad",
];

/** "Ongoing" tabida guruhlanadigan faol holatlar (tartibida koʻrsatiladi). */
export const ONGOING_STATUSES: FeedbackStatus[] = [
  "korilmoqda",
  "rejalashtirilgan",
  "bajarilmoqda",
];

// ── Sana formati ──────────────────────────────────────────────────────────
const MONTHS_SHORT = [
  "yan", "fev", "mar", "apr", "may", "iyun",
  "iyul", "avg", "sen", "okt", "noy", "dek",
];

/** ISO → "18:24" (24-soatlik). */
export function formatFeedbackTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** ISO → nisbiy: "bugun / kecha / N kun oldin / N hafta oldin / N oy oldin / N yil oldin". */
export function formatFeedbackAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dayMs = 86_400_000;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / dayMs);
  if (diff <= 0) return "bugun";
  if (diff === 1) return "kecha";
  if (diff < 7) return `${diff} kun oldin`;
  if (diff < 30) return `${Math.floor(diff / 7)} hafta oldin`;
  if (diff < 365) return `${Math.floor(diff / 30)} oy oldin`;
  return `${Math.floor(diff / 365)} yil oldin`;
}

/** ISO → "30 may 2026, 18:24" (hover tooltip / toʻliq sana uchun). */
export function formatFeedbackFull(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}, ${formatFeedbackTime(iso)}`;
}
