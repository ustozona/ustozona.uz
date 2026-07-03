"use client";

import * as React from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useHydrateStore } from "@/hooks/useHydrateStore";
import { createServerSync } from "@/lib/sync/create-server-sync";
import { diffTasks, type TasksSnapshot } from "@/lib/sync/tasks-sync";
import { fetchTasksAction, syncTasksAction } from "@/server/actions/tasks";

/* Tasks store ↔ server koʻprigi (renderi yoʻq). */

type TaskState = ReturnType<typeof useTaskStore.getState>;

function selectSnapshot(s: TaskState): TasksSnapshot {
  return { tasks: s.tasks };
}

export default function TasksServerSync() {
  const hydrated = useHydrateStore(useTaskStore, fetchTasksAction);

  React.useEffect(() => {
    if (!hydrated) return;
    const sync = createServerSync({
      store: useTaskStore,
      select: selectSnapshot,
      diff: diffTasks,
      push: syncTasksAction,
      errorMessage: "Vazifalar serverga saqlanmadi",
    });
    return sync.stop;
  }, [hydrated]);

  return null;
}
