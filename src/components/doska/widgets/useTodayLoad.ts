"use client";

import * as React from "react";

import type { TodayLesson } from "@/lib/doska/today";
import { todayKey } from "@/lib/date-keys";
import { doskaTodayAction } from "@/server/actions/doska-today";

/* ════════════════════════════════════════════════════════════════════
   BUGUNGI KUN — darslar va bayram, «Bugun» va «Sana» vidjetlari uchun
   umumiy (docs/doska-referens-koriklari.md R409, R445).

   Soʻrov modul darajasida keshlanadi: ekranda «Bugun» ham, «Sana» ham
   tursa, server bir marta soʻraladi. Kun almashsa (doska tun boʻyi
   yoqiq qolsa) yangi kun uchun qayta soʻraladi.
   ════════════════════════════════════════════════════════════════════ */

export type TodayLoad = { lessons: TodayLesson[]; holiday: string | null };

let todayPromise: { day: string; promise: Promise<TodayLoad | null> } | null = null;

function loadToday(day: string): Promise<TodayLoad | null> {
  if (todayPromise?.day !== day) {
    const promise = doskaTodayAction({ today: day })
      .then((res) =>
        res.ok && res.data.status === "ok" ? { lessons: res.data.lessons, holiday: res.data.holiday ?? null } : null,
      )
      .catch(() => {
        todayPromise = null;
        return null;
      });
    todayPromise = { day, promise };
  }
  return todayPromise.promise;
}

/** Daqiqa aniqligidagi joriy vaqt (kun boshidan) va sana — mountdan keyin. */
export function useNowMin(): { day: string; min: number } | null {
  const [now, setNow] = React.useState<{ day: string; min: number } | null>(null);
  React.useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow({ day: todayKey(), min: d.getHours() * 60 + d.getMinutes() });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Joriy vaqt va bugungi darslar (`undefined` — yuklanmoqda, `null` — jadval yoʻq). */
export function useTodayLoad() {
  const now = useNowMin();
  const [load, setLoad] = React.useState<TodayLoad | null | undefined>(undefined);
  const day = now?.day ?? null;

  React.useEffect(() => {
    if (!day) return;
    let alive = true;
    void loadToday(day).then((l) => alive && setLoad(l));
    return () => {
      alive = false;
    };
  }, [day]);
  return { now, load };
}
