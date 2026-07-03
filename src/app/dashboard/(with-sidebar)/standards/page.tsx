"use client";

import { useClassStore } from "@/store/useClassStore";
import ClassListPanel from "@/components/ClassListPanel";
import StandardsView from "./_components/StandardsView";

export default function StandardsPage() {
  const selectedClassId = useClassStore((s) => s.selectedClassId);
  const setSelectedClassId = useClassStore((s) => s.setSelectedClassId);

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden p-4 md:p-6">
      <div className="hidden lg:block w-[280px] shrink-0 h-full">
        <ClassListPanel page="standards" selectedClassId={selectedClassId} onSelect={setSelectedClassId} />
      </div>
      <StandardsView classId={selectedClassId} />
    </div>
  );
}
