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
import { cn } from "@/lib/utils";
import type { TourStep as TourStepData } from "./tours";
import { TimetableDragMock } from "./mocks/TimetableDragMock";
import { TimetablePickMock } from "./mocks/TimetablePickMock";
import { LessonsCalendarMock } from "./mocks/LessonsCalendarMock";
import { TasksCalendarMock } from "./mocks/TasksCalendarMock";
import { BehaviorMultiSelectMock } from "./mocks/BehaviorMultiSelectMock";

/* ════════════════════════════════════════════════════════════════════
   TOUR OVERLAY — bitta bosqichni chizadi.

   `@diceui/tour` primitivlari (Tour/TourPortal/TourSpotlight/…) spotlight
   + tooltip joylashuvini boshqaradi (floating-ui asosida, focus-trap
   ichkarida tayyor). Bosqichlar orasidagi navigatsiya esa TAShqi holatga
   (TourProvider) tegishli — shu sabab TourNext/TourPrev/TourSkipʼni EMAS,
   oddiy tugmalarni `onNext`/`onSkip` propʼlariga bogʻlab ishlatamiz: har
   safar `step` almashganda `TourOverlay` butunlay qayta mount boʻladi
   (parentdagi `key`), shuning uchun ichkarida faqat bitta bosqich (value=0)
   registratsiya qilinadi.

   `mock` berilgan yoki `target` topilmaydigan bosqichlar uchun diceui/tour
   mos kelmaydi (u target elementsiz ishlamaydi) — bu holatda avvalgidek
   markaziy modal saqlanib qoladi.
   ════════════════════════════════════════════════════════════════════ */

type Props = {
  step: TourStepData;
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
};

const MOCKS = {
  timetableDrag: TimetableDragMock,
  timetablePick: TimetablePickMock,
  lessonsCalendar: LessonsCalendarMock,
  tasksCalendar: TasksCalendarMock,
  behaviorMultiSelect: BehaviorMultiSelectMock,
} as const;

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
  const Mock = step.mock ? MOCKS[step.mock] : null;

  // Yoʻq-target himoyasi: spotlight qadamining nishoni DOM'da boʻlmasa
  // (masalan, boʻsh holatda grid render qilinmagan) tur "koʻrinmas-aktiv"
  // osilib qolardi — Next/Skip tugmalari ham yoʻq. Sahifa hali render
  // boʻlayotgan boʻlishi mumkin, shuning uchun ~300ms kutib qayta
  // tekshiramiz; baribir topilmasa qadam avtomatik oʻtkaziladi (oxirgi
  // qadamda bu turni yakunlaydi).
  React.useEffect(() => {
    if (!wantsSpotlight) return;
    if (document.querySelector(step.target!)) return;
    const t = setTimeout(() => {
      if (!document.querySelector(step.target!)) onNext();
    }, 300);
    return () => clearTimeout(t);
  }, [wantsSpotlight, step.target, onNext]);

  if (!wantsSpotlight) {
    // Markaziy modal: mock berilgan yoki target berilmagan holat
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full max-w-xl rounded-xl border border-border bg-background p-5 shadow-lg",
            "animate-in fade-in-50 zoom-in-95 duration-fast"
          )}
        >
          <h2 className="heading-small">{step.title}</h2>
          <p className="mt-1.5 text-sm/relaxed text-muted-foreground">{step.body}</p>
          {Mock && (
            <div className="mt-4 flex items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30 p-6">
              <Mock />
            </div>
          )}
          <Footer index={index} total={total} onNext={onNext} onSkip={onSkip} />
        </div>
      </div>
    );
  }

  // Spotlight rejimi — diceui/tour. Target DOM'da topilmasa TourStep hech
  // narsa render qilmaydi (forceMount berilmagan), shu holatda ham
  // xavfsiz — sahifa ustida ortiqcha element qolmaydi.
  return (
    <Tour open onOpenChange={() => {}} onSkip={onSkip}>
      <TourPortal>
        <TourSpotlight />
        <TourSpotlightRing className="rounded-lg" />
        <TourStep target={step.target!} side={step.placement ?? "bottom"} align={step.align ?? "center"}>
          <TourArrow />
          <TourHeader>
            <TourTitle>{step.title}</TourTitle>
            <TourDescription>{step.body}</TourDescription>
          </TourHeader>
          <Footer index={index} total={total} onNext={onNext} onSkip={onSkip} />
        </TourStep>
      </TourPortal>
    </Tour>
  );
}
