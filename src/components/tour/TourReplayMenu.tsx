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
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettingsStore } from "@/store/useSettingsStore";
import { TOURS } from "./tours";

/* ════════════════════════════════════════════════════════════════════
   TOUR REPLAY MENU — header'dagi bitiruv qalpogʻi tugmasi.

   Har boʻlim turʼini alohida yoqib/oʻchirish orqali qayta koʻrsatish
   (checkbox oʻchirilsa completedTours'dan olib tashlanadi — mos
   route'ga oʻtilganda TourProvider avtomatik ishga tushiradi). Faqat
   navigatsiya qiladi — turni bevosita ishga tushirmaydi (bitta oʻrgatuvchi
   qatlam qoidasi: TourProvider yagona faollashtiruvchi).
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

export default function TourReplayMenu() {
  const router = useRouter();
  const completedTours = useSettingsStore((s) => s.completedTours);
  const setTourCompleted = useSettingsStore((s) => s.setTourCompleted);

  const doneCount = TOURS.filter((t) => completedTours.includes(t.id)).length;
  const allDone = doneCount === TOURS.length;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
              <GraduationCap />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Boʻlim yoʻriqnomalari</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="space-y-2 px-4 pb-3 pt-4">
          <p className="text-sm font-medium leading-none">Boʻlim yoʻriqnomalari</p>
          <p className="text-xs text-muted-foreground">
            Har bir boʻlimdan koʻproq foyda olishni oʻrganing.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Progress value={(doneCount / TOURS.length) * 100} className="h-1.5" />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {doneCount}/{TOURS.length}
            </span>
          </div>
        </div>

        {allDone && (
          <div className="flex flex-col items-center gap-1.5 border-t border-border px-4 py-5 text-center">
            <PartyPopper className="size-6 text-primary" />
            <p className="text-sm font-medium">Barcha yoʻriqnomalar koʻrildi!</p>
            <p className="text-xs text-muted-foreground">
              Istalganini qayta koʻrish uchun quyida belgisini oling.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-0.5 border-t border-border p-2">
          {TOURS.map((t) => {
            const Icon = TOUR_ICONS[t.id] ?? LayoutDashboard;
            const done = completedTours.includes(t.id);
            return (
              <label
                key={t.id}
                htmlFor={`tour-${t.id}`}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm hover:bg-muted"
              >
                <Checkbox
                  id={`tour-${t.id}`}
                  checked={done}
                  onCheckedChange={(v) => setTourCompleted(t.id, v === true)}
                />
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="size-3.5" />
                </div>
                <button
                  type="button"
                  onClick={() => router.push(t.route)}
                  className="flex-1 text-left"
                >
                  {t.label}
                </button>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
