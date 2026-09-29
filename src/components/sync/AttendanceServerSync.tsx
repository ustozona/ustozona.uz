"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import { diffAttendance, type AttendanceSnapshot } from "@/lib/sync/attendance-sync";
import type { AttendanceBatch, RecordKey } from "@/lib/sync/attendance-batch";
import { syncAttendanceAction } from "@/server/actions/attendance";

/* Attendance store ↔ server koʻprigi (renderi yoʻq).
   Dashboard layoutda turadi: mount → hydration → sync.
   Diff ichki referenslarni solishtiradi (snapshot wrapper har safar yangi). */

type AttendanceState = ReturnType<typeof useAttendanceStore.getState>;

function selectSnapshot(s: AttendanceState): AttendanceSnapshot {
  return { recordsByClass: s.recordsByClass, statuses: s.statuses };
}

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("attendance");

/* Server "bola u kuni sinfda emas edi" deb rad etgan YANGI belgilar bazaga
   tushmagan. Store'da qolsa keyingi yuklashda jimgina yoʻqolib qolardi —
   shu bois hozir olib tashlanadi va oʻqituvchiga aytiladi. Store oʻzgarishi
   keyingi flush'da `recordsDelete` keltiradi: bazada bunday qator yoʻq,
   oʻchirish zararsiz (idempotent). */
function dropRejected(rejected: RecordKey[]) {
  const doomed = new Map<string, Set<string>>();
  for (const k of rejected) {
    let keys = doomed.get(k.classId);
    if (!keys) doomed.set(k.classId, (keys = new Set()));
    keys.add(`${k.studentId}|${k.date}`);
  }
  const { setRecords } = useAttendanceStore.getState();
  for (const [classId, keys] of doomed) {
    setRecords(classId, (prev) => prev.filter((r) => !keys.has(`${r.studentId}|${r.date}`)));
  }
  toast.warning(`${rejected.length} ta belgi saqlanmadi — oʻquvchi u kunlarda sinfda emas edi`);
}

async function pushAttendance(batch: AttendanceBatch) {
  const res = await syncAttendanceAction(batch);
  if (res.rejected.length > 0) dropRejected(res.rejected);
  return res;
}

export default function AttendanceServerSync() {
  const hydrated = useHydrateStore(useAttendanceStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useAttendanceStore,
      select: selectSnapshot,
      diff: diffAttendance,
      push: pushAttendance,
      errorMessage: "Davomat serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
