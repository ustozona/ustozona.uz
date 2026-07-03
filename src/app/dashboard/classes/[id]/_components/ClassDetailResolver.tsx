"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { useGradesStore } from "@/store/useGradesStore";
import { classColor } from "@/lib/grades-data";
import { type ClassIdentity } from "@/lib/class-id";
import { Skeleton } from "@/components/ui/skeleton";
import ClassDetail from "./ClassDetail";
import type { ClassSection } from "./sections";

/* ════════════════════════════════════════════════════════════════════
   SINF IDENTITETINI JONLI HAL QILISH

   Yagona manba — useGradesStore.classDataMap (server-backed): seed
   id'li ("5-a") ham, foydalanuvchi yaratgan uuid-id'li sinflar ham.
   Hydration tugamaguncha 404 qilmaymiz — skeleton koʻrsatiladi;
   tugagach xaritada boʻlmagan id → notFound.
   ════════════════════════════════════════════════════════════════════ */

export function ClassDetailResolver({
  id,
  initialSection,
}: {
  id: string;
  initialSection: ClassSection;
}) {
  const info = useGradesStore((s) => s.classDataMap[id]?.info);
  const hydrated = useGradesStore((s) => s._hasHydrated);

  const identity = useMemo<ClassIdentity | null>(
    () => (info ? { id, name: info.name, color: classColor(info) } : null),
    [id, info]
  );

  if (!identity) {
    if (!hydrated) {
      return (
        <div className="flex flex-1 min-h-0 gap-6 p-6">
          <Skeleton className="w-64 shrink-0 rounded-2xl" />
          <Skeleton className="flex-1 rounded-2xl" />
        </div>
      );
    }
    notFound();
  }

  return <ClassDetail identity={identity} initialSection={initialSection} />;
}
