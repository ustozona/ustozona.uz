"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useFocusStore } from "@/store/useFocusStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════════
   SUZUVCHI POMODORO TAYMERI — dashboard layoutda doim mavjud, `idle`
   holatda yashirin. 1s tik-tak; bosqich tugaganda avto oʻtish
   (ish→tanaffus→boʻsh), toast + bildirishnoma, fokus yozuvi tasks
   store'ga yoziladi. localStorage'dan oʻqigani uchun mount-gate shart.
   ════════════════════════════════════════════════════════════════════ */

export default function FocusTimerPill() {
  const t = useTranslations("FocusTimer");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const phase = useFocusStore((s) => s.phase);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const endsAt = useFocusStore((s) => s.endsAt);
  const tasksSettings = useSettingsStore((s) => s.tasksSettings);
  const activeTask = useTasksStore((s) =>
    activeTaskId ? s.items.find((x) => x.id === activeTaskId) : undefined
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase === "idle") return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle" || endsAt == null || now < endsAt) return;
    if (phase === "work") {
      const taskId = useFocusStore.getState().activeTaskId;
      const title = taskId ? useTasksStore.getState().items.find((x) => x.id === taskId)?.title : undefined;
      if (taskId) useTasksStore.getState().addFocusEntry(taskId, tasksSettings.pomoMinutes);
      toast.success(t("workDoneToast"));
      useNotificationsStore.getState().notify({
        kind: "system",
        title: t("workDoneToast"),
        body: title,
        href: "/dashboard/tasks",
      });
      useFocusStore
        .getState()
        .completeWorkAndStartBreak(
          tasksSettings.longBreakEvery,
          tasksSettings.shortBreakMinutes,
          tasksSettings.longBreakMinutes
        );
    } else {
      toast.info(t("breakDoneToast"));
      useFocusStore.getState().completeBreak();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, phase, endsAt, tasksSettings]);

  if (!mounted || phase === "idle") return null;

  const remainingMs = Math.max(0, (endsAt ?? now) - now);
  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2.5 shadow-lg">
      <span
        className={cn(
          "size-2 shrink-0 animate-pulse rounded-full",
          phase === "work" ? "bg-destructive" : "bg-success"
        )}
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="max-w-40 truncate text-xs font-medium text-muted-foreground">
          {phase === "work" ? (activeTask?.title ?? t("focusLabel")) : t("breakLabel")}
        </span>
        <span className="text-lg font-bold tabular-nums text-foreground">
          {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
        </span>
      </div>
      <button
        type="button"
        onClick={() => useFocusStore.getState().stop()}
        aria-label={t("stopAria")}
        className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
