"use client";

import { useClassStore } from "@/store/useClassStore";
import ClassListPanel from "@/components/ClassListPanel";
import GradesView from "./_components/GradesView";

export default function GradesPage() {
  const selectedClassId = useClassStore((s) => s.selectedClassId);
  const setSelectedClassId = useClassStore((s) => s.setSelectedClassId);

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden p-4 md:p-6">
      <div className="hidden lg:block w-[280px] shrink-0 h-full">
        <ClassListPanel page="grades" selectedClassId={selectedClassId} onSelect={setSelectedClassId} />
      </div>
      <GradesView classId={selectedClassId} />
    </div>
  );
}
