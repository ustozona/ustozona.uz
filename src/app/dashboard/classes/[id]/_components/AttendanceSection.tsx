"use client";

import AttendanceView from "@/app/dashboard/(with-sidebar)/attendance/_components/AttendanceView";
import type { ClassIdentity } from "@/lib/class-id";

/* ── Davomat boʻlimi — standalone /attendance bilan bir xil AttendanceView'ni
   sinf-detali ichida koʻrsatadi. AttendanceView persist useAttendanceStore'dan
   oʻqiydi va oʻzida mount-gate qiladi (SSR/rehydrate mismatch'ini oldini oladi). ── */
export function AttendanceSection({ identity }: { identity: ClassIdentity }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <AttendanceView classId={identity.id} />
    </div>
  );
}
