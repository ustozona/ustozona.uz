"use client";

import { useMemo } from "react";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import BehaviorView from "@/components/behavior/BehaviorView";
import { useGradesStore } from "@/store/useGradesStore";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeBehaviorTourDemoClasses, makeBehaviorTourDemoStudents, BEHAVIOR_TOUR_DEMO_CLASS_ID,
} from "@/components/tour/behavior-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";

export default function BehaviorPage() {
  // Xulq ham davomat kabi doim bitta sinf ochiq turadi — URL boʻsh boʻlsa
  // store default'iga qaytadi (fallbackToStore), tanlov ?classId= ga yoziladi.
  const [selectedClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });

  // Boʻsh hisobda "xulq" turi ishga tushsa — namunaviy sinf + oʻquvchilar
  // koʻrsatiladi (attendance/students turi bilan bir xil naqsh).
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const tourActive = useTourRequest((s) => s.activeTourId === "behavior");
  const isDemoMode = tourActive && Object.keys(classDataMap).length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeBehaviorTourDemoClasses() : null), [isDemoMode]);
  const demoStudents = useMemo(() => (isDemoMode ? makeBehaviorTourDemoStudents() : null), [isDemoMode]);
  const effectiveClassId = isDemoMode ? BEHAVIOR_TOUR_DEMO_CLASS_ID : (selectedClassId ?? "");

  return (
    <div className="flex flex-col flex-1 min-w-0 gap-6 p-4 md:p-6 max-lg:min-h-full lg:h-full lg:min-h-0">
      <TourDemoBanner tourId="behavior" active={isDemoMode} />
      {/* attendance bilan bir xil struktura — qoʻldagi `hidden lg:block` oʻrniga
          kanonik `DashboardColumns` (mobilда sinf-tanlash Sheet'ga oʻtadi). */}
      <DashboardColumns
        template="minmax(0,280px) minmax(0,1fr)"
        className="lg:h-full lg:overflow-hidden"
      >
        <DashboardColumn hideBelow="lg" mobile="self" data-tour="behavior-classes">
          <ClassListPanel
            page="behavior"
            selectedClassId={effectiveClassId}
            onSelect={setSelectedClassId}
            demoClasses={demoClasses ?? undefined}
          />
        </DashboardColumn>
        <DashboardColumn className="max-lg:min-h-[70svh]">
          <BehaviorView
            classId={effectiveClassId}
            demoMode={isDemoMode}
            demoStudents={demoStudents ?? undefined}
            demoClassInfo={demoClasses?.[0]}
          />
        </DashboardColumn>
      </DashboardColumns>
    </div>
  );
}
