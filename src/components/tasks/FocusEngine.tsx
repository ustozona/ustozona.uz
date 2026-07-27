"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useFocusStore } from "@/store/useFocusStore";
import { useTasksStore } from "@/store/useTasksStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useNotificationsStore } from "@/store/useNotificationsStore";

/* ════════════════════════════════════════════════════════════════════
   FOKUS DVIGATELI — koʻrinmas, dashboard layout ildizida BIR MARTA
   mount boʻladi (Header koʻrinishidan mustaqil — headerni birorta sahifa
   yashirsa ham fokus toʻgʻri yakunlanaveradi). Yagona vazifasi: 1s
   tik-tak, bosqich tugaganda avto oʻtish (ish→tanaffus→boʻsh) va shu
   bilan bogʻliq toast/bildirishnoma. Haqiqiy holat va fokus-daqiqa
   yozuvi useFocusStore ichida (CAS uslubida, ko'p-tab xavfsiz).
   ════════════════════════════════════════════════════════════════════ */

export default function FocusEngine() {
  const t = useTranslations("FocusTimer");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const phase = useFocusStore((s) => s.phase);
  const endsAt = useFocusStore((s) => s.endsAt);
  const pausedAt = useFocusStore((s) => s.pausedAt);
  const activeTaskId = useFocusStore((s) => s.activeTaskId);
  const tasksSettings = useSettingsStore((s) => s.tasksSettings);
  const activeTaskTitle = useTasksStore((s) =>
    activeTaskId ? s.items.find((x) => x.id === activeTaskId)?.title : undefined
  );

  // Boshqa brauzer tab'ida holat oʻzgarsa, joriy tab'ni tezda sinxronlaydi —
  // shu bilan ikki tab bir xil sessiyani ikki marta yakunlash poygasi qisqaradi.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "ustozona-focus-v1") void useFocusStore.persist.rehydrate();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (phase === "idle" || pausedAt != null) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase, pausedAt]);

  // Brauzer tab sarlavhasida qolgan vaqtni koʻrsatadi — foydalanuvchi boshqa
  // tab'da boʻlganda ham taymerni koʻz oldida saqlaydi.
  useEffect(() => {
    if (!mounted) return;
    if (phase === "idle") {
      document.title = "Ustozona";
      return;
    }
    const remainingMs = Math.max(0, (endsAt ?? now) - now);
    const totalSec = Math.ceil(remainingMs / 1000);
    const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const ss = String(totalSec % 60).padStart(2, "0");
    const label = phase === "work" ? activeTaskTitle ?? t("focusLabel") : t("breakLabel");
    const pauseMark = pausedAt != null ? " ⏸" : "";
    document.title = `${mm}:${ss}${pauseMark} · ${label} — Ustozona`;
    return () => {
      document.title = "Ustozona";
    };
  }, [mounted, phase, endsAt, now, pausedAt, activeTaskTitle, t]);

  useEffect(() => {
    if (!mounted || phase === "idle" || pausedAt != null || endsAt == null || now < endsAt) return;
    if (phase === "work") {
      const taskId = useFocusStore.getState().activeTaskId;
      const title = taskId ? useTasksStore.getState().items.find((x) => x.id === taskId)?.title : undefined;
      const won = useFocusStore
        .getState()
        .completeWorkAndStartBreak(
          tasksSettings.longBreakEvery,
          tasksSettings.shortBreakMinutes,
          tasksSettings.longBreakMinutes
        );
      if (won) {
        toast.success(t("workDoneToast"));
        useNotificationsStore.getState().notify({
          kind: "system",
          title: t("workDoneToast"),
          body: title,
          href: "/dashboard/tasks",
        });
      }
    } else {
      const won = useFocusStore.getState().completeBreak();
      if (won) toast.info(t("breakDoneToast"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, now, phase, endsAt, tasksSettings]);

  return null;
}
