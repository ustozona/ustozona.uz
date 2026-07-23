import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ════════════════════════════════════════════════════════════════════
   FOKUS (POMODORO) — qurilma-lokal holat (localStorage persist,
   useQuotesStore qolipi). Server sync YOʻQ — shaxsiy, qurilmaga xos.

   `endsAt` — joriy bosqich (work/break) tugash vaqti (epoch ms).
   Chindan tik-tak `FocusTimerPill` componentida (setInterval), bu store
   faqat holatni saqlaydi. Pomodoro uzunliklari useSettingsStore.tasksSettings'da.
   ════════════════════════════════════════════════════════════════════ */

export type FocusPhase = "idle" | "work" | "break";

interface FocusState {
  activeTaskId: string | null;
  phase: FocusPhase;
  endsAt: number | null;
  /** Oxirgi uzun tanaffusdan beri tugatilgan pomodorolar soni. */
  pomosInCycle: number;

  startWork: (taskId: string, minutes: number) => void;
  /** Ish tugadi — keyingi tanaffusni boshlaydi (uzun/qisqa hisoblab). */
  completeWorkAndStartBreak: (longBreakEvery: number, shortMinutes: number, longMinutes: number) => void;
  completeBreak: () => void;
  /** Foydalanuvchi bekor qildi — joriy pomodoro hisoblanmaydi. */
  stop: () => void;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set) => ({
      activeTaskId: null,
      phase: "idle",
      endsAt: null,
      pomosInCycle: 0,

      startWork: (taskId, minutes) =>
        set({ activeTaskId: taskId, phase: "work", endsAt: Date.now() + minutes * 60_000 }),

      completeWorkAndStartBreak: (longBreakEvery, shortMinutes, longMinutes) =>
        set((s) => {
          const count = s.pomosInCycle + 1;
          const isLong = count >= longBreakEvery;
          return {
            phase: "break",
            endsAt: Date.now() + (isLong ? longMinutes : shortMinutes) * 60_000,
            pomosInCycle: isLong ? 0 : count,
          };
        }),

      completeBreak: () => set({ phase: "idle", endsAt: null, activeTaskId: null }),

      stop: () => set({ phase: "idle", endsAt: null, activeTaskId: null }),
    }),
    {
      name: "ustozona-focus-v1",
      version: 1,
      migrate: (persisted) => persisted as FocusState,
    }
  )
);
