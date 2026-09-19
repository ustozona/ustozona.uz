"use client";

import { cn } from "@/lib/utils";
import { SLIDE_LAYOUTS, SLIDE_LAYOUT_META, type SlideLayout } from "@/lib/slide-layouts";

/* Maket tanlagichi — har maket oʻzining SXEMATIK eskizi bilan.

   Nom yetarli emas: «Rasm + matn» bilan «Katta media» farqi soʻzda
   emas, joylashuvda. Eskiz sahnadagi haqiqiy tartibni takrorlaydi
   (chiziq = matn, toʻq blok = rasm), shuning uchun oʻqituvchi natijani
   tanlashdan oldin koʻradi. */

const bar = "rounded-sm bg-foreground/35";
const line = "h-1 rounded-sm bg-foreground/20";
const img = "rounded-sm bg-foreground/15";

function Sketch({ layout }: { layout: SlideLayout }) {
  switch (layout) {
    case "title":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <span className={cn(bar, "h-2 w-3/4")} />
          <span className={cn(line, "w-1/2")} />
        </div>
      );
    case "text":
      return (
        <div className="flex h-full flex-col gap-1">
          <span className={cn(bar, "h-1.5 w-1/2")} />
          <span className={cn(line, "w-full")} />
          <span className={cn(line, "w-5/6")} />
          <span className={cn(line, "w-4/6")} />
        </div>
      );
    case "list":
      return (
        <div className="grid h-full grid-cols-[3fr_2fr] gap-1">
          <div className="flex flex-col gap-1">
            <span className={cn(bar, "h-1.5 w-3/4")} />
            {[0, 1, 2].map((i) => (
              <span key={i} className="flex items-center gap-0.5">
                <span className="size-1 rounded-full bg-foreground/35" />
                <span className={cn(line, "flex-1")} />
              </span>
            ))}
          </div>
          <span className={img} />
        </div>
      );
    case "classic":
      return (
        <div className="flex h-full flex-col items-center gap-1">
          <span className={cn(bar, "h-1.5 w-1/2")} />
          <span className={cn(img, "w-2/3 flex-1")} />
          <span className={cn(line, "w-3/4")} />
        </div>
      );
    case "media":
      return (
        <div className="flex h-full flex-col items-center gap-1">
          <span className={cn(img, "w-full flex-1")} />
          <span className={cn(line, "w-1/2")} />
        </div>
      );
    case "quote":
      return (
        <div className="flex h-full flex-col items-center justify-center gap-1">
          <span className="text-xs leading-none text-foreground/35">“</span>
          <span className={cn(line, "w-3/4")} />
          <span className={cn(line, "w-2/3")} />
          <span className={cn(line, "w-1/3")} />
        </div>
      );
  }
}

export default function SlideLayoutPicker({
  value,
  onChange,
}: {
  value: SlideLayout;
  onChange: (layout: SlideLayout) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {SLIDE_LAYOUTS.map((layout) => {
        const active = layout === value;
        return (
          <button
            key={layout}
            type="button"
            aria-pressed={active}
            title={SLIDE_LAYOUT_META[layout].label}
            onClick={() => onChange(layout)}
            className={cn(
              "flex flex-col gap-1.5 rounded-lg border-2 p-1.5 text-left transition-colors",
              active ? "border-primary bg-accent" : "border-transparent bg-muted hover:border-primary/40",
            )}
          >
            <span className="aspect-video w-full rounded bg-card p-1.5">
              <Sketch layout={layout} />
            </span>
            <span className="truncate text-caption text-muted-foreground">
              {SLIDE_LAYOUT_META[layout].label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
