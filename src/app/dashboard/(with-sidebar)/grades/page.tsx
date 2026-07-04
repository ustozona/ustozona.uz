"use client";

import { useState } from "react";
import { useClassStore } from "@/store/useClassStore";
import ClassListPanel from "@/components/ClassListPanel";
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

  return (
    <div className="flex flex-1 min-w-0 h-full min-h-0 gap-6 overflow-hidden p-4 md:p-6">
      <div data-tour="grades-classes" className="hidden lg:block min-w-0 min-h-0 h-full" style={{ flexGrow: grow.classes, flexBasis: 0 }}>
        <ClassListPanel page="grades" selectedClassId={selectedClassId ?? ""} onSelect={handleSelectClass} />
      </div>

      <div className="flex min-w-0 min-h-0 h-full flex-col" style={{ flexGrow: grow.content, flexBasis: 0 }}>
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
    </div>
  );
}
