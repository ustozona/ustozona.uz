"use client";

import * as React from "react";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import { diffBehavior, type BehaviorSnapshot } from "@/lib/sync/behavior-sync";
import { fetchBehaviorAction, syncBehaviorAction } from "@/server/actions/behavior";

/* Behavior store ↔ server koʻprigi (renderi yoʻq).
   Dashboard layoutda turadi: mount → hydration → sync.
   Sync FAQAT hydration'dan keyin — initial state defaultli,
   erta sync server maʼlumotini yoʻqotadi. */

type BehaviorState = ReturnType<typeof useBehaviorStore.getState>;

function selectSnapshot(s: BehaviorState): BehaviorSnapshot {
  return {
    skills: s.skills,
    rewards: s.rewards,
    eventsByClass: s.eventsByClass,
    redemptions: s.redemptions,
    deletions: s.deletions,
    autoSettings: s.autoSettings,
  };
}

/** Mount hydration: fon boʻlaklaridan keyin oʻz alohida soʻrovida keladi
    (`bootstrap-client.ts` → `behaviorOnce`). */
const firstFetch = bootstrapSlice("behavior");

/* Yiqilsa (tarmoq, pool osilishi) BIR marta qayta oʻqiladi. Faqat
   oʻqish: ikkinchisi ham yiqilsa xato useHydrateStore'ga oʻtadi va sync
   boshlanmaydi. Aks holda butun sessiya boʻsh ballar bilan qolardi
   (2026-10-02 prod hodisasi). */
const fetchSlice = () =>
  firstFetch().catch((err) => {
    console.warn("[behavior] yuklanmadi, qayta oʻqilmoqda:", err);
    return fetchBehaviorAction();
  });

export default function BehaviorServerSync() {
  const hydrated = useHydrateStore(useBehaviorStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useBehaviorStore,
      select: selectSnapshot,
      diff: diffBehavior,
      push: syncBehaviorAction,
      errorMessage: "Xulq-atvor ballari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
