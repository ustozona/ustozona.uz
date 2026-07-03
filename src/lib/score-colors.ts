/* ════════════════════════════════════════════════════════════════════
   QIYMATGA BOGʻLIQ RANGLAR — baho / davomat / progress (yagona manba)

   Bular tema tokeni emas, balki "svetofor" maʼno bildiruvchi palette ranglari
   (past = qizil, yuqori = yashil). Shuning uchun Tailwind palette ishlatiladi,
   lekin BITTA joyda — har sahifada qoʻlda takrorlanmaydi.
   Hujjat: docs/design-system.md
   ════════════════════════════════════════════════════════════════════ */

/** Baho foizi → badge klasslari (≥80 yashil, ≥60 sariq, aks holda qizil) */
export function gradeBadgeClass(pct: number): string {
  if (pct >= 80)
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
  if (pct >= 60)
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
  return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800";
}

/** Davomat foizi → badge klasslari (≥90 yashil, ≥80 koʻk, aks holda sariq) */
export function attendanceBadgeClass(pct: number): string {
  if (pct >= 90)
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
  if (pct >= 80)
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800";
  return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800";
}

/**
 * Davomat holati katagi ranglari — semantik "svetofor" tonelar.
 * Referensdagidek to‘yingan pastel (`-100/-700`), `/15` token emas — heatmap
 * bir qarashda o‘qiladi. `cell` katak foni+matni, `text` faqat matn (legend).
 */
export const ATTENDANCE_TONE: Record<
  "success" | "destructive" | "warning" | "info",
  { cell: string; text: string }
> = {
  success: {
    cell: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  destructive: {
    cell: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    text: "text-red-600 dark:text-red-400",
  },
  warning: {
    cell: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    text: "text-amber-600 dark:text-amber-400",
  },
  info: {
    cell: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    text: "text-blue-600 dark:text-blue-400",
  },
};

/** Progress/jadval bari uchun rang (CSS color value) — baho foiziga koʻra */
export function scoreBarColor(pct: number): string {
  if (pct >= 90) return "rgb(34 197 94)"; // green-500
  if (pct >= 80) return "rgb(132 204 22)"; // lime-500
  if (pct >= 70) return "rgb(250 204 21)"; // yellow-400
  if (pct >= 60) return "rgb(249 115 22)"; // orange-500
  return "rgb(239 68 68)"; // red-500
}
