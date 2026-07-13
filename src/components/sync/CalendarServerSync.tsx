"use client";

import * as React from "react";
import { useCalendarStore } from "@/store/useCalendarStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import {
  makeCalendarForYear,
  currentAcademicStartYear,
} from "@/lib/academic-calendar";
import {
  fetchYearsAction,
  saveYearsAction,
} from "@/server/actions/academic-years";

/* Calendar store ↔ server koʻprigi (renderi yoʻq) — koʻp-yil (1-bosqich).

   Snapshot endi `{ years }` (barcha oʻquv yillari): `years` referensi
   oʻzgarsa butun roʻyxat saqlanadi (DAL upsert + delete-missing). Faol
   yil kalendari (`s.calendar`) har mutatsiyada `years`ga write-through
   boʻlgani uchun `years`ni yuborish yetarli.

   EAGER-SEED: hydration tugagach roʻyxat boʻsh boʻlsa (yangi hisob —
   serverda satr yoʻq), joriy sanadan rasmiy oʻzbek oʻquv yili bilan bitta
   FAOL yil yaratiladi. Shu bilan "kalendar hech qachon boʻsh emas"
   invarianti onboardingdan MUSTAQIL kafolatlanadi. Sync effekti seed'dan
   OLDIN oʻrnatiladi (lastSynced = boʻsh) — shunda seed subscribe orqali
   avtomatik serverga yoziladi. */

type CalendarState = ReturnType<typeof useCalendarStore.getState>;

function selectSnapshot(s: CalendarState) {
  return { years: s.years };
}

export default function CalendarServerSync() {
  const hydrated = useHydrateStore(useCalendarStore, fetchYearsAction);

  // Sync effekti seed'dan OLDIN — createServerSync lastSynced'ni seed'gacha
  // (boʻsh roʻyxat) oladi, keyingi seed subscribe orqali push boʻladi.
  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useCalendarStore,
      select: selectSnapshot,
      push: saveYearsAction,
      errorMessage: "Oʻquv yili kalendari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  // Eager-seed: hydration'dan keyin bir marta — roʻyxat boʻsh boʻlsa toʻldir.
  React.useEffect(() => {
    if (!hydrated) return;
    const { years, addYear } = useCalendarStore.getState();
    if (years.length === 0) {
      addYear(makeCalendarForYear(currentAcademicStartYear()));
    }
  }, [hydrated]);

  return null;
}
