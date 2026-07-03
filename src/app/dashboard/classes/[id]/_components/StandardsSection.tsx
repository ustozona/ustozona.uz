"use client";

import StandardsView from "@/app/dashboard/(with-sidebar)/standards/_components/StandardsView";
import { useMounted } from "@/lib/use-mounted";
import type { ClassIdentity } from "@/lib/class-id";

/* ── Standartlar boʻlimi — standalone /standards bilan bir xil StandardsView'ni
   sinf-detali ichida koʻrsatadi. StandardsView persist qilingan useStandardsStore
   va useLessonStore'dan oʻqigani uchun SSR/rehydrate mismatch'ini oldini olish —
   mount-gate (useMounted). ── */
export function StandardsSection({ identity }: { identity: ClassIdentity }) {
  const mounted = useMounted();

  return (
    <div className="flex h-full min-h-0 flex-col">
      {mounted && <StandardsView classId={identity.id} />}
    </div>
  );
}
