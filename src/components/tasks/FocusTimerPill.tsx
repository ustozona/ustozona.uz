"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useFocusStore } from "@/store/useFocusStore";
import { useTasksStore } from "@/store/useTasksStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/shadcn-space/number-ticker/number-ticker-03";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   HEADER FOKUS TAYMERI — headerning oʻrtasida, primary tugma uslubidagi
   chip, `idle` holatda yashirin. Bosilsa popover ochiladi (vazifa nomi,
   progress-bar, toʻxtatish). SOF KOʻRSATISH komponenti — bosqich
   tugashi/toast/yozuv mantiqi `FocusEngine`da (layout ildizida, Header
   koʻrinishidan mustaqil). Bu yerda faqat 1s render-tik-tak bor.
   localStorage'dan oʻqigani uchun mount-gate shart.
   ════════════════════════════════════════════════════════════════════ */

export default function FocusTimerPill() {
  const t = useTranslations("FocusTimer");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const phase = useFocusStore((s) => s.phase);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const endsAt = useFocusStore((s) => s.endsAt);
  const startedAt = useFocusStore((s) => s.startedAt);
  const activeTask = useTasksStore((s) =>
    activeTaskId ? s.items.find((x) => x.id === activeTaskId) : undefined
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase === "idle") return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  if (!mounted || phase === "idle") return null;

  const remainingMs = Math.max(0, (endsAt ?? now) - now);
  const totalMs = startedAt != null && endsAt != null ? Math.max(1, endsAt - startedAt) : remainingMs || 1;
  const totalSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
  const isLastMinute = phase === "work" && remainingMs <= 60_000;

  const RING_R = 10;
  const RING_C = 2 * Math.PI * RING_R;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="default"
          size="sm"
          aria-label={t("openAria")}
          className={cn(
            "min-w-[78px] justify-center gap-1.5 rounded-full px-3 tabular-nums",
            isLastMinute && "animate-pulse bg-warning text-warning-foreground hover:bg-warning/90"
          )}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0 -ml-0.5">
            <circle cx="12" cy="12" r={RING_R} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
            <circle
              cx="12"
              cy="12"
              r={RING_R}
              fill="none"
              stroke={phase === "break" ? "var(--success)" : "currentColor"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
              transform="rotate(-90 12 12)"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <NumberTicker seconds={totalSec} showHours={false} className="text-xs font-medium tracking-tight" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-64 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {phase === "work" ? (activeTask?.title ?? t("focusLabel")) : t("breakLabel")}
          </span>
          <button
            type="button"
            onClick={() => useFocusStore.getState().stop()}
            aria-label={t("stopAria")}
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <NumberTicker
          seconds={totalSec}
          showHours={false}
          className="mt-2 text-2xl font-bold text-foreground"
        />
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-1000 ease-linear",
              isLastMinute ? "bg-warning" : phase === "work" ? "bg-primary" : "bg-success"
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
