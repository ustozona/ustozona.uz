"use client";

import { Palette, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/* Oʻng chekka reyl — oʻng ustunning rejimini tanlaydi (viktorina-uslub
   platformalarda keng tarqalgan vertikal panel: Mavzular / Xossalar).

   Nega alohida ustun: panel yopilganda ham "qayerga qaytish" koʻrinib
   turishi kerak. Bir tugmani qayta bosish panelni yopadi. */

export type BuilderPanel = "properties" | "themes" | null;

type Props = {
  panel: BuilderPanel;
  onSelect: (panel: BuilderPanel) => void;
};

const ITEMS = [
  { id: "themes" as const, label: "Mavzu", icon: Palette },
  { id: "properties" as const, label: "Xossalar", icon: SlidersHorizontal },
];

export default function BuilderRail({ panel, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col items-center gap-1 border-l border-border bg-muted/30 p-1.5">
      {ITEMS.map((item) => {
        const isActive = panel === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(isActive ? null : item.id)}
            className={cn(
              "flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-6" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
