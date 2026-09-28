import { createElement, type CSSProperties } from "react";

import type { classTints } from "@/lib/class-colors";
import { classIcon } from "@/lib/class-icons";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   SINF QATORI — Sinflar panelining qator retsepti, YAGONA manba.

   `ClassListPanel` (sinf navigatsiyasi) va `ClassSelect` (oʻquvchi
   profilidagi sinf tanlagichi) tanlangan sinfni aynan bir xil chizadi.
   Retsept ikki joyda qoʻlda yozilsa, birida oʻzgarib ikkinchisida
   qolib ketadi — shu sabab ikkalasi ham shu yerdan oladi.

   CSS qismi — `globals.css` dagi `.list-row .list-row--glyph` va
   `[data-slot="class-glyph"]`; bu yerda faqat inline retsept (sinf rangi
   runtime qiymat) va klasslar. DESIGN.md §2 deviatsiyasi.
   ════════════════════════════════════════════════════════════════════ */

type Tints = ReturnType<typeof classTints>;

/** Qator elementi klasslari. `group/class-row` — nom rangining hover'i uchun
    (nomli guruh: tashqi `.group` ajdodlar aralashmasin). `focus-visible:z-10`
    — klaviatura halqasi qoʻshni (tanlangan, tint fonli) qator ostida
    qolmasin: qatorlar orasida boʻshliq yoʻq. */
export const CLASS_ROW_CLASS = "list-row list-row--glyph group/class-row w-full focus-visible:z-10";

/** Qatorning inline uslubi: `--card-accent` doim; tanlanganda 7% tint fon +
    1px chegara toʻliq sinf rangida (umumiy `softBorder` 22% och ranglarda
    koʻrinmasdi). */
export function classRowStyle(tints: Tints, active: boolean): CSSProperties {
  return {
    ["--card-accent" as string]: tints.solid,
    ...(active ? { ...tints.tint, border: `1px solid ${tints.solid}` } : {}),
  };
}

/** Sinf nomi — tanlanganda qalin, aks holda xiraroq va hover'da toʻliq. */
export function classRowNameClass(active: boolean): string {
  return cn(
    "min-w-0 flex-1 truncate text-sm transition-colors",
    active ? "font-semibold text-foreground" : "text-foreground/70 group-hover/class-row:text-foreground"
  );
}

/** Sinf ikonkasi doirasi (36px): tinch — 18% tint + rangli ikonka (CSS),
    tanlangan — toʻyingan `gradientTile` + oq ikonka (Karta pasporti v2). */
export function ClassRowGlyph({
  icon,
  tints,
  active,
}: {
  icon?: string;
  tints: Tints;
  active: boolean;
}) {
  return (
    <span data-slot="class-glyph" aria-hidden="true" style={active ? tints.gradientTile : undefined}>
      {/* `classIcon` modul darajasidagi barqaror lucide komponentini qaytaradi;
          `createElement` — render ichida komponent «yaratilmaydi» (lint). */}
      {createElement(classIcon(icon))}
    </span>
  );
}
