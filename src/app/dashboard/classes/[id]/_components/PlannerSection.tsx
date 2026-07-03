"use client";

import PlannerView from "@/app/dashboard/planner/_components/PlannerView";
import { useMounted } from "@/lib/use-mounted";
import type { ClassIdentity } from "@/lib/class-id";

/* ── Reja boʻlimi — standalone /planner bilan bir xil PlannerView'ni sinf-detali
   ichida, FAQAT shu sinfga filtrlangan holda koʻrsatadi (classId propi). PlannerView
   localStorage (timetable events) + persist useLessonStore'dan oʻqigani uchun
   SSR/rehydrate mismatch'ini oldini olish — mount-gate (useMounted). ── */
export function PlannerSection({ identity }: { identity: ClassIdentity }) {
  const mounted = useMounted();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {mounted && <PlannerView classId={identity.id} />}
    </div>
  );
}
