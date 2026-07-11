"use client";

import { useMemo } from "react";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import StandardsView from "./_components/StandardsView";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import { useStandardsStore } from "@/store/useStandardsStore";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeStandardsTourDemoClasses, makeStandardsTourDemoSets, STANDARDS_TOUR_DEMO_CLASS_ID,
} from "@/components/tour/standards-tour-demo";

export default function StandardsPage() {
  // Sinf tanlash — lokal holat. null = hech narsa tanlanmagan (Sinflar ustuni 50%).
  // Tanlangach store ham yangilanadi (boshqa sahifalar bilan sinxron).
  const [selectedClassId, handleSelectClass] = useClassIdParam();

  // Boʻsh hisobda "standartlar" turi ishga tushsa — namunaviy sinf + toʻplam
  // koʻrsatiladi (grades/attendance turi bilan bir xil naqsh).
  const sets = useStandardsStore((s) => s.sets);
  const tourActive = useTourRequest((s) => s.activeTourId === "standards");
  const isDemoMode = tourActive && sets.length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeStandardsTourDemoClasses() : null), [isDemoMode]);
  const demoSets = useMemo(() => (isDemoMode ? makeStandardsTourDemoSets() : null), [isDemoMode]);
  const effectiveClassId = isDemoMode ? STANDARDS_TOUR_DEMO_CLASS_ID : selectedClassId;

  /* Ustun nisbatlari (lessons/students usuli) — flex-grow + flex-basis:0:
     sinf tanlanmagan → 50/50, sinf tanlangan → sinflar tor, standartlar keng. */
  const noClass = !effectiveClassId;
  const grow = noClass ? { classes: 1, content: 1 } : { classes: 1, content: 3 };
  const columnsTemplate = `minmax(0,${grow.classes}fr) minmax(0,${grow.content}fr)`;

  return (
    <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden p-4 md:p-6">
      <DashboardColumn hideBelow="lg" data-tour="standards-classes">
        <ClassListPanel
          page="standards"
          selectedClassId={effectiveClassId ?? ""}
          onSelect={handleSelectClass}
          demoClasses={demoClasses ?? undefined}
        />
      </DashboardColumn>

      <div className="flex min-w-0 min-h-0 h-full flex-col">
        {noClass ? (
          <div className="h-full overflow-hidden rounded-xl bg-card card-elevation">
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia><Illustration name="2" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>Sinf tanlanmagan</EmptyTitle>
                <EmptyDescription>Standartlarni koʻrish uchun sinf tanlang</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <StandardsView classId={effectiveClassId} demoMode={isDemoMode} demoSets={demoSets ?? undefined} />
        )}
      </div>
    </DashboardColumns>
  );
}
