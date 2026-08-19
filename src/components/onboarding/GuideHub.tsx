"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  CircleHelp,
  Home,
  LayoutGrid,
  Users,
  Calendar,
  BookOpen,
  FileText,
  ClipboardList,
  Library,
  ClipboardCheck,
  BarChart2,
  Target,
  Check,
  ChevronRight,
  Award,
  MessagesSquare,
  MinusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTours } from "@/components/tour/tours";
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
  assignments: ClipboardList,
  resources: Library,
  attendance: ClipboardCheck,
  behavior: Award,
  grades: BarChart2,
  standards: Target,
  feedback: MessagesSquare,
};

export default function GuideHub() {
  const t = useTranslations("GuideHub");
  const tours = useTours();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const completedTours = useSettingsStore((s) => s.completedTours);
  const dismissedTours = useSettingsStore((s) => s.dismissedTours);
  const requestTour = useTourRequest((s) => s.requestTour);

  const openTour = (id: string, route: string) => {
    setOpen(false);
    requestTour(id);
    router.push(route);
  };

  // Faqat completed (skip emas) turlar progress'ga kiradi
  const doneCount = tours.filter((tour) => completedTours.includes(tour.id)).length;
  const progress = tours.length > 0 ? (doneCount / tours.length) * 100 : 0;

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
        <TooltipContent>{t("tooltip")}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="space-y-2 px-4 pb-3 pt-4">
          <p className="text-sm font-medium leading-none">{t("heading")}</p>
          <p className="text-xs text-muted-foreground">
            {t("description")}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {doneCount} / {tours.length}
            </span>
          </div>
        </div>
        {/* Vertikal "yoʻl" (stepper) — bosqichlar bogʻlovchi chiziq bilan
            ketma-ket ulanadi (onboarding-mahsulotlar naqshi: Linear/Notion).
            Chiziq har bir QATORNING OʻZIGA nisbatan chiziladi (globalь
            hisoblash emas) — shu qatorning doirasi markazidan keyingi
            qatornikigacha, roʻyxat balandligi qancha oʻzgarmasin ishlaydi. */}
        <div className="flex flex-col p-2">
          {tours.map((tour, i) => {
            const Icon = TOUR_ICONS[tour.id] ?? Home;
            const completed = completedTours.includes(tour.id);
            const dismissed = !completed && dismissedTours.includes(tour.id);
            const isLast = i === tours.length - 1;
            return (
              <div key={tour.id} className="relative">
                {!isLast && (
                  <span aria-hidden="true" className="absolute left-6 top-[22px] h-11 w-px bg-border" />
                )}
                <button
                  type="button"
                  onClick={() => openTour(tour.id, tour.route)}
                  title={dismissed ? t("dismissedTitle") : undefined}
                  className="group relative z-10 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted"
                >
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                      completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground group-hover:border-foreground/25 group-hover:text-foreground"
                    )}
                  >
                    {completed ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  </div>
                  <span className={cn("flex-1", dismissed && "text-muted-foreground")}>{tour.label}</span>
                  {dismissed ? (
                    <MinusCircle className="size-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.5} />
                  ) : !completed ? (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
