"use client";

import { useMemo } from "react";
import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import AttendanceView from "./_components/AttendanceView";
import { useGradesStore } from "@/store/useGradesStore";
import { useTourRequest } from "@/components/tour/tour-request";
import {
  makeAttendanceTourDemoClasses, makeAttendanceTourDemoRoster, ATTENDANCE_TOUR_DEMO_CLASS_ID,
} from "@/components/tour/attendance-tour-demo";
import { TourDemoBanner } from "@/components/tour/TourDemoBanner";

export default function AttendancePage() {
  // Attendance doim bitta sinf ochiq turadi — URL boʻsh boʻlsa store default'iga
  // qaytadi (fallbackToStore). Tanlanganda `?classId=` URL'ga yoziladi.
  const [selectedClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });

  // Boʻsh hisobda "davomat" turi ishga tushsa — namunaviy sinf + jadval
  // koʻrsatiladi (grades/students/lessons turi bilan bir xil naqsh).
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const tourActive = useTourRequest((s) => s.activeTourId === "attendance");
  const isDemoMode = tourActive && Object.keys(classDataMap).length === 0;
  const demoClasses = useMemo(() => (isDemoMode ? makeAttendanceTourDemoClasses() : null), [isDemoMode]);
  const demoRoster = useMemo(() => (isDemoMode ? makeAttendanceTourDemoRoster() : null), [isDemoMode]);
  const effectiveClassId = isDemoMode ? ATTENDANCE_TOUR_DEMO_CLASS_ID : (selectedClassId ?? "");

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0 gap-6 p-4 md:p-6">
      <TourDemoBanner tourId="attendance" active={isDemoMode} />
      <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden">
        <div data-tour="attendance-classes" className="hidden lg:block w-[280px] shrink-0 h-full">
          <ClassListPanel
            page="attendance"
            selectedClassId={effectiveClassId}
            onSelect={setSelectedClassId}
            demoClasses={demoClasses ?? undefined}
          />
        </div>
        <AttendanceView
          classId={effectiveClassId}
          demoMode={isDemoMode}
          demoRoster={demoRoster ?? undefined}
          demoClassInfo={demoClasses?.[0]}
        />
      </div>
    </div>
  );
}
