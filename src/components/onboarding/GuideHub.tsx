"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  BookOpen,
  Users,
  Award,
  Target,
  ClipboardCheck,
  ListChecks,
  CheckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { TOURS } from "@/components/tour/tours";
import { useTourRequest } from "@/components/tour/tour-request";
import { useGettingStartedSteps } from "./useGettingStartedSteps";

/* ════════════════════════════════════════════════════════════════════
   YOʻL-YOʻRIQ MARKAZI — headerdagi qalpoqcha tugmasining popover'i.

   Ikki seksiya, bitta kirish nuqtasi:
   • "Boshlash" — haqiqiy amallar checklisti (useGettingStartedSteps,
     suzuvchi karta bilan bir manba). Yagona progress shu yerda.
   • "Boʻlim qoʻllanmalari" — pull-model: qator bosilsa mos sahifaga
     oʻtiladi va tur DARHOL ishga tushadi (useTourRequest orqali —
     TourProvider yagona faollashtiruvchi boʻlib qoladi). Checkbox va
     progress yoʻq: qoʻllanma koʻrish yutuq emas, yordam.

   Checklist tugamagan boʻlsa qalpoqchada kichik indikator nuqta turadi.
   ════════════════════════════════════════════════════════════════════ */

const TOUR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: LayoutDashboard,
  timetable: CalendarDays,
  planner: CalendarClock,
  lessons: BookOpen,
  students: Users,
  grades: Award,
  standards: Target,
  attendance: ClipboardCheck,
  tasks: ListChecks,
};

export default function GuideHub() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const completedTours = useSettingsStore((s) => s.completedTours);
  const requestTour = useTourRequest((s) => s.requestTour);
  const { steps, doneCount, allDone, ready, onboarded } = useGettingStartedSteps();

  // Checklist faqat onboarding tugagan va store'lar tayyor boʻlganda ishonchli.
  const showChecklist = ready && onboarded;
  const showBadge = showChecklist && !allDone;

  const openStep = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const openTour = (id: string, route: string) => {
    setOpen(false);
    requestTour(id);
    router.push(route);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-8 text-muted-foreground">
              <GraduationCap />
              {showBadge && (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Yoʻl-yoʻriq</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        {showChecklist && (
          <div className="border-b border-border">
            <div className="space-y-2 px-4 pb-3 pt-4">
              <p className="text-sm font-medium leading-none">Boshlash</p>
              <div className="flex items-center gap-2 pt-0.5">
                <Progress value={(doneCount / steps.length) * 100} className="h-1.5" />
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {doneCount}/{steps.length}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 px-2 pb-2">
              {steps.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => openStep(s.href)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted",
                    s.done && "text-muted-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4.5 shrink-0 items-center justify-center rounded-full border",
                      s.done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    )}
                  >
                    {s.done && <CheckIcon className="size-3" strokeWidth={3} />}
                  </span>
                  <span className={cn(s.done && "line-through")}>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1 px-4 pb-2 pt-4">
          <p className="text-sm font-medium leading-none">Boʻlim qoʻllanmalari</p>
          <p className="text-xs text-muted-foreground">
            Boʻlim qanday ishlashini joyida koʻrsatib beramiz.
          </p>
        </div>
        <div className="flex flex-col gap-0.5 p-2">
          {TOURS.map((t) => {
            const Icon = TOUR_ICONS[t.id] ?? LayoutDashboard;
            const seen = completedTours.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openTour(t.id, t.route)}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-3.5" />
                </div>
                <span className="flex-1">{t.label}</span>
                {seen && <CheckIcon className="size-3.5 shrink-0 text-muted-foreground/60" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
