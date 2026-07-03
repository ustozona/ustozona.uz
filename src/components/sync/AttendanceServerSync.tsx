"use client";

import * as React from "react";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffAttendance, type AttendanceSnapshot } from "@/lib/sync/attendance-sync";
import {
  fetchAttendanceAction,
  syncAttendanceAction,
} from "@/server/actions/attendance";

/* Attendance store ↔ server koʻprigi (renderi yoʻq).
   Dashboard layoutda turadi: mount → hydration → sync.
   Diff ichki referenslarni solishtiradi (snapshot wrapper har safar yangi). */

type AttendanceState = ReturnType<typeof useAttendanceStore.getState>;

function selectSnapshot(s: AttendanceState): AttendanceSnapshot {
  return { recordsByClass: s.recordsByClass, statuses: s.statuses };
}

export default function AttendanceServerSync() {
  const hydrated = useHydrateStore(useAttendanceStore, fetchAttendanceAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useAttendanceStore,
      select: selectSnapshot,
      diff: diffAttendance,
      push: syncAttendanceAction,
      errorMessage: "Davomat serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
