"use client";

import * as React from "react";
import { useFeedbackStore } from "@/store/useFeedbackStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffFeedback, type FeedbackSnapshot } from "@/lib/sync/feedback-sync";
import { fetchFeedbackAction, syncFeedbackAction } from "@/server/actions/feedback";

/* Feedback store ↔ server koʻprigi (renderi yoʻq). */

type FeedbackState = ReturnType<typeof useFeedbackStore.getState>;

function selectSnapshot(s: FeedbackState): FeedbackSnapshot {
  return { items: s.items };
}

export default function FeedbackServerSync() {
  const hydrated = useHydrateStore(useFeedbackStore, fetchFeedbackAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useFeedbackStore,
      select: selectSnapshot,
      diff: diffFeedback,
      push: syncFeedbackAction,
      errorMessage: "Fikr-mulohaza serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
