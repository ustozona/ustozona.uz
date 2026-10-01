"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSection } from "../SettingsFields";

/* ════════════════════════════════════════════════════════════════════
   STIKER — katta belgi: maqtov, yoʻl-yoʻriq, fasl
   (docs/doska-referens-koriklari.md R419).

   ⚠️ IDISHSIZ — matn vidjeti kabi: fon ham, ramka ham yoʻq, faqat belgi.

   ⚠️ Belgi tizim emoji shriftidan chiziladi, Apple sprite rasmidan
   EMAS. Sprite atigi 64 px: 300 px stiker 4K panelda xira chiqardi.
   Shrift esa har oʻlchamda tiniq. Platformaga qarab koʻrinishi biroz
   farq qiladi — proyektordagi tiniqlik muhimroq.

   Toʻplam ataylab kichik va sinfga moslangan — 1000 ta orasidan
   qidirish dars paytida vaqt oladi. Belgi sozlama kartasida tanlanadi;
   qoʻyilganda karta oʻzi ochiladi (`openSettingsOnAdd`).
   ════════════════════════════════════════════════════════════════════ */

export const STICKER_GROUPS: readonly { id: string; items: readonly string[] }[] = [
  { id: "praise", items: ["⭐", "🌟", "🏆", "🥇", "👍", "👏", "💯", "🎉", "❤️", "🔥"] },
  { id: "marks", items: ["✅", "❌", "❓", "❗", "💡", "⚠️", "🔇", "🤫", "✋", "👀"] },
  { id: "arrows", items: ["➡️", "⬅️", "⬆️", "⬇️", "👉", "👈", "👆", "👇", "🔁", "🎯"] },
  { id: "subjects", items: ["📚", "✏️", "📐", "🧮", "🧪", "🌍", "🎨", "🎵", "⚽", "💻"] },
  { id: "feelings", items: ["😀", "😊", "🙂", "😐", "🤔", "😮", "😢", "😴", "😎", "🥳"] },
  { id: "seasons", items: ["🍂", "❄️", "🌸", "☀️", "🌧️", "🌈", "🍎", "🌻", "🎂", "🎁"] },
];

const DEFAULT_STICKER = "⭐";

export function StickerWidget({ widget }: { widget: DoskaWidget }) {
  const emoji = typeof widget.state.emoji === "string" && widget.state.emoji ? widget.state.emoji : DEFAULT_STICKER;
  return (
    // SVG ichida: belgi vidjetning QISQA tomoniga sigʻadi (`meet`).
    // `cqh` ishlatilmaydi — vidjet idishi faqat kenglik boʻyicha
    // oʻlchanadi (`@container` = inline-size), balandlik birligi esa
    // oynaga nisbatan hisoblanib, belgi ramkadan chiqib ketardi.
    <svg role="img" aria-label={emoji} viewBox="0 0 100 100" className="size-full select-none">
      <text x="50" y="54" fontSize="82" textAnchor="middle" dominantBaseline="central">
        {emoji}
      </text>
    </svg>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function StickerSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.sticker");
  const current = typeof widget.state.emoji === "string" ? widget.state.emoji : DEFAULT_STICKER;

  return (
    <>
      {STICKER_GROUPS.map((group) => (
        <SettingsSection key={group.id} label={t(`groups.${group.id}`)}>
          <div className="grid grid-cols-5 gap-1">
            {group.items.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={item}
                aria-pressed={item === current}
                onClick={() => patch(widget.id, { emoji: item })}
                className={cn(
                  "hover:bg-muted focus-visible:ring-ring grid h-11 place-items-center rounded-lg text-2xl transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  item === current && "bg-primary/15 ring-primary ring-2",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </SettingsSection>
      ))}
    </>
  );
}
