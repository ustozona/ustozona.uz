import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useTasksStore } from "@/store/useTasksStore";
import { todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   FOKUS (POMODORO) — qurilma-lokal holat (localStorage persist,
   useQuotesStore qolipi). Server sync YOʻQ — shaxsiy, qurilmaga xos.

   `endsAt` — joriy bosqich (work/break) tugash vaqti (epoch ms).
   Chindan tik-tak `FocusEngine` componentida (setInterval), bu store
   faqat holatni saqlaydi. Pomodoro uzunliklari useSettingsStore.tasksSettings'da.

   Bosqich oʻtishlari (completeWorkAndStartBreak/completeBreak/stop) CAS
   (compare-and-swap) uslubida yozilgan — chaqiruvchi holatni oʻzgartirdimi
   yoki yoʻqmi (boolean) qaytaradi. Bu bir nechta brauzer tab'i ochiq
   boʻlganda (localStorage umumiy, lekin xotiradagi holat mustaqil)
   ikkalasi ham "vaqt tugadi" deb bir xil fokus daqiqasini ikki marta
   yozib qoʻyishining oldini oladi: faqat winner (`get().phase` hali
   eski qiymatda ekanini koʻrgan birinchi chaqiruvchi) fokus yozuvini
   yozadi, ikkinchisi no-op qiladi. `FocusEngine`dagi `storage` event
   tinglagichi ikkinchi tab'ni tezda (odatda <1s tik-tak oralig'idan
   ancha tez) sinxronlaydi, shu bilan poyga oynasi amalda yopiladi.
   ════════════════════════════════════════════════════════════════════ */

export type FocusPhase = "idle" | "work" | "break";

interface FocusState {
  activeTaskId: string | null;
  phase: FocusPhase;
  endsAt: number | null;
  /** Joriy bosqich boshlangan vaqt — progress va qisman kredit hisoblash uchun. */
  startedAt: number | null;
  /** Joriy sessiya identifikatori — diagnostika/kelajakdagi dedupe uchun. */
  sessionId: string | null;
  /** Oxirgi uzun tanaffusdan beri tugatilgan pomodorolar soni. */
  pomosInCycle: number;
  /** `pomosInCycle` qaysi kun uchun hisoblanganini belgilaydi — kun almashsa 0'dan boshlanadi. */
  cycleDate: string | null;
  /** Pauza boshlangan vaqt — bosqich hali tugamagan, faqat tik-tak muzlatilgan. `null` = pauzada emas. */
  pausedAt: number | null;

  /** Fokusni boshlaydi. Boshqa vazifada ish bosqichi aktiv boʻlsa, uning
   *  qisman (tugallanmagan) daqiqasini avval haqiqiy vazifasiga yozib qoʻyadi. */
  startWork: (taskId: string, minutes: number) => void;
  /** Joriy bosqichni muzlatadi — `endsAt` oʻzgarmaydi, faqat tik-tak toʻxtaydi. */
  pause: () => void;
  /** Pauzadan chiqadi — muzlagan vaqt hisobiga `endsAt`ni siljitadi, qolgan vaqt saqlanadi. */
  resume: () => void;
  /** Ish tugadi — keyingi tanaffusni boshlaydi (uzun/qisqa hisoblab) va toʻliq
   *  pomodoro daqiqasini vazifaga yozadi. `phase !== "work"` boʻlsa no-op (CAS). */
  completeWorkAndStartBreak: (longBreakEvery: number, shortMinutes: number, longMinutes: number) => boolean;
  /** Tanaffus tugadi — boʻsh holatga qaytadi. `phase !== "break"` boʻlsa no-op (CAS). */
  completeBreak: () => boolean;
  /** Foydalanuvchi bekor qildi — ish bosqichida boʻlsa, shu paytgacha oʻtgan
   *  qisman daqiqa baribir vazifaga yoziladi (butunlay yoʻqolmaydi). */
  stop: () => void;
}

function creditPartialWork(taskId: string | null, startedAt: number | null, at: number) {
  if (!taskId || startedAt == null) return;
  const minutes = Math.round((at - startedAt) / 60_000);
  if (minutes >= 1) useTasksStore.getState().addFocusEntry(taskId, minutes);
}

function nextCycleCount(pomosInCycle: number, cycleDate: string | null) {
  const today = todayKey();
  return cycleDate === today ? pomosInCycle : 0;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      activeTaskId: null,
      phase: "idle",
      endsAt: null,
      startedAt: null,
      sessionId: null,
      pomosInCycle: 0,
      cycleDate: null,
      pausedAt: null,

      startWork: (taskId, minutes) => {
        const s = get();
        if (s.phase === "work" && s.activeTaskId && s.activeTaskId !== taskId) {
          creditPartialWork(s.activeTaskId, s.startedAt, Date.now());
        }
        const now = Date.now();
        set({
          activeTaskId: taskId,
          phase: "work",
          startedAt: now,
          endsAt: now + minutes * 60_000,
          sessionId: crypto.randomUUID(),
          pomosInCycle: nextCycleCount(s.pomosInCycle, s.cycleDate),
          cycleDate: todayKey(),
          pausedAt: null,
        });
      },

      pause: () => {
        const s = get();
        if (s.phase === "idle" || s.pausedAt != null) return;
        set({ pausedAt: Date.now() });
      },

      resume: () => {
        const s = get();
        if (s.phase === "idle" || s.pausedAt == null || s.endsAt == null) return;
        const frozenMs = Date.now() - s.pausedAt;
        set({ endsAt: s.endsAt + frozenMs, pausedAt: null });
      },

      completeWorkAndStartBreak: (longBreakEvery, shortMinutes, longMinutes) => {
        const s = get();
        if (s.phase !== "work") return false;
        const now = Date.now();
        if (s.activeTaskId && s.startedAt != null) {
          const minutes = Math.round((now - s.startedAt) / 60_000);
          if (minutes >= 1) useTasksStore.getState().addFocusEntry(s.activeTaskId, minutes);
        }
        const count = nextCycleCount(s.pomosInCycle, s.cycleDate) + 1;
        const isLong = count >= longBreakEvery;
        set({
          phase: "break",
          startedAt: now,
          endsAt: now + (isLong ? longMinutes : shortMinutes) * 60_000,
          sessionId: crypto.randomUUID(),
          pomosInCycle: isLong ? 0 : count,
          cycleDate: todayKey(),
          pausedAt: null,
        });
        return true;
      },

      completeBreak: () => {
        const s = get();
        if (s.phase !== "break") return false;
        set({ phase: "idle", endsAt: null, startedAt: null, activeTaskId: null, sessionId: null, pausedAt: null });
        return true;
      },

      stop: () => {
        const s = get();
        if (s.phase === "idle") return;
        if (s.phase === "work") creditPartialWork(s.activeTaskId, s.startedAt, Date.now());
        set({ phase: "idle", endsAt: null, startedAt: null, activeTaskId: null, sessionId: null, pausedAt: null });
      },
    }),
    {
      name: "ustozona-focus-v1",
      version: 2,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<FocusState>;
        return {
          activeTaskId: p.activeTaskId ?? null,
          phase: p.phase ?? "idle",
          endsAt: p.endsAt ?? null,
          startedAt: p.startedAt ?? null,
          sessionId: p.sessionId ?? null,
          pomosInCycle: p.pomosInCycle ?? 0,
          cycleDate: p.cycleDate ?? null,
          pausedAt: p.pausedAt ?? null,
        } as FocusState;
      },
    }
  )
);
