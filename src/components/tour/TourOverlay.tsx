"use client";

import * as React from "react";
import {
  Tour,
  TourPortal,
  TourSpotlight,
  TourSpotlightRing,
  TourStep,
  TourArrow,
  TourHeader,
  TourTitle,
  TourDescription,
} from "@/components/ui/tour";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TourStep as TourStepData } from "./tours";
import { useSettingsStore } from "@/store/useSettingsStore";
import { TimetableDragMock } from "./mocks/TimetableDragMock";
import { TimetablePickMock } from "./mocks/TimetablePickMock";
import { BehaviorMultiSelectMock } from "./mocks/BehaviorMultiSelectMock";
import { FeedbackUpvoteMock } from "./mocks/FeedbackUpvoteMock";
import { Loader2, X, BellOff } from "lucide-react";

/* ════════════════════════════════════════════════════════════════════
   TOUR OVERLAY — bitta bosqichni chizadi.

   Footer dizayni: Intercom / Appcues / UserPilot standarti.
   – Yuqori o'ng: × (dismiss) — hover tooltip; ikki variant dropdown:
       • "O'tkazib yuborish"         → faqat bu turni skip
       • "Boshqa ko'rsatilmasin"     → autoToursEnabled = false + skip
   – Footer chap: progress dots (●●○○) + raqam
   – Footer o'ng: [Ortga] (faqat 2+ qadamda) + [Keyingi / Tushunarli]
   Jami: maks 2 ta action tugma + 1 icon = kognitiv yuk minimum.
   ════════════════════════════════════════════════════════════════════ */

type Props = {
  step: TourStepData;
  index: number;
  total: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
};

const MOCKS = {
  timetableDrag: TimetableDragMock,
  timetablePick: TimetablePickMock,
  behaviorMultiSelect: BehaviorMultiSelectMock,
  feedbackUpvote: FeedbackUpvoteMock,
} as const;

/* ── Progress dots ─────────────────────────────────────────────────── */
function ProgressDots({ index, total }: { index: number; total: number }) {
  // 8 ta dan oshsa raqam ko'rsatamiz, dots emas
  if (total > 8) {
    return (
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {index + 1} / {total}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5" aria-label={`${index + 1} / ${total} qadam`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "block rounded-full transition-all duration-300",
            i === index
              ? "size-2 bg-primary"
              : i < index
              ? "size-1.5 bg-primary/30"
              : "size-1.5 bg-border"
          )}
        />
      ))}
    </div>
  );
}

/* ── Dismiss dropdown (×) ──────────────────────────────────────────── */
function DismissButton({ onSkip, className }: { onSkip: () => void; className?: string }) {
  const setAutoToursEnabled = useSettingsStore((s) => s.setAutoToursEnabled);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Turni yopish"
          className={cn(
            "flex size-6 items-center justify-center rounded-md opacity-70 ring-offset-background transition-opacity hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            className
          )}
        >
          <X className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onSkip}>
          O&apos;tkazib yuborish
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground"
          onClick={() => {
            setAutoToursEnabled(false);
            onSkip();
          }}
        >
          <BellOff className="mr-2 size-3.5" />
          Boshqa ko&apos;rsatilmasin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Footer ────────────────────────────────────────────────────────── */
function Footer({ index, total, onNext, onPrev }: Omit<Props, "step" | "onSkip">) {
  const last = index === total - 1;
  const first = index === 0;

  return (
    <div className="mt-6 flex items-center justify-between gap-4">
      <ProgressDots index={index} total={total} />
      <div className="flex items-center gap-2">
        {!first && (
          <Button variant="ghost" size="sm" onClick={onPrev}>
            Ortga
          </Button>
        )}
        <Button size="sm" className="min-w-[80px]" onClick={onNext}>
          {last ? "Tushunarli" : "Keyingi"}
        </Button>
      </div>
    </div>
  );
}

/* ── Main overlay ──────────────────────────────────────────────────── */
export function TourOverlay({ step, index, total, onNext, onPrev, onSkip }: Props) {
  const wantsSpotlight = Boolean(step.target) && !step.mock;
  const Mock = step.mock && step.mock in MOCKS ? MOCKS[step.mock as keyof typeof MOCKS] : null;

  // null = kutilmoqda, true = topildi, false = topilmadi/markaziy
  const [targetFound, setTargetFound] = React.useState<boolean | null>(wantsSpotlight ? null : false);

  React.useEffect(() => {
    if (!wantsSpotlight) {
      setTargetFound(false);
      return;
    }
    if (document.querySelector(step.target!)) {
      setTargetFound(true);
      return;
    }
    const t = setTimeout(() => {
      setTargetFound(!!document.querySelector(step.target!));
    }, 800);
    return () => clearTimeout(t);
  }, [wantsSpotlight, step.target]);

  // Markaziy modal focus va klaviatura navigatsiyasi
  const modalRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (targetFound !== false) return;
    const node = modalRef.current;
    if (!node) return;

    const focusables = Array.from(
      node.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

    if (focusables.length > 0) {
      focusables[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (index > 0) onPrev();
      } else if (e.key === "Tab") {
        if (focusables.length === 0) return;
        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    node.addEventListener("keydown", handleKeyDown);
    return () => node.removeEventListener("keydown", handleKeyDown);
  }, [targetFound, onNext, onPrev, onSkip, index]);

  if (targetFound === null) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
        <Loader2 className="size-8 animate-spin text-white opacity-50" />
      </div>
    );
  }

  if (targetFound === false) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-lg outline-none",
            "animate-in fade-in-50 zoom-in-95 duration-fast"
          )}
          tabIndex={-1}
        >
          <DismissButton onSkip={onSkip} className="absolute right-4 top-4" />
          <h2 className="text-lg font-semibold leading-none tracking-tight pr-8">{step.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
          {Mock && (
            <div className="mt-6 flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 p-6">
              <Mock />
            </div>
          )}
          <Footer index={index} total={total} onNext={onNext} onPrev={onPrev} />
        </div>
      </div>
    );
  }

  return (
    <Tour open onOpenChange={() => {}} onSkip={onSkip}>
      <TourPortal>
        <TourSpotlight />
        <TourSpotlightRing className="rounded-lg" />
        <TourStep target={step.target!} side={step.placement ?? "bottom"} align={step.align ?? "center"}>
          <TourArrow />
          <div className="flex items-start justify-between gap-4">
            <TourHeader className="flex-1 min-w-0 space-y-1.5">
              <TourTitle className="text-base font-semibold leading-none tracking-tight">{step.title}</TourTitle>
              <TourDescription className="text-sm text-muted-foreground">{step.body}</TourDescription>
            </TourHeader>
            <DismissButton onSkip={onSkip} className="-mr-1 -mt-1 shrink-0 text-muted-foreground/70" />
          </div>
          <Footer index={index} total={total} onNext={onNext} onPrev={onPrev} />
        </TourStep>
      </TourPortal>
    </Tour>
  );
}
