"use client";

import * as React from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import {
  isCalendarConfigured,
  makeCalendarForYear,
  currentAcademicStartYear,
} from "@/lib/academic-calendar";
import {
  fetchCalendarAction,
  saveCalendarAction,
} from "@/server/actions/calendar";

/* Calendar store ↔ server koʻprigi (renderi yoʻq).
   Bitta hujjat — diff'siz snapshot rejimi (default shallowEqual):
   `calendar` referensi oʻzgarsa butun kalendar saqlanadi.

   EAGER-SEED: hydration tugagach kalendar hali sozlanmagan boʻlsa (yangi
   hisob — serverda satr yoʻq), joriy sanadan rasmiy oʻzbek oʻquv yili
   bilan avto-toʻldiriladi. Shu bilan "kalendar hech qachon boʻsh emas"
   invarianti onboardingdan MUSTAQIL kafolatlanadi (planner/davomat/choraklik
   baho tayanadi); onboarding sehrgari faqat TASDIQLAYDI/tuzatadi. Seed
   snapshot-sync orqali avtomatik serverga yoziladi. */

type CalendarState = ReturnType<typeof useCalendarStore.getState>;

function selectSnapshot(s: CalendarState) {
  return { calendar: s.calendar };
}

export default function CalendarServerSync() {
  const hydrated = useHydrateStore(useCalendarStore, fetchCalendarAction);

  // Eager-seed: hydration'dan keyin bir marta — kalendar boʻsh boʻlsa toʻldir.
  React.useEffect(() => {
    if (!hydrated) return;
    const { calendar, setCalendar } = useCalendarStore.getState();
    if (!isCalendarConfigured(calendar)) {
      setCalendar(makeCalendarForYear(currentAcademicStartYear()));
    }
  }, [hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useCalendarStore,
      select: selectSnapshot,
      push: saveCalendarAction,
      errorMessage: "Oʻquv yili kalendari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
