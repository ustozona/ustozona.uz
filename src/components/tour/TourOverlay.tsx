"use client";

import * as React from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TourStep } from "./tours";
import { TimetableDragMock } from "./mocks/TimetableDragMock";
import { LessonsCalendarMock } from "./mocks/LessonsCalendarMock";
import { TasksCalendarMock } from "./mocks/TasksCalendarMock";

/* ════════════════════════════════════════════════════════════════════
   TOUR OVERLAY — bitta bosqichni chizadi.

   Ikki rejim:
   · Spotlight — `step.target` DOM'da topilsa: qorongʻi fon + teshik
     (box-shadow) + shu elementga ulangan tooltip (Popover + Anchor).
   · Markaziy modal — `mock` berilsa yoki target topilmasa: markazda
     karta (mock illyustratsiya yoki oddiy matn).

   Rect scroll/resize'da qayta hisoblanadi. Ranglar — dizayn tokenlari.
   ════════════════════════════════════════════════════════════════════ */

type Props = {
  step: TourStep;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
};

type Rect = { top: number; left: number; width: number; height: number };

const MOCKS = {
  timetableDrag: TimetableDragMock,
  lessonsCalendar: LessonsCalendarMock,
  tasksCalendar: TasksCalendarMock,
} as const;

/** Target elementni topib rect qaytaradi; scroll/resize'da yangilaydi. */
function useTargetRect(selector: string | undefined): Rect | null {
  const [rect, setRect] = React.useState<Rect | null>(null);

  React.useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    // Koʻrinishga keltiramiz (bosqich almashganda)
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });

    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    // Silliq scroll tugagach oxirgi pozitsiyani ushlash uchun
    const t = window.setTimeout(measure, 320);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [selector]);

  return rect;
}

function Footer({ index, total, onNext, onSkip }: Omit<Props, "step">) {
  const last = index === total - 1;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
      <span className="text-xs tabular-nums text-muted-foreground">
        {index + 1} / {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onSkip}>
          Oʻtkazib yuborish
        </Button>
        <Button size="sm" onClick={onNext}>
          {last ? "Tushunarli" : "Keyingi"}
        </Button>
      </div>
    </div>
  );
}

export function TourOverlay({ step, index, total, onNext, onSkip }: Props) {
  const wantsSpotlight = Boolean(step.target) && !step.mock;
  const rect = useTargetRect(wantsSpotlight ? step.target : undefined);
  const Mock = step.mock ? MOCKS[step.mock] : null;

  // Markaziy modal: mock berilgan yoki target topilmagan holat
  const centered = !wantsSpotlight || !rect;

  if (centered) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full max-w-lg rounded-xl border border-border bg-background p-5 shadow-lg",
            "animate-in fade-in-50 zoom-in-95 duration-200"
          )}
        >
          <h2 className="heading-small">{step.title}</h2>
          <p className="mt-1.5 text-sm/relaxed text-muted-foreground">{step.body}</p>
          {Mock && (
            <div className="mt-4 overflow-hidden rounded-lg border border-border bg-muted/30 p-3">
              <Mock />
            </div>
          )}
          <Footer index={index} total={total} onNext={onNext} onSkip={onSkip} />
        </div>
      </div>
    );
  }

  // Spotlight rejimi
  return (
    <>
      {/* Tashqi bosishlarni bloklovchi qatlam (teshiksiz — dim box-shadow'da) */}
      <div className="fixed inset-0 z-40" aria-hidden />
      {/* Teshik + qorongʻi fon */}
      <div
        aria-hidden
        className="pointer-events-none fixed z-50 rounded-lg transition-[top,left,width,height] duration-200"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
        }}
      />
      <Popover open>
        <PopoverAnchor asChild>
          <div
            className="pointer-events-none fixed z-50"
            style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
          />
        </PopoverAnchor>
        <PopoverContent
          side={step.placement ?? "bottom"}
          align="center"
          sideOffset={12}
          collisionPadding={16}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-[70] w-80"
        >
          <h2 className="heading-small">{step.title}</h2>
          <p className="mt-1.5 text-sm/relaxed text-muted-foreground">{step.body}</p>
          <Footer index={index} total={total} onNext={onNext} onSkip={onSkip} />
        </PopoverContent>
      </Popover>
    </>
  );
}
