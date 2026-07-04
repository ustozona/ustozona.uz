"use client";

import { useState } from "react";
import { useClassStore } from "@/store/useClassStore";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import GradesView from "./_components/GradesView";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { BookOpen } from "lucide-react";

export default function GradesPage() {
  // Sinf tanlash — lokal holat. null = hech narsa tanlanmagan (Sinflar ustuni 50%).
  // Tanlangach store ham yangilanadi (boshqa sahifalar bilan sinxron).
  const setStoreClassId = useClassStore((s) => s.setSelectedClassId);
  const [selectedClassId, setSelectedClassIdState] = useState<string | null>(null);
  const handleSelectClass = (id: string) => { setSelectedClassIdState(id); setStoreClassId(id); };

  /* Ustun nisbatlari (lessons/students usuli) — flex-grow + flex-basis:0:
     sinf tanlanmagan → 50/50, sinf tanlangan → sinflar tor, jurnal keng. */
  const noClass = !selectedClassId;
  const grow = noClass ? { classes: 1, content: 1 } : { classes: 1, content: 3 };
  const columnsTemplate = `minmax(0,${grow.classes}fr) minmax(0,${grow.content}fr)`;

  return (
    <DashboardColumns template={columnsTemplate} className="h-full overflow-hidden p-4 md:p-6">
      <DashboardColumn hideBelow="lg" data-tour="grades-classes">
        <ClassListPanel page="grades" selectedClassId={selectedClassId ?? ""} onSelect={handleSelectClass} />
      </DashboardColumn>

      <div className="flex min-w-0 min-h-0 h-full flex-col">
        {noClass ? (
          <div className="h-full overflow-hidden rounded-xl bg-card card-elevation">
            <Empty className="h-full border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
                <EmptyTitle>Sinf tanlanmagan</EmptyTitle>
                <EmptyDescription>Jurnalni ochish uchun sinf tanlang</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <GradesView classId={selectedClassId} />
        )}
      </div>
    </DashboardColumns>
  );
}
