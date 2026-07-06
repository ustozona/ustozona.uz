"use client";

import { useClassIdParam } from "@/hooks/useClassIdParam";
import ClassListPanel from "@/components/ClassListPanel";
import { DashboardColumns, DashboardColumn } from "@/components/DashboardPage";
import GradesView from "./_components/GradesView";
import {
  Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";

export default function GradesPage() {
  // Sinf tanlash — `?classId=` URL param (refresh/deep-link chidamli).
  // null = hech narsa tanlanmagan (Sinflar ustuni 50%). Tanlanganda URL +
  // store default yangilanadi (boshqa sahifalar bilan sinxron).
  const [selectedClassId, handleSelectClass] = useClassIdParam();

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
                <EmptyMedia><Illustration name="29" className="h-32 text-black dark:text-white" /></EmptyMedia>
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
