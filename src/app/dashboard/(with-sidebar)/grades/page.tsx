"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import GradesView from "./_components/GradesView";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { useGradesStore } from "@/store/useGradesStore";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeGradesTourDemoClasses, makeGradesTourDemoClassData, GRADES_TOUR_DEMO_CLASS_ID,
} from "@/components/tour/grades-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";

export default function GradesPage() {
  const t = useTranslations("GradesPage");
  // Sinf tanlash — `?classId=` URL param (refresh/deep-link chidamli).
  // null = hech narsa tanlanmagan (Sinflar ustuni 50%). Tanlanganda URL +
  // store default yangilanadi (boshqa sahifalar bilan sinxron).
  const [selectedClassId, handleSelectClass] = useClassIdParam();

  // Boʻsh hisobda "jurnal" turi ishga tushsa — namunaviy sinf + toʻliq
  // jurnal koʻrsatiladi (students/lessons turi bilan bir xil naqsh).
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const tourActive = useTourRequest((s) => s.activeTourId === "grades");
  const activeTourStepId = useTourRequest((s) => s.activeStepId);
  const isDemoMode = tourActive && Object.keys(classDataMap).length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeGradesTourDemoClasses() : null), [isDemoMode]);
  const demoClassData = useMemo(() => (isDemoMode ? makeGradesTourDemoClassData() : null), [isDemoMode]);
  const effectiveClassId = isDemoMode ? GRADES_TOUR_DEMO_CLASS_ID : selectedClassId;

  // "Sinflaringiz" bosqichida jurnal ustuni hali ochilmagan koʻrinishida
  // qolsin — aks holda demo topshiriqlar oldindan koʻrinib, xuddi tur
  // allaqachon jurnalga oʻtganday taassurot qoldiradi.
  const classesStepActive = isDemoMode && activeTourStepId === "grades-classes";

  /* Ustun nisbatlari (lessons/students usuli) — flex-grow + flex-basis:0:
     sinf tanlanmagan → 50/50, sinf tanlangan → sinflar tor, jurnal keng. */
  const noClass = !effectiveClassId || classesStepActive;
  const grow = noClass ? { classes: 1, content: 1 } : { classes: 1, content: 3 };
  const columnsTemplate = `minmax(0,${grow.classes}fr) minmax(0,${grow.content}fr)`;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0">
      <TourDemoBanner tourId="grades" active={isDemoMode} />
      <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden p-4 md:p-6">
        <DashboardColumn hideBelow="lg" data-tour="grades-classes">
          <ClassListPanel
            page="grades"
            selectedClassId={selectedClassId ?? (isDemoMode ? GRADES_TOUR_DEMO_CLASS_ID : "")}
            onSelect={handleSelectClass}
            demoClasses={demoClasses ?? undefined}
          />
        </DashboardColumn>

        <div className="flex min-w-0 min-h-0 h-full flex-col">
          {noClass ? (
            <div className="h-full overflow-hidden rounded-xl border border-border bg-card">
              <Empty className="h-full border-0">
                <EmptyHeader>
                  <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
                  <EmptyTitle>{t("emptyTitle")}</EmptyTitle>
                  <EmptyDescription>{t("emptyDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <GradesView classId={effectiveClassId} demoClassData={demoClassData ?? undefined} />
          )}
        </div>
      </DashboardColumns>
    </div>
  );
}
