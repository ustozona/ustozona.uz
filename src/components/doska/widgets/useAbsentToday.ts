"use client";

import * as React from "react";

import { todayKey } from "@/lib/date-keys";
import { doskaAbsentAction } from "@/server/actions/doska-absent";

/* ════════════════════════════════════════════════════════════════════
   BUGUN DARSDA YOʻQLAR — ulangan sinf uchun, davomatdan (R411).
   «Guruhlar» va «Gʻildirak» ikkalasi ishlatadi.

   Sinf + kun uchun sahifa davomida bir marta soʻraladi. Tarmoq xatosida
   keshdan oʻchadi — keyingi safar qayta soʻraladi. Xato yoki ruxsat
   yoʻq — boʻsh roʻyxat (hamma bor deb olinadi), vidjet ishlayveradi.
   ════════════════════════════════════════════════════════════════════ */

const absentCache = new Map<string, Promise<string[]>>();

function loadAbsent(classId: string, day: string): Promise<string[]> {
  const key = `${classId}:${day}`;
  let p = absentCache.get(key);
  if (!p) {
    p = doskaAbsentAction({ classId, today: day })
      .then((res) => (res.ok ? res.data : []))
      .catch(() => {
        absentCache.delete(key);
        return [];
      });
    absentCache.set(key, p);
  }
  return p;
}

/** `null` — hali yuklanmagan yoki sinf ulanmagan. */
export function useAbsentToday(classId: string | null): string[] | null {
  const [state, setState] = React.useState<{ key: string; ids: string[] } | null>(null);
  React.useEffect(() => {
    if (!classId) return;
    const day = todayKey();
    let alive = true;
    void loadAbsent(classId, day).then((ids) => alive && setState({ key: classId, ids }));
    return () => {
      alive = false;
    };
  }, [classId]);
  return classId && state?.key === classId ? state.ids : null;
}
