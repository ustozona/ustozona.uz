"use client";

import * as React from "react";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
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
  };
}

export default function BehaviorServerSync() {
  const hydrated = useHydrateStore(useBehaviorStore, fetchBehaviorAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useBehaviorStore,
      select: selectSnapshot,
      diff: diffBehavior,
      push: syncBehaviorAction,
      errorMessage: "Xulq ballari serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
