import { Sparkles, TrendingUp, Wrench, type LucideIcon } from "lucide-react";
import type { ChangelogType } from "@/lib/changelog-data";

/* Yangilanishlar sahifasi uchun tur metadatasi — YAGONA MANBA.
   feedback-meta.ts naqshi: semantik Tailwind ranglar + dark variant.
   Eslatma: "tuzatildi" uchun rose EMAS (rose feedback'da "Xato" degani),
   emerald ham EMAS ("yangi"ga band) — amber bu yerda ogohlantirish emas,
   tur yorligʻi (changelog'larda Fixed = amber/orange odatiy). */

type Meta<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
  /** Badge/pill klassi (fon + matn + border). */
  pill: string;
  /** Ikonaning yakka rangi. */
  iconColor: string;
};

export const TYPE_META: Record<ChangelogType, Meta<ChangelogType>> = {
  yangi: {
    value: "yangi",
    label: "Yangi",
    icon: Sparkles,
    pill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    iconColor: "text-emerald-500",
  },
  yaxshilandi: {
    value: "yaxshilandi",
    label: "Yaxshilandi",
    icon: TrendingUp,
    pill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconColor: "text-blue-500",
  },
  tuzatildi: {
    value: "tuzatildi",
    label: "Tuzatildi",
    icon: Wrench,
    pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    iconColor: "text-amber-500",
  },
};

export const TYPE_ORDER: ChangelogType[] = ["yangi", "yaxshilandi", "tuzatildi"];
