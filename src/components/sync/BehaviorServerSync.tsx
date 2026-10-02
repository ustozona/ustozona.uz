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

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const bootstrapBehavior = bootstrapSlice("behavior");

/* Boʻlak yiqilsa (pool osilishi → 15 s timeout) alohida amal bilan BIR
   marta qayta oʻqiladi — u yangi soʻrov, qoʻshni boʻlaklarsiz. Faqat
   oʻqish: ikkinchisi ham yiqilsa xato useHydrateStore'ga oʻtadi va sync
   boshlanmaydi. Aks holda butun sessiya boʻsh ballar bilan qolardi
   (2026-10-02 prod hodisasi). */
const fetchSlice = () =>
  bootstrapBehavior().catch((err) => {
    console.warn("[behavior] bootstrap boʻlagi yiqildi, qayta oʻqilmoqda:", err);
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
