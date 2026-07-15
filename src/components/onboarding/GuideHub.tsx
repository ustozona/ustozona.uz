"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CircleHelp,
  Home,
  LayoutGrid,
  Users,
  Calendar,
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart2,
  Target,
  CheckCircle,
  CircleCheck,
  ChevronRight,
  Award,
  MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { TOURS } from "@/components/tour/tours";
import { useTourRequest } from "@/components/tour/tour-request";

/* ════════════════════════════════════════════════════════════════════
   YOʻL-YOʻRIQ MARKAZI — headerdagi qalpoqcha tugmasining popover'i.

   "Boshlash" checklisti (progress bar + qator roʻyxati) — pull-model:
   qator bosilsa mos sahifaga oʻtiladi va tur DARHOL ishga tushadi
   (useTourRequest orqali — TourProvider yagona faollashtiruvchi boʻlib
   qoladi). Qatordagi belgi checkbox EMAS (odatdagi "todo-list" koʻrinishi
   bilan aralashib ketmasin) — oʻng tomondagi kichik belgi: koʻrilgan
   boʻlsa toʻldirilgan doira-galochka, aks holda hover'da paydo boʻladigan
   strelka (completedTours orqali aniqlanadi).
   ════════════════════════════════════════════════════════════════════ */

/* Sidebar (`app-sidebar.tsx`ʼdagi `navItems`) bilan AYNAN bir xil ikonkalar —
   Boshlash checklisti sidebar bilan vizual mos boʻlishi kerak. */
const TOUR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  classes: LayoutGrid,
  students: Users,
  timetable: Calendar,
  planner: BookOpen,
  lessons: FileText,
  attendance: ClipboardCheck,
  behavior: Award,
  grades: BarChart2,
  standards: Target,
  tasks: CheckCircle,
  feedback: MessagesSquare,
};

export default function GuideHub() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const completedTours = useSettingsStore((s) => s.completedTours);
  const requestTour = useTourRequest((s) => s.requestTour);

  const openTour = (id: string, route: string) => {
    setOpen(false);
    requestTour(id);
    router.push(route);
  };

  const doneCount = TOURS.filter((t) => completedTours.includes(t.id)).length;
  const progress = TOURS.length > 0 ? (doneCount / TOURS.length) * 100 : 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground">
              <CircleHelp />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Yoʻl-yoʻriq</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="space-y-2 px-4 pb-3 pt-4">
          <p className="text-sm font-medium leading-none">Boshlash</p>
          <p className="text-xs text-muted-foreground">
            Har bir boʻlimdan toʻliq foydalanishni oʻrganing.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {doneCount} / {TOURS.length}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5 p-2">
          {TOURS.map((t) => {
            const Icon = TOUR_ICONS[t.id] ?? Home;
            const seen = completedTours.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => openTour(t.id, t.route)}
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
              >
                <div
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                    "border-border bg-background text-muted-foreground",
                    "group-hover:border-foreground/25 group-hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                </div>
                <span className="flex-1">{t.label}</span>
                {seen ? (
                  <CircleCheck className="size-4 shrink-0 text-primary" strokeWidth={2} />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
