"use client";

import { useMemo } from "react";
import { notFound } from "next/navigation";
import { useGradesStore } from "@/store/useGradesStore";
import { classColor } from "@/lib/grades-data";
import { resolveClassIdentity, type ClassIdentity } from "@/lib/class-id";
import { Skeleton } from "@/components/ui/skeleton";
import ClassDetail from "./ClassDetail";
import type { ClassSection } from "./sections";

/* ════════════════════════════════════════════════════════════════════
   SINF IDENTITETINI JONLI HAL QILISH

   Tartib:
     1. useGradesStore.classDataMap[id] — jonli (server-backed) sinflar,
        shu jumladan foydalanuvchi yaratgan uuid-id'li sinflar.
     2. resolveClassIdentity — statik fallback (timetable'ning numerik
        sinflari nom-slug orqali; v1 cheklov, class-bridge bilan birga
        keyin olib tashlanadi).
   Hydration tugamaguncha 404 qilmaymiz — skeleton koʻrsatiladi.
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

  const identity = useMemo<ClassIdentity | null>(() => {
    if (info) return { id, name: info.name, color: classColor(info) };
    return resolveClassIdentity(id);
  }, [id, info]);

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
