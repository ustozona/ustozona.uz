import type { DropState } from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   KATAK USLUBLARI — YAGONA MANBA.

   Ilgari bu jadval ikkala toʻrda (ish rejimi va varaq) alohida
   yozilgan edi va allaqachon ajrala boshlagandi: birida `/12`,
   ikkinchisida `/15`, ring kengligi uchta xil (`ring-1`, `ring-2`,
   `ring-[1.5px]`). Zich toʻrda bunday farq koʻzga tashlanadi — 1200
   katak yonma-yon turadi.

   Qiymatlar `DESIGN.md` shkalasidan:
   • holat foni  — `/10` (semantik rang, `bg-warning/10` naqshi)
   • holat ramkasi — `ring-1` (1px, ichkariga)
   • tanlov/fokus — `ring-2` (2px)
   • soʻndirish — bitta qiymat, `opacity-25`
   ════════════════════════════════════════════════════════════════════ */

/** Karta olinganda katak qanday koʻrinadi. */
export const DROP_CLASS: Record<DropState, string> = {
  ok: "bg-success/10 ring-1 ring-inset ring-success",
  caution: "bg-warning/10 ring-1 ring-inset ring-warning",
  clash: "bg-destructive/10 ring-1 ring-inset ring-destructive",
  blocked: "bg-muted",
  occupied: "",
};

/** Ziddiyatdagi katak — doimiy belgi (karta olinmagan holatda ham). */
export const CLASH_RING = "ring-1 ring-inset ring-destructive";

/** Tanlangan dars. */
export const SELECTED_RING = "ring-2 ring-inset ring-foreground";

/** Yoritilgan oʻqituvchining darsi. */
export const LIT_RING = "ring-1 ring-inset ring-primary";

/** Sudralayotgan element ustida turgan katak. */
export const OVER_RING_OK = "ring-2 ring-inset ring-primary";
export const OVER_RING_BAD = "ring-2 ring-inset ring-destructive";

/** Klaviatura fokusi — toʻrdagi faol katak. */
export const FOCUS_RING = "ring-2 ring-inset ring-[var(--ring)]";

/**
 * Eʼtibordan tashqaridagi katak.
 *
 * ⚠️ Bitta qiymat: ilgari 25/40/50/70/80 — besh xil soʻndirish bor edi
 * va ular bir ekranda uchrardi, natijada «qaysi biri muhimroq» degan
 * savol tugʻilardi.
 */
export const DIMMED = "opacity-25";

/** Sudralayotgan elementning oʻzi. */
export const DRAGGING = "opacity-40";
