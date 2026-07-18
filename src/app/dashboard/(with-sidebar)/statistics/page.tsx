"use client";

import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import { OverviewPanel } from "./_components/OverviewPanel";
import { ClassStatsView } from "./_components/ClassStatsView";

export default function StatisticsPage() {
  // Umumiy koʻrinish (classId yoʻq) yoki sinf koʻrinishi (?classId=) — grades
  // sahifasi bilan bir xil naqsh, lekin "all" pseudo-qiymat ishlatilmaydi.
  const [selectedClassId, handleSelectClass] = useClassIdParam();

  const noClass = !selectedClassId;
  const grow = noClass ? { classes: 1, content: 1 } : { classes: 1, content: 3 };
  const columnsTemplate = `minmax(0,${grow.classes}fr) minmax(0,${grow.content}fr)`;

  return (
    <div className="flex flex-col flex-1 min-w-0 h-full min-h-0">
      <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden p-4 md:p-6">
        <DashboardColumn hideBelow="lg">
          <ClassListPanel
            page="statistics"
            selectedClassId={selectedClassId ?? ""}
            onSelect={handleSelectClass}
          />
        </DashboardColumn>

        <div className="flex min-w-0 min-h-0 h-full flex-col">
          {noClass ? (
            <OverviewPanel onSelectClass={handleSelectClass} />
          ) : (
            <ClassStatsView classId={selectedClassId} onBack={() => handleSelectClass(null)} />
          )}
        </div>
      </DashboardColumns>
    </div>
  );
}
