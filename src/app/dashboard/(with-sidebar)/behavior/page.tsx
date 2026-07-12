"use client";

import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import BehaviorView from "@/components/behavior/BehaviorView";

export default function BehaviorPage() {
  // Xulq ham davomat kabi doim bitta sinf ochiq turadi — URL boʻsh boʻlsa
  // store default'iga qaytadi (fallbackToStore), tanlov ?classId= ga yoziladi.
  const [selectedClassId, setSelectedClassId] = useClassIdParam({ fallbackToStore: true });

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden p-4 md:p-6">
      <div className="hidden lg:block w-[280px] shrink-0 h-full" data-tour="behavior-classes">
        <ClassListPanel
          page="behavior"
          selectedClassId={selectedClassId ?? ""}
          onSelect={setSelectedClassId}
        />
      </div>
      <div className="flex-1 min-w-0 h-full min-h-0">
        <BehaviorView classId={selectedClassId ?? ""} />
      </div>
    </div>
  );
}
