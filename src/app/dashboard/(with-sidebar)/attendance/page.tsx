"use client";

import { useClassStore } from "@/store/useClassStore";
import ClassListPanel from "@/components/ClassListPanel";
import AttendanceView from "./_components/AttendanceView";

export default function AttendancePage() {
  const selectedClassId = useClassStore((s) => s.selectedClassId);
  const setSelectedClassId = useClassStore((s) => s.setSelectedClassId);

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden p-4 md:p-6">
      <div data-tour="attendance-classes" className="hidden lg:block w-[280px] shrink-0 h-full">
        <ClassListPanel page="attendance" selectedClassId={selectedClassId} onSelect={setSelectedClassId} />
      </div>
      <AttendanceView classId={selectedClassId} />
    </div>
  );
}
