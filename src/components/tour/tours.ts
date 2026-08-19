/* ════════════════════════════════════════════════════════════════════
   BOʻLIM TURʼLARI — coach-mark onboarding reyestri (sof maʼlumot).

   Har bir boʻlimga birinchi marta kirilganda tur avtomatik ishga tushadi
   (autoToursEnabled + katta ekran + 2 martadan koʻp tashlab ketilmagan
   boʻlsa; TourProvider boshqaradi). GuideHub orqali istalgan payt qayta
   koʻrish ham mumkin (soʻrov yoʻli). `id` — koʻrilgan turʼlar roʻyxatiga
   (useSettingsStore.completedTours) yoziladigan kalit.

   Kontent qoidasi: qadam ekranda koʻrinib turgan narsani takrorlamasin —
   faqat koʻrinmas imkoniyat (drag, rotatsiya, vazn, status almashtirish)
   haqida gapirsin.

   Bosqich `target` — `[data-tour="…"]` selektori; boʻlmasa yoki `mock`
   berilsa markazlashgan modal koʻrsatiladi (boʻsh hisobda real region
   oʻrniga mustaqil illyustratsiya).

   Matn (sarlavha/tavsif/label) `messages/*.json`dagi "ProductTours"
   nomfazosida — struktura shu yerda saqlanadi, `useTours()` hook orqali
   tarjima bilan birlashtiriladi (OnboardingWizard STEPS naqshiga oʻxshab). */

import * as React from "react";
import { useTranslations } from "next-intl";

export type TourMock =
  | "timetableDrag"
  | "timetablePick"
  | "behaviorMultiSelect"
  | "feedbackUpvote";

export type TourStep = {
  title: string;
  body: string;
  /** '[data-tour="…"]' — yoʻq boʻlsa markaziy modal */
  target?: string;
  placement?: "top" | "bottom" | "left" | "right";
  /** Yon (cross-axis) tekislash — daf'atan "center"; nishon burchakka yaqin
      boʻlsa "start"/"end" bilan tooltipni pastdagi kontentdan uzoqlashtiring. */
  align?: "start" | "center" | "end";
  /** Tooltip/modal ichidagi illyustratsiya */
  mock?: TourMock;
  /** Sahifaga signal berish uchun barqaror kalit (useTourRequest.activeStepId) —
      masalan markaziy modal qadamida sahifa holatini vaqtincha almashtirish
      uchun (koʻrinishni "oy"ga oʻtkazish kabi). */
  id?: string;
};

export type TourDef = {
  id: string;
  /** Aynan shu pathname'da ishga tushadi */
  route: string;
  /** "Turlarni qayta koʻrish" panelida koʻrsatiladigan nom */
  label: string;
  steps: TourStep[];
};

/** Faqat struktura (matnsiz) — sarlavha/tavsif/label `useTours()` ichida
    "ProductTours" nomfazosidan t() bilan qoʻshiladi. */
type TourStepStructure = Omit<TourStep, "title" | "body">;
type TourStructure = { id: string; route: string; steps: TourStepStructure[] };

/* Tartib QASDAN yon panel (`app-sidebar.tsx`ʼdagi `navItems`) bilan bir xil
   ketma-ketlikda — GuideHub "Boshlash" checklisti sidebar bilan mos
   navigatsiya taʼminlasin. Yangi sahifa qoʻshsangiz ikkalasiga ham xuddi
   shu joyga qoʻshing. */
const TOUR_STRUCTURE: readonly TourStructure[] = [
  {
    id: "home",
    route: "/dashboard",
    steps: [
      { target: '[data-tour="sidebar-nav"]', placement: "right" },
      { target: '[data-tour="home-overview"]', placement: "right" },
      { target: '[data-tour="home-queue"]', placement: "right" },
      { target: '[data-tour="home-schedule"]', placement: "left" },
    ],
  },
  {
    id: "timetable",
    route: "/dashboard/timetable",
    steps: [
      { target: '[data-tour="timetable-class-selector"]', placement: "right" },
      { target: '[data-tour="timetable-grid"]', placement: "left" },
      { mock: "timetableDrag" },
      { mock: "timetablePick" },
    ],
  },
  {
    id: "classes",
    route: "/dashboard/classes",
    steps: [
      { target: '[data-tour="classes-add"]', placement: "bottom" },
      { target: '[data-tour="classes-list"]', placement: "left" },
      { target: '[data-tour="classes-stats"]', placement: "left" },
    ],
  },
  {
    id: "students",
    route: "/dashboard/students",
    steps: [
      { target: '[data-tour="students-classes"]', placement: "right" },
      { target: '[data-tour="students-list"]', placement: "left" },
      { target: '[data-tour="students-preview"]', placement: "left" },
    ],
  },
  {
    id: "planner",
    route: "/dashboard/planner",
    steps: [
      { target: '[data-tour="planner-empty-slot"]', placement: "right" },
      { target: '[data-tour="planner-lesson-block"]', placement: "right" },
      { target: '[data-tour="planner-day-settings"]', placement: "left" },
      { id: "planner-month-preview" },
    ],
  },
  {
    id: "lessons",
    route: "/dashboard/lessons",
    steps: [
      { target: '[data-tour="lessons-classes"]', placement: "right", id: "lessons-classes" },
      { target: '[data-tour="lessons-units"]', placement: "left" },
      { target: '[data-tour="lessons-list"]', placement: "left" },
    ],
  },
  {
    id: "assignments",
    route: "/dashboard/assignments",
    steps: [
      { target: '[data-tour="assignments-classes"]', placement: "right" },
      { target: '[data-tour="assignments-list"]', placement: "left" },
      { target: '[data-tour="assignments-create"]', placement: "bottom", align: "end" },
    ],
  },
  {
    id: "attendance",
    route: "/dashboard/attendance",
    steps: [
      { target: '[data-tour="attendance-classes"]', placement: "right" },
      { target: '[data-tour="attendance-heatmap"]', placement: "left" },
      { target: '[data-tour="attendance-config"]', placement: "bottom" },
    ],
  },
  {
    id: "behavior",
    route: "/dashboard/behavior",
    steps: [
      { target: '[data-tour="behavior-classes"]', placement: "right" },
      { target: '[data-tour="behavior-grid"]', placement: "left" },
      { mock: "behaviorMultiSelect" },
      { target: '[data-tour="behavior-report"]', placement: "bottom" },
      { target: '[data-tour="behavior-points"]', placement: "bottom" },
    ],
  },
  {
    id: "grades",
    route: "/dashboard/grades",
    steps: [
      { target: '[data-tour="grades-classes"]', placement: "right", id: "grades-classes" },
      { target: '[data-tour="grades-topics"]', placement: "bottom" },
      { target: '[data-tour="grades-grid"]', placement: "left" },
    ],
  },
  {
    id: "standards",
    route: "/dashboard/standards",
    steps: [
      { target: '[data-tour="standards-classes"]', placement: "right", id: "standards-classes" },
      { target: '[data-tour="standards-add"]', placement: "bottom", align: "end" },
      { target: '[data-tour="standards-list"]', placement: "left" },
    ],
  },
  {
    id: "feedback",
    route: "/dashboard/feedback",
    steps: [
      { target: '[data-tour="feedback-composer"]', placement: "bottom" },
      { target: '[data-tour="feedback-toolbar"]', placement: "bottom" },
      { mock: "feedbackUpvote" },
    ],
  },
] as const;

/** Tarjima bilan toʻldirilgan turʼlar roʻyxati — ProductTours nomfazosi
    (har tur `id`si ostida `label` + `steps.<index>.title/body`). */
export function useTours(): TourDef[] {
  const t = useTranslations("ProductTours");
  return React.useMemo(
    () =>
      TOUR_STRUCTURE.map((tour) => ({
        id: tour.id,
        route: tour.route,
        label: t(`${tour.id}.label`),
        steps: tour.steps.map((step, i) => ({
          ...step,
          title: t(`${tour.id}.steps.${i}.title`),
          body: t(`${tour.id}.steps.${i}.body`),
        })),
      })),
    [t]
  );
}

/** Berilgan pathname uchun boshlanadigan tur (aniq moslik). */
export function tourForRoute(tours: TourDef[], pathname: string): TourDef | undefined {
  return tours.find((t) => t.route === pathname);
}
