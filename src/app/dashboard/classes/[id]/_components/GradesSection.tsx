"use client";

import GradesView from "@/app/dashboard/(with-sidebar)/grades/_components/GradesView";
import type { ClassIdentity } from "@/lib/class-id";

/* ── Baholar boʻlimi — standalone /grades sahifasi bilan bir xil GradesView'ni
   sinf-detali ichida (chap nav ClassListPanel oʻrnini bosadi) koʻrsatadi.
   GradesView persist useGradesStore'dan oʻqiydi va oʻzida mount-gate qiladi
   (SSR/rehydrate mismatch'ini oldini oladi). ── */
export function GradesSection({ identity }: { identity: ClassIdentity }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <GradesView classId={identity.id} />
    </div>
  );
}
