"use client";

import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InternalLink } from "@/lib/internal-links";

/* "/" HAVOLA POPUP — filtrlangan ichki sahifalar roʻyxati. Trigger
   aniqlash va matn ichiga qoʻshish `link-rich-input.tsx` ichida
   (contentEditable kompozer chip sifatida chizadi); bu fayl faqat
   dropdown UI'ni beradi. */

export function SlashLinkDropdown({
  items,
  activeIndex,
  onHover,
  onSelect,
  className,
}: {
  items: InternalLink[];
  activeIndex: number;
  onHover: (i: number) => void;
  onSelect: (item: InternalLink) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {items.map((item, i) => (
        <button
          key={item.href}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSelect(item)}
          onMouseEnter={() => onHover(i)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
            i === activeIndex ? "bg-accent text-accent-foreground" : "text-foreground"
          )}
        >
          <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
