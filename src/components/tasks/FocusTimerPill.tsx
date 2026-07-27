"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, SkipForward } from "lucide-react";
import { useFocusStore } from "@/store/useFocusStore";
import { useTasksStore } from "@/store/useTasksStore";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { NumberTicker } from "@/components/shadcn-space/number-ticker/number-ticker-03";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   HEADER FOKUS TAYMERI — headerning oʻrtasida, uchta ALOHIDA shakl:
   doira (progres halqasi) · toʻrtburchak (vaqt) · doira (pauza/davom).
   Birinchi ikkisi popoverni ochadi (hover'da rangi ATAYLAB oʻzgarmaydi
   — bir butun chip taassuroti buzilmasin), uchinchisi popoverni
   ochmasdan darhol pauza/davom qiladi va oʻz doira shaklida hover
   beradi. Uchtasi ham bitta `PopoverAnchor` ichida — shuning uchun
   Popover boshqariladigan (`open` state) rejimda ishlaydi: Radix'da
   bitta trigger boʻladi, bizda esa ikkita ochuvchi element bor.

   SOF KOʻRSATISH komponenti — bosqich tugashi/toast/yozuv mantiqi
   `FocusEngine`da (layout ildizida, Header koʻrinishidan mustaqil).
   Bu yerda faqat 1s render-tik-tak bor. localStorage'dan oʻqigani
   uchun mount-gate shart. Mini chipda raqam-aylanish animatsiyasi
   ATAYLAB ishlatilmaydi (har soniya "sakrab" koʻrinardi, `:` esa
   animatsiyadan tashqarida qolib joylashuvi buzilardi) — faqat
   popover ichidagi katta raqamda qoladi.
   ════════════════════════════════════════════════════════════════════ */

function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* Pauza/Play belgilari ATAYLAB qoʻlda chizilgan, lucide emas: lucide'ning
   `Pause`i chiziqli (stroke) ikonka, uni `fill-current` bilan toʻldirsak
   chiziq+toʻldirish ustma-ust tushib, kalta va semiz "dumaloq" koʻrinardi.
   Bu yerda esa toza toʻldirilgan geometriya — nisbatlar plyer tugmalari
   uchun standart (baland-ingichka ikki ustun, orasi ustun kengligicha). */
function PauseGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <rect x="4.75" y="3" width="2.5" height="10" rx="1.25" />
      <rect x="8.75" y="3" width="2.5" height="10" rx="1.25" />
    </svg>
  );
}

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className={className}>
      <path
        d="M5.6 3.4 12.2 7.5a.6.6 0 0 1 0 1L5.6 12.6A.6.6 0 0 1 4.7 12V4a.6.6 0 0 1 .9-.6Z"
        strokeWidth="1.1"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FocusTimerPill() {
  const t = useTranslations("FocusTimer");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [open, setOpen] = useState(false);

  const phase = useFocusStore((s) => s.phase);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const endsAt = useFocusStore((s) => s.endsAt);
  const startedAt = useFocusStore((s) => s.startedAt);
  const pausedAt = useFocusStore((s) => s.pausedAt);
  const activeTask = useTasksStore((s) =>
    activeTaskId ? s.items.find((x) => x.id === activeTaskId) : undefined
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase === "idle" || pausedAt != null) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase, pausedAt]);

  if (!mounted || phase === "idle") return null;

  const isPaused = pausedAt != null;
  const clockNow = isPaused ? pausedAt : now;
  const remainingMs = Math.max(0, (endsAt ?? clockNow) - clockNow);
  const totalMs = startedAt != null && endsAt != null ? Math.max(1, endsAt - startedAt) : remainingMs || 1;
  const totalSec = Math.ceil(remainingMs / 1000);
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
  const isLastMinute = phase === "work" && !isPaused && remainingMs <= 60_000;
  const isBreak = phase === "break";

  const RING_R = 10;
  const RING_C = 2 * Math.PI * RING_R;

  const taskLabel = phase === "work" ? activeTask?.title ?? t("focusLabel") : t("breakLabel");
  const timerAriaLabel = t("timerAria", { time: formatClock(totalSec) });
  const togglePause = () =>
    isPaused ? useFocusStore.getState().resume() : useFocusStore.getState().pause();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        {/* Bir butun pill — fon/rang FAQAT shu tashqi qobiqda. Ichkaridagi
            uchta tugma shaffof: shu bois hover faqat pauza doirasida
            koʻrinadi, chap tomon (halqa+vaqt) hover'da oʻzgarmaydi. */}
        <div
          role="timer"
          aria-label={isPaused ? `${timerAriaLabel} (${t("pausedLabel")})` : timerAriaLabel}
          className={cn(
            "inline-flex h-9 items-center rounded-full p-0.5 transition-colors duration-300",
            "bg-primary text-primary-foreground",
            isBreak && "bg-success text-success-foreground",
            isLastMinute && "bg-warning text-warning-foreground"
          )}
        >
          {/* 1) Doira — progres halqasi, popoverni ochadi (hover'da rang oʻzgarmaydi) */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("openAria")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r={RING_R} fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
              <circle
                cx="12"
                cy="12"
                r={RING_R}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - progress)}
                transform="rotate(-90 12 12)"
                className={cn(!isPaused && "transition-[stroke-dashoffset] duration-1000 ease-linear")}
              />
            </svg>
          </button>

          {/* 2) Vaqt — popoverni ochadi (hover'da rang oʻzgarmaydi).
              `font-mono` MAJBURIY: interfeys shrifti DM Sans'da `tnum`
              (tabular figures) xususiyati yoʻq, shuning uchun `tabular-nums`
              unda ishlamaydi va raqamlar almashganda kenglik sakraydi
              ("1" ingichka, "8" semiz). JetBrains Mono allaqachon
              yuklangan (`--font-mono`) va barcha raqami bir xil kenglikda. */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={t("openAria")}
            className="flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-full px-1 font-mono text-sm font-medium tabular-nums leading-none tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            {formatClock(totalSec)}
          </button>

          {/* 3) Doira — pauza/davom, popoverni ochmaydi; hover doira shaklida.
              Overlay oq/qora juftligi: yorugʻ mavzuda fon toʻq (oq bilan
              yoritamiz), qorongʻi mavzuda fon och (qora bilan toʻqlashtiramiz). */}
          <button
            type="button"
            onClick={togglePause}
            aria-label={isPaused ? t("resumeAria") : t("pauseAria")}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 dark:hover:bg-black/20"
          >
            {isPaused ? <PlayGlyph className="size-4" /> : <PauseGlyph className="size-4" />}
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent align="center" className="w-64 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{taskLabel}</span>
          {isPaused && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {t("pausedLabel")}
            </span>
          )}
        </div>
        {/* `font-mono` + `font-medium`: DM Sans'da tabular raqam yoʻq (yuqoridagi
            izohga qarang), JetBrains Mono'dan esa faqat 400/500 vazn yuklangan —
            `font-bold` sintetik qalinlashtirishga tushib qolardi. */}
        <NumberTicker
          seconds={totalSec}
          showHours={false}
          className="mt-2 font-mono text-2xl font-medium tabular-nums text-foreground"
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

        <div className="mt-3 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1 gap-1.5" onClick={togglePause}>
            {isPaused ? <Play className="size-3.5 fill-current" /> : <Pause className="size-3.5" />}
            {isPaused ? t("resumeAria") : t("pauseAria")}
          </Button>
          {isBreak && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => useFocusStore.getState().completeBreak()}
            >
              <SkipForward className="size-3.5" />
              {t("skipBreak")}
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1.5 w-full text-muted-foreground hover:text-destructive"
          onClick={() => useFocusStore.getState().stop()}
        >
          {t("stopSession")}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
