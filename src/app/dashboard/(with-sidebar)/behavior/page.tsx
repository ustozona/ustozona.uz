"use client";

import { useMemo } from "react";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
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
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0 gap-6 p-4 md:p-6">
      <TourDemoBanner tourId="behavior" active={isDemoMode} />
      <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden">
        <div className="hidden lg:block w-[280px] shrink-0 h-full" data-tour="behavior-classes">
          <ClassListPanel
            page="behavior"
            selectedClassId={effectiveClassId}
            onSelect={setSelectedClassId}
            demoClasses={demoClasses ?? undefined}
          />
        </div>
        <div className="flex-1 min-w-0 h-full min-h-0">
          <BehaviorView
            classId={effectiveClassId}
            demoMode={isDemoMode}
            demoStudents={demoStudents ?? undefined}
            demoClassInfo={demoClasses?.[0]}
          />
        </div>
      </div>
    </div>
  );
}
