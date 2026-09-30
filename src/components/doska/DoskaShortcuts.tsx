"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useTranslations } from "next-intl";

import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Z_SHORTCUTS, Z_SHORTCUTS_SCRIM } from "@/lib/doska/layers";
import { IconClose } from "./icons";
import { ShortcutKeys } from "./ShortcutKeys";
import { shortcutKey } from "./useDoskaShortcuts";

/* ════════════════════════════════════════════════════════════════════
   YORLIQLAR ROʻYXATI — `K` yoki `?`, menyuda «Klaviatura yorliqlari».

   Yorliqlar ilgari faqat kod izohida yozilgan edi: oʻqituvchi ularni
   tasodifan topardi (docs/doska-referens-koriklari.md R402). Roʻyxat
   uch guruhda — umumiy, tanlangan vidjet, qalam — va har qator:
   amal nomi + tugma.

   ⚠️ Qatorlar `useDoskaShortcuts` dagi toʻplamni takrorlaydi. Yorliq
   qoʻshilsa yoki oʻzgarsa, bu yerda ham yangilanadi.

   Yopish: `Esc`, fon, ✕ va yana `K` / `?` — qaysi tugma bilan ochgan
   boʻlsa, oʻsha bilan yopiladi. Oyna fokusni oʻziga oladi, shuning
   uchun ochiq paytda Doska yorliqlari jim (`isInsideOverlay`).
   ════════════════════════════════════════════════════════════════════ */

/** Bir nechta muqobil tugma (`← / →`), har biri — tugmalar birikmasi. */
type Row = { id: string; keys: readonly (readonly string[])[] };

const GROUPS: readonly { id: string; rows: readonly Row[]; note?: string }[] = [
  {
    id: "general",
    rows: [
      { id: "shortcuts", keys: [["K"], ["?"]] },
      { id: "undo", keys: [["Mod", "Z"]] },
      { id: "redo", keys: [["Mod", "Y"]] },
      { id: "screens", keys: [["←"], ["→"]] },
      { id: "remote", keys: [["PgUp"], ["PgDn"]] },
      { id: "fullscreen", keys: [["F"]] },
      { id: "controls", keys: [["B"]] },
      { id: "curtain", keys: [["1"]] },
      { id: "bell", keys: [["2"]] },
      { id: "back", keys: [["Esc"]] },
    ],
  },
  {
    id: "widget",
    rows: [
      { id: "settings", keys: [["S"]] },
      { id: "duplicate", keys: [["Mod", "D"]] },
      { id: "delete", keys: [["Delete"]] },
      { id: "move", keys: [["←", "↑", "→", "↓"]] },
      { id: "moveFar", keys: [["Shift", "←"]] },
    ],
  },
  {
    id: "ink",
    rows: [
      { id: "pen", keys: [["P"]] },
      { id: "marker", keys: [["M"]] },
      { id: "eraser", keys: [["E"]] },
      { id: "laser", keys: [["L"]] },
    ],
    note: "inkNote",
  },
];

export function DoskaShortcuts({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("Doska.shortcuts");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay style={{ zIndex: Z_SHORTCUTS_SCRIM }} />
        <DialogPrimitive.Content
          className="doska-bar doska-sheet fixed top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col outline-none"
          style={{ zIndex: Z_SHORTCUTS }}
          onKeyDown={(e) => {
            const key = shortcutKey(e.nativeEvent);
            if (key === "k" || key === "?") {
              e.preventDefault();
              onOpenChange(false);
            }
          }}
        >
          <div className="flex items-start gap-3 border-b px-5 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <DialogTitle className="text-base font-medium">{t("title")}</DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs leading-relaxed">
                {t("description")}
              </DialogDescription>
            </div>
            <DialogPrimitive.Close
              aria-label={t("close")}
              className="hover:bg-muted focus-visible:ring-ring -my-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <IconClose className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <div className="grid min-h-0 gap-x-8 gap-y-5 overflow-y-auto overscroll-contain px-5 py-4 sm:grid-cols-2">
            {/* Umumiy — chap ustun; vidjet va qalam — oʻngda, ketma-ket. */}
            {[GROUPS.slice(0, 1), GROUPS.slice(1)].map((column, i) => (
              <div key={i} className="flex flex-col gap-5">
                {column.map((group) => (
                  <section key={group.id} className="flex flex-col gap-1">
                    <h3 className="text-muted-foreground pb-1 text-xs font-medium tracking-wide uppercase">
                      {t(`groups.${group.id}`)}
                    </h3>
                    <ul className="flex flex-col">
                      {group.rows.map((row) => (
                        <li key={row.id} className="flex min-h-9 items-center justify-between gap-4 text-sm">
                          <span className="min-w-0">{t(`items.${row.id}`)}</span>
                          <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs">
                            {row.keys.map((combo, j) => (
                              <React.Fragment key={j}>
                                {j > 0 && <span aria-hidden="true">/</span>}
                                <ShortcutKeys keys={combo} />
                              </React.Fragment>
                            ))}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {group.note && (
                      <p className="text-muted-foreground pt-1 text-xs leading-relaxed">{t(`notes.${group.note}`)}</p>
                    )}
                  </section>
                ))}
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
