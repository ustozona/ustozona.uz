"use client";

import * as React from "react";
import { useTasksStore } from "@/store/useTasksStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { bootstrapSlice } from "@/lib/sync/bootstrap-client";
import { diffTasks, type TasksSnapshot } from "@/lib/sync/tasks-sync";
import { syncTasksAction } from "@/server/actions/tasks";

/* Tasks store ↔ server koʻprigi (renderi yoʻq). */

type TasksState = ReturnType<typeof useTasksStore.getState>;

function selectSnapshot(s: TasksState): TasksSnapshot {
  return { items: s.items };
}

/** Mount hydration umumiy bootstrap javobidan oʻqiladi (bitta soʻrov). */
const fetchSlice = bootstrapSlice("tasks");

export default function TasksServerSync() {
  const hydrated = useHydrateStore(useTasksStore, fetchSlice);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useTasksStore,
      select: selectSnapshot,
      diff: diffTasks,
      push: syncTasksAction,
      errorMessage: "Vazifa serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
